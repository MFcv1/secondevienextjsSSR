import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { googlePages, metricUrl } from '../../../src/lib/server/functionMetricsCore.mjs';
const directory = new URL('./', import.meta.url);
const token = execFileSync('gcloud', ['auth', 'print-access-token'], {encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const end = new Date(Date.now()-300000).toISOString();
const start = new Date(Date.parse(end)-86400000).toISOString();
const results = {};
for (const [metric, aligner] of [
  ['request_count','ALIGN_SUM'],
  ['container/cpu/utilizations','ALIGN_PERCENTILE_95'],
  ['container/memory/utilizations','ALIGN_PERCENTILE_95'],
  ['container/instance_count','ALIGN_MAX'],
  ['container/max_request_concurrencies','ALIGN_PERCENTILE_95'],
]) {
  const url = metricUrl(`run.googleapis.com/${metric}`,start,end,300,{reducer:'REDUCE_MAX'});
  url.searchParams.set('aggregation.perSeriesAligner',aligner);
  if(metric==='request_count') url.searchParams.set('aggregation.crossSeriesReducer','REDUCE_SUM');
  try {
    const series = await googlePages(url,token,'timeSeries');
    results[metric] = series.map(s=>({service:s.resource.labels.service_name,region:s.resource.labels.location,
      points:s.points.length, maximum:Math.max(...s.points.map(p=>Number(p.value.doubleValue??p.value.int64Value??0))),
      total:metric==='request_count'?s.points.reduce((a,p)=>a+Number(p.value.int64Value??0),0):undefined}));
  } catch(e) { results[metric] = {error:e.message}; }
}
await writeFile(new URL('resources-24h.json',directory),JSON.stringify({start,end,bucketSeconds:300,results},null,2)+'\n');
const base='https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app';
const probes=[];
for(const path of ['/','/','/api/catalog/version']) {
  const t=performance.now(); const response=await fetch(base+path,{signal:AbortSignal.timeout(30000)});
  const ttfbMs=performance.now()-t; const body=await response.text();
  probes.push({path,status:response.status,ttfbMs,totalMs:performance.now()-t,decodedBytes:Buffer.byteLength(body),
    headers:Object.fromEntries(['cache-control','age','etag','x-cache','x-nextjs-cache','content-encoding','content-length','vary'].map(k=>[k,response.headers.get(k)])),
    scripts:path==='/'?[...body.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m=>m[1]):undefined});
}
await writeFile(new URL('public-probes.json',directory),JSON.stringify({at:new Date().toISOString(),probes},null,2)+'\n');
console.log(JSON.stringify({resources:results,probes},null,2));
