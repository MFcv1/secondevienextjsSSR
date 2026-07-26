'use strict';

function sweeperError(code, detail = null) {
    const error = new Error(detail ? `${code}:${detail}` : code);
    error.code = code;
    if (detail) error.detail = detail;
    return error;
}

function createBoundedWorkerSweeper({
    listEligible,
    processItem,
    clock,
    pageSize = 25,
    maxPages = 4
}) {
    if (
        typeof listEligible !== 'function' ||
        typeof processItem !== 'function' ||
        typeof clock?.now !== 'function' ||
        typeof clock?.nowMillis !== 'function' ||
        !Number.isSafeInteger(pageSize) ||
        pageSize < 1 ||
        pageSize > 50 ||
        !Number.isSafeInteger(maxPages) ||
        maxPages < 1 ||
        maxPages > 20
    ) {
        throw sweeperError('COMMERCE_SWEEPER_DEPENDENCY_INVALID');
    }

    async function run() {
        const nowMillis = clock.nowMillis();
        const now = clock.now();
        let cursor = null;
        let pages = 0;
        let processed = 0;
        const failures = [];

        while (pages < maxPages) {
            const page = await listEligible({
                now,
                nowMillis,
                limit: pageSize,
                cursor
            });
            if (
                !page ||
                !Array.isArray(page.items) ||
                page.items.length > pageSize
            ) {
                throw sweeperError('COMMERCE_SWEEPER_PAGE_INVALID');
            }
            pages += 1;
            for (const item of page.items) {
                if (!item || typeof item.id !== 'string' || item.id.length < 8) {
                    throw sweeperError('COMMERCE_SWEEPER_ITEM_INVALID');
                }
                try {
                    await processItem(item);
                    processed += 1;
                } catch (error) {
                    failures.push({
                        id: item.id,
                        code: String(error?.code || error?.message || 'unknown').slice(0, 200)
                    });
                }
            }
            if (!page.nextCursor || page.items.length === 0) break;
            if (page.nextCursor === cursor) throw sweeperError('COMMERCE_SWEEPER_CURSOR_STALLED');
            cursor = page.nextCursor;
        }
        return {
            pages,
            processed,
            failures,
            exhausted: pages === maxPages && cursor !== null,
            nextCursor: cursor
        };
    }

    return Object.freeze({ run });
}

module.exports = { createBoundedWorkerSweeper };
