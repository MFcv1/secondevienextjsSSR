import {
  HOSTED_URL,
  SANDBOX_PROJECT,
  assertSandbox,
  parseArgs,
  writeEvidence,
} from './catalog-sandbox-lib.mjs';

const args = parseArgs();
const projectId = String(args.project || SANDBOX_PROJECT);
assertSandbox(projectId, HOSTED_URL);
const requests = Math.max(2, Math.min(Number(args.requests || 40), 200));
const runId = String(args.run || Date.now()).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
const url = `${HOSTED_URL}/api/catalog?scope=cards&limit=1&__cdn=${encodeURIComponent(runId)}`;
const samples = [];
for (let index = 0; index < requests; index += 1) {
  const startedAt = performance.now();
  const response = await fetch(url);
  await response.arrayBuffer();
  const cacheHeader = response.headers.get('x-cache') || response.headers.get('cf-cache-status') || '';
  const age = Number(response.headers.get('age') || 0);
  samples.push({
    status: response.status,
    durationMs: Math.round(performance.now() - startedAt),
    etag: response.headers.get('etag'),
    cacheControl: response.headers.get('cache-control'),
    age,
    cacheHeader,
    hit: age > 0 || /hit/i.test(cacheHeader),
  });
  if (index === 0) await new Promise((resolve) => setTimeout(resolve, 1100));
}
const warmed = samples.slice(1);
const etags = new Set(samples.map((sample) => sample.etag).filter(Boolean));
const hitRatio = warmed.filter((sample) => sample.hit).length / warmed.length;
const evidence = {
  ok: samples.every((sample) => sample.status === 200)
    && samples.every((sample) => /s-maxage=120/.test(sample.cacheControl || ''))
    && etags.size === 1
    && hitRatio >= 0.95,
  projectId,
  requests,
  runId,
  hitRatio,
  etagStable: etags.size === 1,
  samples,
};
evidence.evidencePath = writeEvidence('catalog-cdn', evidence);
console.log(JSON.stringify(evidence, null, 2));
if (!evidence.ok) process.exitCode = 1;
