// Vercel Serverless: list, add, and remove slots (Supabase). No localStorage.
const { createClient } = require('@supabase/supabase-js');

function cors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function supabase() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return createClient(url, key);
}

module.exports = async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const db = supabase();

        if (req.method === 'GET') {
            const { data, error } = await db.from('available_slots').select('*').order('date').order('time');
            if (error) throw error;
            // Map to same shape as old localStorage: id, date, time, duration, booked
            const slots = (data || []).map((r) => ({
                id: r.id,
                date: r.date,
                time: r.time,
                duration: r.duration ?? 1,
                booked: !!r.booked
            }));
            return res.status(200).json(slots);
        }

        if (req.method === 'POST') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
            const { instructorPassword, date, times } = body;
            if (process.env.INSTRUCTOR_PASSWORD && instructorPassword !== process.env.INSTRUCTOR_PASSWORD) {
                return res.status(401).json({ error: 'Incorrect instructor password' });
            }
            if (!date || !Array.isArray(times) || times.length === 0) {
                return res.status(400).json({ error: 'Missing date or times' });
            }
            // Remove unbooked slots for this date
            const { error: delErr } = await db.from('available_slots').delete().eq('date', date).eq('booked', false);
            if (delErr) throw delErr;
            // Insert new slots
            const rows = times.map((time) => ({ date, time, duration: 1, booked: false }));
            const { error: insertErr } = await db.from('available_slots').insert(rows);
            if (insertErr) throw insertErr;
            return res.status(200).json({ ok: true });
        }

        if (req.method === 'DELETE') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
            const { instructorPassword, slotId } = body;
            if (process.env.INSTRUCTOR_PASSWORD && instructorPassword !== process.env.INSTRUCTOR_PASSWORD) {
                return res.status(401).json({ error: 'Incorrect instructor password' });
            }
            if (!slotId) return res.status(400).json({ error: 'Missing slotId' });
            const { error } = await db.from('available_slots').delete().eq('id', slotId);
            if (error) throw error;
            return res.status(200).json({ ok: true });
        }
    } catch (e) {
        console.error('slots API error', e);
        return res.status(500).json({ error: e.message || 'Server error' });
    }
};
