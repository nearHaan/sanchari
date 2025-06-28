import pool from '@/lib/db'; // assumes you set up a db.js with pg Pool

export default async function handler(req, res) {
  try {
    const result = await pool.query('SELECT DISTINCT district FROM geo_features ORDER BY district;');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
