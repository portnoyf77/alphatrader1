/**
 * Shared Vercel KV helpers
 * Provides read/write for intelligence accumulation across agent cycles.
 * Gracefully degrades if KV is not configured.
 */

function kvConfig() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

function kvHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ── Core operations ─────────────────────────────────────────────

export async function kvSet(key, value, ttlSeconds = 86400) {
  const kv = kvConfig();
  if (!kv) return false;
  try {
    await fetch(`${kv.url}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: kvHeaders(kv.token),
      body: JSON.stringify({ ex: ttlSeconds, value: JSON.stringify(value) }),
    });
    return true;
  } catch (err) {
    console.error(`[kv] SET ${key} failed:`, err.message);
    return false;
  }
}

export async function kvGet(key) {
  const kv = kvConfig();
  if (!kv) return null;
  try {
    const res = await fetch(`${kv.url}/get/${encodeURIComponent(key)}`, {
      headers: kvHeaders(kv.token),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.result === null || data.result === undefined) return null;
    return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
  } catch (err) {
    console.error(`[kv] GET ${key} failed:`, err.message);
    return null;
  }
}

export async function kvLpush(key, value) {
  const kv = kvConfig();
  if (!kv) return false;
  try {
    await fetch(`${kv.url}/lpush/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: kvHeaders(kv.token),
      body: JSON.stringify({ value: typeof value === 'string' ? value : JSON.stringify(value) }),
    });
    return true;
  } catch (err) {
    console.error(`[kv] LPUSH ${key} failed:`, err.message);
    return false;
  }
}

export async function kvLrange(key, start = 0, stop = -1) {
  const kv = kvConfig();
  if (!kv) return [];
  try {
    const res = await fetch(`${kv.url}/lrange/${encodeURIComponent(key)}/${start}/${stop}`, {
      headers: kvHeaders(kv.token),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.result || []).map(item => {
      try { return JSON.parse(item); } catch { return item; }
    });
  } catch (err) {
    console.error(`[kv] LRANGE ${key} failed:`, err.message);
    return [];
  }
}

export async function kvLtrim(key, start, stop) {
  const kv = kvConfig();
  if (!kv) return false;
  try {
    await fetch(`${kv.url}/ltrim/${encodeURIComponent(key)}/${start}/${stop}`, {
      method: 'POST',
      headers: kvHeaders(kv.token),
    });
    return true;
  } catch { return false; }
}

// ── Intelligence storage helpers ────────────────────────────────

/**
 * Store an agent's report in KV with a standard pattern:
 * - `intel:{agentName}:latest` always holds the freshest report
 * - `intel:{agentName}:history` is a list of recent timestamps
 * - `intel:{agentName}:{timestamp}` holds individual reports (7-day TTL)
 */
export async function storeIntelligence(agentName, report) {
  const timestamp = report.timestamp || new Date().toISOString();
  const key = (layer) => `intel:${agentName}:${layer}`;

  await Promise.all([
    kvSet(key('latest'), report, 86400),                  // 24h TTL for latest
    kvSet(`intel:${agentName}:${timestamp}`, report, 604800), // 7-day TTL for individual
    kvLpush(key('history'), timestamp),
  ]);

  // Trim history to 100 entries
  await kvLtrim(key('history'), 0, 99);

  return true;
}

/**
 * Read the latest report from an agent.
 */
export async function getLatestIntelligence(agentName) {
  return kvGet(`intel:${agentName}:latest`);
}

/**
 * Read all latest intelligence from all agents.
 * Returns an object keyed by agent name.
 */
export async function getAllLatestIntelligence() {
  const agents = [
    'news-sentinel',
    'sector-scanner',
    'earnings-scout',
    'catalyst-tracker',
    'technical-analyst',
    'fundamentals-analyst',
    'macro-analyst',
  ];

  const results = await Promise.all(agents.map(a => getLatestIntelligence(a)));
  const intel = {};
  agents.forEach((name, i) => {
    intel[name] = results[i]; // null if not available
  });
  return intel;
}

// ── Execution log storage ───────────────────────────────────────

export async function storeExecutionLog(logEntry) {
  const timestamp = logEntry.timestamp || new Date().toISOString();

  await Promise.all([
    kvSet('execution:log:latest', logEntry, 2592000),           // 30-day
    kvSet(`execution:log:${timestamp}`, logEntry, 2592000),     // 30-day
    kvLpush('execution:log:index', timestamp),
  ]);

  await kvLtrim('execution:log:index', 0, 199);
  return true;
}

export async function getExecutionLogs(count = 20) {
  const timestamps = await kvLrange('execution:log:index', 0, count - 1);
  if (timestamps.length === 0) return [];

  const logs = await Promise.all(
    timestamps.map(ts => kvGet(`execution:log:${ts}`))
  );
  return logs.filter(Boolean);
}

// ── Benchmark tracking ──────────────────────────────────────────

export async function storeBenchmark(data) {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  await kvSet(`benchmark:${date}`, data, 7776000); // 90-day TTL
  await kvSet('benchmark:latest', data, 86400);
  await kvLpush('benchmark:history', date);
  await kvLtrim('benchmark:history', 0, 89); // 90 days
  return true;
}

export async function getBenchmarkHistory(days = 30) {
  const dates = await kvLrange('benchmark:history', 0, days - 1);
  if (dates.length === 0) return [];
  const data = await Promise.all(dates.map(d => kvGet(`benchmark:${d}`)));
  return data.filter(Boolean);
}
