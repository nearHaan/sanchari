import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { setSession } from "@/lib/auth";

export async function POST(req) {
  const { username, password } = await req.json();

  const client = await pool.connect();
  try {
    const result = await client.query("SELECT * FROM users WHERE username=$1", [username]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    setSession(user.username);
    return NextResponse.json({ message: "Login successful" });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
}