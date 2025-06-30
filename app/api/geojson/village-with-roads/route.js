import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const district = searchParams.get('district');
  const sub_dist = searchParams.get('sub_dist');
  const name = searchParams.get('name');

  if (!district || !sub_dist || !name) {
    return NextResponse.json({ error: 'Missing query parameters' }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    const villageResult = await client.query(
      `SELECT geom
       FROM kerala_districts
       WHERE name = $1 AND sub_dist = $2 AND district = $3
       LIMIT 1`,
      [name, sub_dist, district]
    );

    if (villageResult.rowCount === 0) {
      return NextResponse.json({ error: 'Village not found' }, { status: 404 });
    }

    const villageGeom = villageResult.rows[0].geom;

    const villageGeojsonResult = await client.query(
      `SELECT jsonb_build_object(
         'type', 'Feature',
         'geometry', ST_AsGeoJSON(geom)::jsonb,
         'properties', jsonb_build_object(
           'name', name,
           'district', district,
           'sub_dist', sub_dist
         )
       ) AS feature
       FROM kerala_districts
       WHERE name = $1 AND sub_dist = $2 AND district = $3`,
      [name, sub_dist, district]
    );

    const roadsResult = await client.query(
      `SELECT jsonb_build_object(
         'type', 'Feature',
         'geometry', ST_AsGeoJSON(geom)::jsonb,
         'properties', jsonb_build_object(
           'roadname', roadname,
           'district', district
         )
       ) AS feature
       FROM roads
       WHERE ST_Intersects(geom, $1)`,
      [villageGeom]
    );

    return NextResponse.json({
      type: 'FeatureCollection',
      features: [
        villageGeojsonResult.rows[0].feature,
        ...roadsResult.rows.map(r => r.feature)
      ]
    });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
}
