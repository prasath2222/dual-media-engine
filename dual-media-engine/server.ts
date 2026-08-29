import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: '15mb' }));

// Ensure persistent data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

const DB_FILE = path.join(DATA_DIR, 'cloud_sync_db.json');

// Helper to read database
function readDb(): { users: Record<string, any>; snapshots: Record<string, any[]> } {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to read db file, initializing fresh:', err);
  }
  return { users: {}, snapshots: {} };
}

// Helper to write database
function writeDb(data: { users: Record<string, any>; snapshots: Record<string, any[]> }) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write db file:', err);
  }
}

// ================= API ROUTES =================

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/user/sync - Get saved state for a user
app.get('/api/user/sync', (req, res) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || 'guest-session';
  const db = readDb();
  const userRecord = db.users[userId];

  if (!userRecord) {
    return res.status(404).json({ error: 'No cloud state found for this user', state: null });
  }

  return res.json({
    userId,
    state: userRecord.state,
    updatedAt: userRecord.updatedAt
  });
});

// POST /api/user/sync - Save full production state for a user
app.post('/api/user/sync', (req, res) => {
  const { userId, userEmail, state } = req.body;
  const targetUserId = userId || (req.headers['x-user-id'] as string) || 'guest-session';

  if (!state) {
    return res.status(400).json({ error: 'Missing state object' });
  }

  const db = readDb();
  const now = new Date().toISOString();

  db.users[targetUserId] = {
    userId: targetUserId,
    userEmail: userEmail || '',
    updatedAt: now,
    state: {
      ...state,
      lastSavedAt: now
    }
  };

  writeDb(db);

  return res.json({
    success: true,
    userId: targetUserId,
    savedAt: now
  });
});

// GET /api/user/snapshots - List snapshots for a user
app.get('/api/user/snapshots', (req, res) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || 'guest-session';
  const db = readDb();
  const list = db.snapshots[userId] || [];
  return res.json({ snapshots: list });
});

// POST /api/user/snapshots - Create a new named snapshot
app.post('/api/user/snapshots', (req, res) => {
  const { userId, snapshot } = req.body;
  const targetUserId = userId || (req.headers['x-user-id'] as string) || 'guest-session';

  if (!snapshot || !snapshot.id) {
    return res.status(400).json({ error: 'Invalid snapshot data' });
  }

  const db = readDb();
  if (!db.snapshots[targetUserId]) {
    db.snapshots[targetUserId] = [];
  }

  // Prepend new snapshot
  db.snapshots[targetUserId] = [
    snapshot,
    ...db.snapshots[targetUserId].filter(s => s.id !== snapshot.id)
  ];

  writeDb(db);

  return res.json({ success: true, snapshot });
});

// DELETE /api/user/snapshots/:id - Delete a snapshot
app.delete('/api/user/snapshots/:id', (req, res) => {
  const { id } = req.params;
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || 'guest-session';

  const db = readDb();
  if (db.snapshots[userId]) {
    db.snapshots[userId] = db.snapshots[userId].filter(s => s.id !== id);
    writeDb(db);
  }

  return res.json({ success: true, deletedId: id });
});

// ================= VITE / STATIC SERVING =================

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Multi-Stream Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
