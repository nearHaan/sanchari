import pool from '@/lib/db';

export default async function handler(req, res) {
  try {
    const result = await pool.query('SELECT DISTINCT district FROM kerala_districts ORDER BY district;');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
