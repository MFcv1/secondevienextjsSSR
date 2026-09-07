// Do not release the publication UI while a sibling upload can still mutate
// the product. On failure stop taking jobs, then drain every in-flight worker.
export async function runWithConcurrency(items, limit, worker) {
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError('Invalid concurrency');
  let cursor = 0;
  let failure;
  let failed = false;
  const results = new Array(items.length);
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (!failed && cursor < items.length) {
      const index = cursor++;
      try {
        results[index] = await worker(items[index], index);
      } catch (error) {
        if (!failed) failure = error;
        failed = true;
      }
    }
  }));
  if (failed) throw failure;
  return results;
}
