import { neon } from '@neondatabase/serverless';

const MAX_BATCH_SIZE = 20;
const MAX_REQUEST_BYTES = 8_192;
const RECIPES = new Set(['remote-tech', 'product-design', 'startup-fresh']);
const GOOGLE_OPEN_ORIGINS = new Set(['primary', 'sticky-mobile', 'saved-search']);
const ACCOUNT_PROMPT_SOURCES = new Set(['header', 'workspace-prompt']);

function getDatabase() {
  if (!process.env.DATABASE_URL) throw new Error('Database is not configured.');
  return neon(process.env.DATABASE_URL);
}

function boundedInteger(value, maximum) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) return 0;
  return Math.min(number, maximum);
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return url.hostname === 'jobdorking.com'
      || url.hostname === 'www.jobdorking.com'
      || url.hostname.endsWith('.vercel.app')
      || (url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1'));
  } catch (_error) {
    return false;
  }
}

function normalizeEvent(rawEvent) {
  if (!rawEvent || typeof rawEvent !== 'object' || Array.isArray(rawEvent)) return null;

  const count = Math.max(1, Math.min(boundedInteger(rawEvent.count, 25), 25));
  const data = rawEvent.data && typeof rawEvent.data === 'object' && !Array.isArray(rawEvent.data) ? rawEvent.data : {};
  let properties;

  switch (rawEvent.name) {
    case 'recipe_applied': {
      if (!RECIPES.has(data.recipe)) return null;
      properties = { recipe: data.recipe };
      break;
    }
    case 'query_changed': {
      properties = {
        source_count: boundedInteger(data.source_count, 12),
        filter_count: boundedInteger(data.filter_count, 8),
        has_titles: Boolean(data.has_titles)
      };
      break;
    }
    case 'google_open': {
      if (!GOOGLE_OPEN_ORIGINS.has(data.origin)) return null;
      properties = {
        origin: data.origin,
        source_count: boundedInteger(data.source_count, 12),
        filter_count: boundedInteger(data.filter_count, 8)
      };
      break;
    }
    case 'search_saved': {
      properties = {
        source_count: boundedInteger(data.source_count, 12),
        filter_count: boundedInteger(data.filter_count, 8)
      };
      break;
    }
    case 'account_prompt_opened': {
      if (!ACCOUNT_PROMPT_SOURCES.has(data.source)) return null;
      properties = { source: data.source };
      break;
    }
    default:
      return null;
  }

  return {
    event_name: rawEvent.name,
    dimension_key: Object.keys(properties).map(function (key) { return key + '=' + String(properties[key]); }).join('|'),
    properties,
    event_count: count
  };
}

function readEvents(request) {
  const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
  if (Buffer.byteLength(JSON.stringify(body || {}), 'utf8') > MAX_REQUEST_BYTES) return null;
  if (!body || !Array.isArray(body.events) || body.events.length < 1 || body.events.length > MAX_BATCH_SIZE) return null;

  const aggregated = new Map();
  body.events.forEach(function (rawEvent) {
    const event = normalizeEvent(rawEvent);
    if (!event) return;
    const key = event.event_name + '|' + event.dimension_key;
    const existing = aggregated.get(key);
    if (existing) existing.event_count = Math.min(existing.event_count + event.event_count, 100);
    else aggregated.set(key, event);
  });
  return Array.from(aggregated.values());
}

async function ensureSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS jobdorking_product_events (
      event_date DATE NOT NULL,
      event_name TEXT NOT NULL,
      dimension_key TEXT NOT NULL,
      properties JSONB NOT NULL,
      event_count BIGINT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (event_date, event_name, dimension_key)
    )
  `;
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  if (!isAllowedOrigin(request.headers.origin)) return response.status(403).json({ error: 'Origin is not allowed.' });
  if (!String(request.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    return response.status(415).json({ error: 'JSON is required.' });
  }

  try {
    const events = readEvents(request);
    if (!events || events.length < 1) return response.status(400).json({ error: 'A valid event batch is required.' });

    const sql = getDatabase();
    await ensureSchema(sql);
    const rows = JSON.stringify(events);
    await sql`
      INSERT INTO jobdorking_product_events (
        event_date,
        event_name,
        dimension_key,
        properties,
        event_count,
        updated_at
      )
      SELECT
        (NOW() AT TIME ZONE 'UTC')::date,
        event.event_name,
        event.dimension_key,
        event.properties,
        event.event_count,
        NOW()
      FROM jsonb_to_recordset(${rows}::jsonb) AS event(
        event_name TEXT,
        dimension_key TEXT,
        properties JSONB,
        event_count INTEGER
      )
      ON CONFLICT (event_date, event_name, dimension_key)
      DO UPDATE SET
        event_count = jobdorking_product_events.event_count + EXCLUDED.event_count,
        updated_at = NOW()
    `;
    return response.status(204).end();
  } catch (error) {
    console.error('Product event aggregation failed', error);
    return response.status(500).json({ error: 'Could not record product events.' });
  }
}
