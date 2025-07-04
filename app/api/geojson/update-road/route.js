import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(req) {
  try {
    const { id, updatedGeoJSON, edited_by, edit_reason } = await req.json();

    await pool.query(
      `INSERT INTO roads (
         roadid, geom, edited_by, edit_reason
       ) VALUES (
         $1, ST_SetSRID(ST_GeomFromGeoJSON($2), 4326), $3, $4
       )`,
      [id, JSON.stringify(updatedGeoJSON.geometry), edited_by, edit_reason]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to insert road version:", error);
    return NextResponse.json(
      { error: "Failed to update road geometry" },
      { status: 500 }
    );
  }
}
