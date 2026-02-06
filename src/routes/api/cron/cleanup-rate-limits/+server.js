// CRON: Cleanup Rate Limits (HOURLY)
import { query } from '$lib/db.js';
import { json } from '@sveltejs/kit';

const CRON_SECRET = process.env.CRON_SECRET || '';

function verifyCronAuth(request) {
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return false;
    }
    return true;
}

export async function GET({ request }) {
    if (!verifyCronAuth(request)) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await query(
            `DELETE FROM login_rate_limits WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)`
        );

        return json({
            success: true,
            deleted: {
                login_rate_limits: result.affectedRows || 0
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Cron] Error cleanup rate limits:', error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
}