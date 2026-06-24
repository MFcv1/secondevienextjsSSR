import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DEFAULT_PROJECT = 'secondevienextjsssr';
const DEFAULT_WEB_APP_ID = '1:231220287936:web:fb5eebec3b0fa2281ed025';

const parseArgs = () => {
  const args = new Map();
  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith('--')) continue;
    const [key, ...valueParts] = arg.slice(2).split('=');
    args.set(key, valueParts.length ? valueParts.join('=') : 'true');
  }
  return args;
};

const assertSafeCliArgs = (args) => {
  for (const arg of args) {
    if (!/^[\w:@./=-]+$/.test(String(arg))) {
      throw new Error(`Unsafe CLI argument: ${arg}`);
    }
  }
};

const run = (command, args) => {
  assertSafeCliArgs([command, ...args]);
  if (process.platform === 'win32') {
    const commandLine = [command, ...args].join(' ');
    return execFileSync('cmd.exe', ['/d', '/c', commandLine], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  }

  return execFileSync(command, args, {
  cwd: ROOT,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
};

const readDefaultProject = () => {
  try {
    const firebaserc = JSON.parse(fs.readFileSync(path.join(ROOT, '.firebaserc'), 'utf8'));
    return firebaserc?.projects?.default || DEFAULT_PROJECT;
  } catch {
    return DEFAULT_PROJECT;
  }
};

const requestJson = async (url, token, projectId) => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-goog-user-project': projectId,
    },
  });
  const body = await response.text();
  let parsed = null;
  try {
    parsed = body ? JSON.parse(body) : null;
  } catch {
    parsed = { raw: body };
  }
  if (!response.ok) {
    const message = parsed?.error?.message || body || `${response.status} ${response.statusText}`;
    const error = new Error(message);
    error.status = response.status;
    error.details = parsed;
    throw error;
  }
  return parsed;
};

const getWebAppId = () => {
  try {
    const apps = JSON.parse(run('firebase', ['apps:list', 'WEB', '--project', projectId, '--json', '--non-interactive']));
    return apps?.result?.[0]?.appId || DEFAULT_WEB_APP_ID;
  } catch {
    return DEFAULT_WEB_APP_ID;
  }
};

const summarizeSeries = (timeSeries = []) => {
  const summary = {};
  for (const series of timeSeries) {
    const serviceId = series?.resource?.labels?.service_id || 'unknown-service';
    const result = series?.metric?.labels?.result || 'unknown-result';
    const security = series?.metric?.labels?.security || 'unknown-security';
    const appId = series?.metric?.labels?.app_id || 'unknown-app';
    const value = Number(series?.points?.[0]?.value?.int64Value || 0);
    const key = `${serviceId} | ${security} | ${result} | ${appId}`;
    summary[key] = (summary[key] || 0) + value;
  }
  return Object.fromEntries(Object.entries(summary).sort(([a], [b]) => a.localeCompare(b)));
};

const getTimeSeries = async ({ token, projectId, metricType, hours }) => {
  const end = new Date();
  const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
  const url = new URL(`https://monitoring.googleapis.com/v3/projects/${projectId}/timeSeries`);
  url.searchParams.set('filter', `metric.type="${metricType}"`);
  url.searchParams.set('interval.startTime', start.toISOString());
  url.searchParams.set('interval.endTime', end.toISOString());
  url.searchParams.set('aggregation.alignmentPeriod', `${hours * 60 * 60}s`);
  url.searchParams.set('aggregation.perSeriesAligner', 'ALIGN_SUM');
  const data = await requestJson(url, token, projectId);
  return summarizeSeries(data.timeSeries || []);
};

const args = parseArgs();
const projectId = args.get('project') || readDefaultProject();
const token = run('gcloud', ['auth', 'print-access-token']);
const project = JSON.parse(run('gcloud', ['projects', 'describe', projectId, '--format=json']));
const projectNumber = project.projectNumber;
const webAppId = args.get('web-app-id') || getWebAppId();
const encodedWebAppId = encodeURIComponent(webAppId);

const serviceState = await requestJson(
  `https://firebaseappcheck.googleapis.com/v1/projects/${projectNumber}/services`,
  token,
  projectId,
);
const recaptchaConfig = await requestJson(
  `https://firebaseappcheck.googleapis.com/v1/projects/${projectNumber}/apps/${encodedWebAppId}/recaptchaV3Config`,
  token,
  projectId,
);
const debugTokens = await requestJson(
  `https://firebaseappcheck.googleapis.com/v1/projects/${projectNumber}/apps/${encodedWebAppId}/debugTokens`,
  token,
  projectId,
);
const metricDescriptors = await requestJson(
  `https://monitoring.googleapis.com/v3/projects/${projectId}/metricDescriptors?filter=${encodeURIComponent('metric.type=starts_with("firebaseappcheck.googleapis.com")')}`,
  token,
  projectId,
);

const metrics24h = await getTimeSeries({
  token,
  projectId,
  metricType: 'firebaseappcheck.googleapis.com/services/verification_count',
  hours: 24,
});
const metrics7d = await getTimeSeries({
  token,
  projectId,
  metricType: 'firebaseappcheck.googleapis.com/services/verification_count',
  hours: 24 * 7,
});

const output = {
  generatedAt: new Date().toISOString(),
  projectId,
  projectNumber,
  webAppId,
  appCheckServices: serviceState.services || [],
  recaptchaV3Config: {
    name: recaptchaConfig.name,
    siteSecretSet: recaptchaConfig.siteSecretSet === true,
    tokenTtl: recaptchaConfig.tokenTtl || null,
    minValidScore: recaptchaConfig.minValidScore ?? null,
  },
  debugTokens: (debugTokens.debugTokens || []).map((tokenInfo) => ({
    name: tokenInfo.name,
    displayName: tokenInfo.displayName,
    updateTime: tokenInfo.updateTime,
  })),
  metricDescriptors: (metricDescriptors.metricDescriptors || []).map((descriptor) => ({
    type: descriptor.type,
    displayName: descriptor.displayName,
    launchStage: descriptor.launchStage,
  })),
  serviceVerificationCount24h: metrics24h,
  serviceVerificationCount7d: metrics7d,
  decisionHint: 'Keep enforcement UNENFORCED while any critical service has INVALID or MISSING_* traffic. Test one service at a time only after a clean 24h window and a rollback plan.',
};

console.log(JSON.stringify(output, null, 2));
