import { verifyToken } from '@clerk/backend';
import { neon } from '@neondatabase/serverless';

const MAX_WORKSPACE_BYTES = 1_000_000;

function getDatabase() {
  if (!process.env.DATABASE_URL) throw new Error('Database is not configured.');
  return neon(process.env.DATABASE_URL);
}

async function getUserId(request) {
  const authorization = request.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
  if (!token || !process.env.CLERK_SECRET_KEY) return null;

  const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  return payload.sub || null;
}

function readWorkspace(request) {
  const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
  const workspace = body && body.workspace;
  if (!workspace || typeof workspace !== 'object' || Array.isArray(workspace)) return null;
  if (Buffer.byteLength(JSON.stringify(workspace), 'utf8') > MAX_WORKSPACE_BYTES) return null;
  return workspace;
}

async function ensureSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS jobdorking_workspaces (
      user_id TEXT PRIMARY KEY,
      workspace JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export default async function handler(request, response) {
  if (request.method !== 'GET' && request.method !== 'PUT' && request.method !== 'DELETE') {
    response.setHeader('Allow', 'GET, PUT, DELETE');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const userId = await getUserId(request);
    if (!userId) return response.status(401).json({ error: 'Sign in is required.' });

    const sql = getDatabase();
    await ensureSchema(sql);

    if (request.method === 'GET') {
      const rows = await sql`
        SELECT workspace, updated_at
        FROM jobdorking_workspaces
        WHERE user_id = ${userId}
      `;
      const record = rows[0] || null;
      return response.status(200).json({ workspace: record ? record.workspace : null, updatedAt: record ? record.updated_at : null });
    }

    if (request.method === 'DELETE') {
      await sql`DELETE FROM jobdorking_workspaces WHERE user_id = ${userId}`;
      return response.status(204).end();
    }

    const workspace = readWorkspace(request);
    if (!workspace) return response.status(400).json({ error: 'A valid workspace is required.' });
    const storedWorkspace = JSON.stringify(workspace);
    await sql`
      INSERT INTO jobdorking_workspaces (user_id, workspace, updated_at)
      VALUES (${userId}, ${storedWorkspace}::jsonb, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET workspace = EXCLUDED.workspace, updated_at = NOW()
    `;
    return response.status(200).json({ workspace, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Workspace sync failed', error);
    return response.status(500).json({ error: 'Could not sync your workspace.' });
  }
}
