// Vercel Serverless: create a booking (mark slot booked + insert row). No localStorage.
const { createClient } = require('@supabase/supabase-js');

function cors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const db = supabase();
        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
        const { slotId, customerName, customerEmail, customerPhone, sessionType, totalPrice, notes } = body;

        if (!slotId || !customerName || !customerEmail || sessionType == null || totalPrice == null) {
            return res.status(400).json({ error: 'Missing required fields: slotId, customerName, customerEmail, sessionType, totalPrice' });
        }

        const { data: slot, error: slotErr } = await db.from('available_slots').select('*').eq('id', slotId).single();
        if (slotErr || !slot) return res.status(404).json({ error: 'Slot not found' });
        if (slot.booked) return res.status(409).json({ error: 'Slot is already booked' });

        await db.from('available_slots').update({ booked: true }).eq('id', slotId);
        const { error: bookErr } = await db.from('bookings').insert({
            slot_id: slotId,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone || null,
            session_type: sessionType,
            total_price: totalPrice,
            notes: notes || null
        });
        if (bookErr) throw bookErr;

        return res.status(200).json({ ok: true, slot: { id: slot.id, date: slot.date, time: slot.time, duration: slot.duration ?? 1 } });
    } catch (e) {
        console.error('bookings API error', e);
        return res.status(500).json({ error: e.message || 'Server error' });
    }
};
