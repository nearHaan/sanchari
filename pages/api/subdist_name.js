import pool from "@/lib/db";

export default async function handler(req, res) {
    const { district } = req.query;
    if (!district) {
        return res.status(400).json({ error: 'Missing "district" query parameter' });
    }
    try{
        const result = await pool.query('SELECT DISTINCT SUB_DIST FROM kerala_districts WHERE district = $1 ORDER BY SUB_DIST;',[district]);
        res.status(200).json(result.rows);
    } catch(err){
        console.error("Error fetching taluks: ", err);
        res.status(500).json({error: "Internal Server Error"});
    }
}