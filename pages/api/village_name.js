import pool from "@/lib/db";

export default async function handler(req, res) {
    const { district, sub_dist } = req.query;
    if (!district || !sub_dist) {
        return res.status(400).json({ error: 'Missing query parameters' });
    }
    try{
        const result = await pool.query('SELECT DISTINCT name FROM kerala_districts WHERE district = $1 AND sub_dist = $2 ORDER BY NAME;',[district, sub_dist]);
        res.status(200).json(result.rows);
    } catch(err){
        console.error("Error fetching villages: ", err);
        res.status(500).json({error: "Internal Server Error"});
    }
}