import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(req) {
  const { id, updatedGeoJSON } = await req.json();

  try {
    await pool.query(
      `UPDATE roads SET geom = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) WHERE roadid = $2`,
      [JSON.stringify(updatedGeoJSON.geometry), id]
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  }
}
