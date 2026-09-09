'use strict';

const PROJECT = 'secondevienextjsssr';
const MAX_MONTHS = 36;
const validMonth = value => typeof value === 'string' && /^20\d{2}-(0[1-9]|1[0-2])$/.test(value);
const monthKey = now => new Date(now).toISOString().slice(0, 7);
const earliestMonth = now => {
    const date = new Date(now);
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - MAX_MONTHS + 1, 1)).toISOString().slice(0, 7);
};
const retained = (month, now) => validMonth(month) && month >= earliestMonth(now) && month <= monthKey(now);
const finiteCost = value => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 1e7;

function parseBudgetMessage(message, config, now = Date.now()) {
    if (!config.account || !config.budget) throw new Error('billing_not_configured');
    if (message?.attributes?.billingAccountId !== config.account || message?.attributes?.budgetId !== config.budget
        || message?.attributes?.schemaVersion !== '1.0') throw new Error('billing_source_mismatch');
    if (typeof message.data !== 'string' || message.data.length > 16000) throw new Error('invalid_budget_message');
    const body = JSON.parse(Buffer.from(message.data, 'base64').toString('utf8'));
    const start = Date.parse(body.costIntervalStart);
    const published = Date.parse(message.publishTime);
    const month = Number.isFinite(start) ? monthKey(start) : '';
    // This subscription is bound to a MONTH/EUR/project-only/all-services/all-credits budget.
    if (!retained(month, now) || new Date(start).getUTCDate() !== 1
        || !finiteCost(body.costAmount) || body.currencyCode !== 'EUR'
        || !Number.isFinite(published) || published < start || published > now + 300000) {
        throw new Error('invalid_budget_message');
    }
    const end = Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 1) + 86400000;
    return { month, cost: body.costAmount, currency: 'EUR', source: 'google_budget',
        sourceUpdatedAtMs: published, intervalStartMs: start, complete: published >= end };
}

function readTraffic(history, month) {
    const bucket = history?.buckets?.[`month_${month}`];
    if (history?.schemaVersion !== 1 || !Number.isSafeInteger(bucket?.sessions) || bucket.sessions < 0
        || !Number.isFinite(history.generatedAtMs) || !Number.isFinite(history.coverageStartMs)) return null;
    const start = Date.parse(`${month}-01T00:00:00Z`);
    const end = Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 1);
    return { sessions: bucket.sessions, updatedAtMs: history.generatedAtMs,
        complete: history.coverageStartMs <= start - 14 * 3600000 && history.generatedAtMs >= end + 14 * 3600000 };
}

function mergeCosts(current, entries, history, now = Date.now()) {
    const months = Object.fromEntries(Object.entries(current?.months || {}).filter(([key]) => retained(key, now)));
    let changed = false;
    for (const row of entries) {
        const prior = months[row.month];
        if (row.source !== 'google_budget' || (prior?.source === 'google_budget' && prior.sourceUpdatedAtMs >= row.sourceUpdatedAtMs)) continue;
        months[row.month] = { ...row, traffic: readTraffic(history, row.month) || prior?.traffic || null };
        changed = true;
    }
    if (!changed) return null;
    // Capture closed-month aggregate traffic before the analytics rolling window drops it.
    for (const [month, row] of Object.entries(months)) {
        const fresh = readTraffic(history, month);
        if (fresh) row.traffic = fresh;
    }

    return { schemaVersion: 1, project: PROJECT, currency: 'EUR', months, updatedAtMs: now,
        expiresAt: new Date(now + 1140 * 86400000),
    };
}

function correlation(rows) {
    const paired = rows.filter(row => row.complete && row.traffic?.complete && row.traffic.sessions > 0);
    if (paired.length < 6) return { value: null, samples: paired.length, reason: 'insufficient_months' };
    const meanX = paired.reduce((sum, row) => sum + row.traffic.sessions, 0) / paired.length;
    const meanY = paired.reduce((sum, row) => sum + row.cost, 0) / paired.length;
    let covariance = 0, varianceX = 0, varianceY = 0;
    for (const row of paired) {
        const x = row.traffic.sessions - meanX, y = row.cost - meanY;
        covariance += x * y; varianceX += x * x; varianceY += y * y;
    }
    if (!varianceX || !varianceY) return { value: null, samples: paired.length, reason: 'no_variation' };
    return { value: Math.max(-1, Math.min(1, covariance / Math.sqrt(varianceX * varianceY))), samples: paired.length, reason: null };
}

function buildCostView(snapshot, history, now = Date.now(), configured = false) {
    const rows = [];
    const records = snapshot?.schemaVersion === 1 && snapshot.project === PROJECT ? snapshot.months || {} : {};
    for (const month of Object.keys(records).filter(key => retained(key, now)).sort().reverse()) {
        const record = records[month];
        if (record.source !== 'google_budget') continue;
        const valid = record?.currency === 'EUR' && finiteCost(record.cost);
        if (!valid) continue;
        const traffic = readTraffic(history, month) || record?.traffic || null;
        const complete = valid && record.complete === true && month < monthKey(now);
        rows.push({ month, cost: valid ? record.cost : null, complete,
            source: valid ? record.source : null, updatedAtMs: valid ? record.sourceUpdatedAtMs : null,
            traffic, costPerThousand: complete && traffic?.complete && traffic.sessions > 0 ? record.cost / traffic.sessions * 1000 : null });
    }
    return { project: PROJECT, currency: 'EUR', fetchedAtMs: now, configured, rows,
        correlation: correlation(rows) };
}

module.exports = { PROJECT, MAX_MONTHS, parseBudgetMessage, mergeCosts, readTraffic, correlation, buildCostView };
