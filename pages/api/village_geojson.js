import pool from '@/lib/db';

export default async function handler(req, res) {
  const { district, sub_dist, name } = req.query;

  if (!district || !sub_dist || !name) {
    return res.status(400).json({ error: 'Missing query parameters' });
  }

  try {
    const result = await pool.query(
      `SELECT jsonb_build_object(
         'type', 'FeatureCollection',
         'features', jsonb_agg(
           jsonb_build_object(
             'type', 'Feature',
             'geometry', ST_AsGeoJSON(geom)::jsonb,
             'properties', jsonb_build_object(
               'name', name,
               'district', district,
               'sub_dist', sub_dist
             )
           )
         )
       ) AS geojson
       FROM kerala_districts
       WHERE name = $1 AND sub_dist = $2 AND district = $3;`,
      [name, sub_dist, district]
    );

    if (!result.rows[0].geojson) {
      return res.status(404).json({ error: 'Feature not found' });
    }

    res.status(200).json(result.rows[0].geojson);
  } catch (err) {
    console.error('Error fetching GeoJSON:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
