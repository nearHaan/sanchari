import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { roadid } = await params;

  try {
    const result = await pool.query(
      `SELECT roadid, valid_from, valid_to, edited_by, edit_reason
       FROM roads
       WHERE roadid = $1
       ORDER BY valid_from DESC`,
      [roadid]
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Error fetching road version history:", err);
    return NextResponse.json(
      { error: "Failed to fetch version history" },
      { status: 500 }
    );
  }
}
