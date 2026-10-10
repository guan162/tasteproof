/** TasteProof Qloo adapter for Cloudflare Workers. The API key stays server-side. */
export const CITIES = ['Tokyo', 'Taipei', 'Seoul', 'London', 'New York', 'Paris'];
export const SECTORS = ['Coffee', 'Lifestyle', 'Beauty'];
const HOSTS = new Set(['https://api.qloo.com', 'https://hackathon.api.qloo.com', 'https://staging.api.qloo.com']);

class PublicError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

export function validate(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new PublicError('Invalid request');
  const {brand, sector, base, targets, reference_brand = ''} = payload;
  if (typeof brand !== 'string' || brand.trim().length < 2 || brand.trim().length > 80) throw new PublicError('Concept name must be 2–80 characters');
  if (!SECTORS.includes(sector) || !CITIES.includes(base)) throw new PublicError('Unsupported sector or baseline city');
  if (!Array.isArray(targets) || targets.length < 1 || targets.length > 3 || targets.some(c => !CITIES.includes(c) || c === base) || new Set(targets).size !== targets.length) throw new PublicError('Choose 1–3 different supported target cities');
  if (typeof reference_brand !== 'string' || reference_brand.length > 80) throw new PublicError('Reference brand must be at most 80 characters');
  return {brand:brand.trim(), sector, base, targets, reference_brand:reference_brand.trim()};
}

function originOf(env) {
  const base = env.QLOO_API_ORIGIN || 'https://api.qloo.com';
  if (!HOSTS.has(base)) throw new PublicError('Qloo host configuration is invalid', 503);
  return base;
}

export async function qlooGet(path, params, env, fetchImpl = fetch) {
  if (!env.QLOO_API_KEY) throw new PublicError('Live Qloo access is not configured', 503);
  if (!['/search', '/v2/insights'].includes(path)) throw new PublicError('Unsupported Qloo route');
  const url = new URL(path, originOf(env));
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  let response;
  try {
    response = await fetchImpl(url.toString(), {
      headers: {'X-Api-Key': env.QLOO_API_KEY, Accept: 'application/json'},
      signal: AbortSignal.timeout(10000)
    });
  } catch (_) { throw new PublicError('Qloo connection failed', 502); }
  if (response.status === 401 || response.status === 403) throw new PublicError('Qloo API authorization failed', 503);
  if (response.status === 429) throw new PublicError('Qloo rate limit reached', 429);
  if (!response.ok) throw new PublicError('Qloo request failed', 502);
  if (Number(response.headers.get('content-length') || '0') > 1000000) throw new PublicError('Qloo response too large', 502);
  let data;
  try { data = await response.json(); } catch (_) { throw new PublicError('Invalid Qloo JSON response', 502); }
  if (!data || typeof data !== 'object' || data.success === false) throw new PublicError('Qloo rejected the query', 502);
  return data;
}

export function chooseBrand(data, name) {
  const raw = data?.results;
  const items = Array.isArray(raw) ? raw : raw?.entities;
  if (!Array.isArray(items)) throw new PublicError('Unexpected Qloo brand search response', 502);
  for (const hit of items) {
    const e = hit?.entity && typeof hit.entity === 'object' ? hit.entity : hit;
    if (typeof e?.name !== 'string' || e.name.toLowerCase().trim() !== name.toLowerCase().trim()) continue;
    if (e.subtype && e.subtype !== 'urn:entity:brand') continue;
    const id = e.entity_id || e.id;
    if (typeof id === 'string' && id.length) return {name:e.name, id};
  }
  throw new PublicError('Reference brand not found exactly in Qloo; try another name', 422);
}

export function extractTags(data) {
  const values = data?.results?.tags;
  if (!Array.isArray(values) || !values.length) throw new PublicError('Qloo returned no comparable taste tags', 422);
  const tags = [], seen = new Set();
  for (const row of values) {
    if (typeof row?.name !== 'string' || !row.name.trim()) continue;
    const name = row.name.trim();
    const id = typeof row.tag_id === 'string' ? row.tag_id : '';
    const unique = id || name.toLowerCase();
    if (seen.has(unique)) continue;
    seen.add(unique);
    tags.push({name, id});
    if (tags.length === 8) break;
  }
  if (!tags.length) throw new PublicError('Qloo taste tags lack readable labels', 502);
  return tags;
}

function tagKey(item) { return item.id || item.name.toLowerCase(); }

export async function analyze(payload, env, fetchImpl = fetch) {
  const p = validate(payload);
  if (!env.QLOO_API_KEY) throw new PublicError('Live Qloo access is not configured', 503);
  let anchor = null;
  if (p.reference_brand) {
    const data = await qlooGet('/search', {query:p.reference_brand, types:'urn:entity:brand', take:'15'}, env, fetchImpl);
    anchor = chooseBrand(data, p.reference_brand);
  }
  const cities = [p.base, ...p.targets];
  const byCity = {};
  for (const city of cities) {
    const params = {
      'filter.type':'urn:tag',
      'filter.parents.types':p.sector === 'Coffee' ? 'urn:entity:place' : 'urn:entity:brand',
      'signal.location.query':city,
      take:'16'
    };
    if (anchor) params['signal.interests.entities'] = anchor.id;
    byCity[city] = extractTags(await qlooGet('/v2/insights', params, env, fetchImpl));
  }
  const baseSet = new Set(byCity[p.base].map(tagKey));
  const candidates = p.targets.map(city => {
    const result = byCity[city];
    const otherSet = new Set(result.map(tagKey));
    const shared = result.filter(t => baseSet.has(tagKey(t))).map(t => t.name);
    const only = result.filter(t => !baseSet.has(tagKey(t))).map(t => t.name);
    const union = new Set([...baseSet, ...otherSet]);
    return {city, tags:result, shared, only, difference_index: union.size ? +(1 - shared.length / union.size).toFixed(4) : 0};
  }).sort((a,b) => b.difference_index - a.difference_index);
  return {
    source:'qloo-live', concept:p.brand, sector:p.sector, anchor,
    baseline:{city:p.base, tags:byCity[p.base]}, candidates,
    audit:{qloo_calls:cities.length + (anchor ? 1 : 0), cities, anchor_used:!!anchor},
    next_experiment:{city:candidates[0].city, cue:candidates[0].only[0] || null,
      suggestion:'Test two creative hypotheses with opt-in users before committing funds'},
    disclaimer:'Qloo-backed returned tag-list overlap is not a representative cultural score, sales prediction, or profit estimate.'
  };
}

function respond(body, status, allowOrigin) {
  return new Response(JSON.stringify(body), {status, headers:{
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store',
    'access-control-allow-origin':allowOrigin,
    'access-control-allow-methods':'POST, GET, OPTIONS',
    'access-control-allow-headers':'Content-Type',
    'x-content-type-options':'nosniff'
  }});
}

export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || 'https://guan162.github.io';
    const from = request.headers.get('origin');
    if (from && from !== allowedOrigin) return respond({error:'Origin not permitted'}, 403, allowedOrigin);
    if (request.method === 'OPTIONS') return respond({}, 200, allowedOrigin);
    const path = new URL(request.url).pathname;
    if (request.method === 'GET' && path === '/health') return respond({status:'ok', qloo_key_configured:!!env.QLOO_API_KEY}, 200, allowedOrigin);
    if (request.method !== 'POST' || path !== '/api/scan') return respond({error:'Not found'}, 404, allowedOrigin);
    if ((Number(request.headers.get('content-length')) || 0) > 2048) return respond({error:'Request too large'}, 413, allowedOrigin);
    try {
      const raw = await request.text();
      if (raw.length > 2048) throw new PublicError('Request too large', 413);
      const p = JSON.parse(raw);
      if (!env.RATE_LIMITER || typeof env.RATE_LIMITER.limit !== 'function') throw new PublicError('Rate limiter is not configured', 503);
      const limit = await env.RATE_LIMITER.limit({key:'tasteproof-public-api'});
      if (!limit.success) throw new PublicError('Demo request limit reached; retry later', 429);
      return respond(await analyze(p, env), 200, allowedOrigin);
    } catch (err) {
      if (err instanceof SyntaxError) return respond({error:'Invalid JSON'},400,allowedOrigin);
      if (err instanceof PublicError) return respond({error:err.message},err.status,allowedOrigin);
      return respond({error:'Internal error'},500,allowedOrigin);
    }
  }
};