let requests = 0;
export function reportPublicRuntimePerformance(measurement) {
  if (process.env.PUBLIC_RUNTIME_METRICS !== 'true') return;
  console.info('public_runtime_perf', {
    ...measurement,
    firstMeasuredRequest: requests++ === 0,
    rssBytes: process.memoryUsage().rss,
    uptimeSeconds: Math.round(process.uptime()),
  });
}
