// CRON: Cleanup Pin Login Logs (DAILY)
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
        const attemptsResult = await query(
            `DELETE FROM pin_login_attempts WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)`
        );

        const historyResult = await query(
            `DELETE FROM pin_history WHERE created_at < DATE_SUB(NOW(), INTERVAL 365 DAY)`
        );

        return json({
            success: true,
            deleted: {
                pin_login_attempts: attemptsResult.affectedRows || 0,
                pin_history: historyResult.affectedRows || 0
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Cron] Error cleanup pin logs:', error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
}