import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import db from './db/index'; // Initialize DB
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';

app.use(express.json());
app.use(cookieParser());

// --- Auth Middleware (Disabled for Single User Mode) ---
const DEFAULT_USER_ID = 'default-player-one';
const DEFAULT_USER_EMAIL = 'player@skillquest.local';
const DEFAULT_USER_NAME = '冒険者';

// Ensure default user exists
try {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(DEFAULT_USER_ID);
  if (!user) {
    db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)').run(DEFAULT_USER_ID, DEFAULT_USER_EMAIL, 'nopassword', DEFAULT_USER_NAME);
    db.prepare('INSERT INTO profiles (user_id) VALUES (?)').run(DEFAULT_USER_ID);
    console.log('Default user created');
  }
} catch (e) {
  console.error('Error creating default user:', e);
}

// Ensure avatar_data column exists
try {
  db.prepare('ALTER TABLE profiles ADD COLUMN avatar_data TEXT').run();
  console.log('Added avatar_data column to profiles');
} catch (e: any) {
  if (!e.message.includes('duplicate column name')) {
    console.error('Error adding avatar_data column:', e);
  }
}

const authenticateToken = (req, res, next) => {
  // Always inject default user
  req.user = { id: DEFAULT_USER_ID, email: DEFAULT_USER_EMAIL, name: DEFAULT_USER_NAME };
  next();
};

// --- API Routes ---

// Auth (Simplified)
app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});

// Profile
app.get('/api/profile', authenticateToken, (req: any, res) => {
  const stmt = db.prepare('SELECT * FROM profiles WHERE user_id = ?');
  const profile = stmt.get(req.user.id);
  res.json(profile || {});
});

app.put('/api/profile', authenticateToken, (req: any, res) => {
  const { title, bio, links, avatar_data } = req.body;
  const stmt = db.prepare(`
    INSERT INTO profiles (user_id, title, bio, links, avatar_data) 
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
    title = excluded.title,
    bio = excluded.bio,
    links = excluded.links,
    avatar_data = excluded.avatar_data
  `);
  stmt.run(req.user.id, title, bio, JSON.stringify(links), avatar_data);
  res.json({ success: true });
});

// Items (Skills/Weapons/Armor)
app.get('/api/items', authenticateToken, (req: any, res) => {
  const stmt = db.prepare('SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC');
  const items = stmt.all(req.user.id);
  res.json(items.map((item: any) => ({ ...item, tags: JSON.parse(item.tags || '[]') })));
});

app.post('/api/items', authenticateToken, (req: any, res) => {
  const { type, name, description, level, tags, evidence_url, visibility } = req.body;
  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO items (id, user_id, type, name, description, level, tags, evidence_url, visibility)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, req.user.id, type, name, description, level, JSON.stringify(tags), evidence_url, visibility || 'private');
  res.json({ id });
});

app.put('/api/items/:id', authenticateToken, (req: any, res) => {
  const { type, name, description, level, tags, evidence_url, visibility } = req.body;
  const stmt = db.prepare(`
    UPDATE items SET type = ?, name = ?, description = ?, level = ?, tags = ?, evidence_url = ?, visibility = ?
    WHERE id = ? AND user_id = ?
  `);
  const result = stmt.run(type, name, description, level, JSON.stringify(tags), evidence_url, visibility, req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Item not found' });
  res.json({ success: true });
});

app.delete('/api/items/:id', authenticateToken, (req: any, res) => {
  const stmt = db.prepare('DELETE FROM items WHERE id = ? AND user_id = ?');
  const result = stmt.run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Item not found' });
  res.json({ success: true });
});

// Builds
app.get('/api/builds', authenticateToken, (req: any, res) => {
  const stmt = db.prepare('SELECT * FROM builds WHERE user_id = ? ORDER BY created_at DESC');
  const builds = stmt.all(req.user.id);
  
  // Get items for each build
  const buildsWithItems = builds.map((build: any) => {
    const itemsStmt = db.prepare(`
      SELECT i.*, bi.sort_order 
      FROM items i 
      JOIN build_items bi ON i.id = bi.item_id 
      WHERE bi.build_id = ?
      ORDER BY bi.sort_order ASC
    `);
    const items = itemsStmt.all(build.id);
    return { ...build, items: items.map((item: any) => ({ ...item, tags: JSON.parse(item.tags || '[]') })) };
  });

  res.json(buildsWithItems);
});

app.post('/api/builds', authenticateToken, (req: any, res) => {
  const { name, purpose, itemIds } = req.body; // itemIds is array of strings
  const buildId = uuidv4();
  
  const insertBuild = db.transaction(() => {
    db.prepare('INSERT INTO builds (id, user_id, name, purpose) VALUES (?, ?, ?, ?)').run(buildId, req.user.id, name, purpose);
    
    if (itemIds && Array.isArray(itemIds)) {
      const itemStmt = db.prepare('INSERT INTO build_items (build_id, item_id, sort_order) VALUES (?, ?, ?)');
      itemIds.forEach((itemId, index) => {
        itemStmt.run(buildId, itemId, index);
      });
    }
  });

  insertBuild();
  res.json({ id: buildId });
});

app.put('/api/builds/:id', authenticateToken, (req: any, res) => {
  const { name, purpose, itemIds } = req.body;
  
  const updateBuild = db.transaction(() => {
    const result = db.prepare('UPDATE builds SET name = ?, purpose = ? WHERE id = ? AND user_id = ?').run(name, purpose, req.params.id, req.user.id);
    if (result.changes === 0) throw new Error('Build not found');

    db.prepare('DELETE FROM build_items WHERE build_id = ?').run(req.params.id);
    
    if (itemIds && Array.isArray(itemIds)) {
      const itemStmt = db.prepare('INSERT INTO build_items (build_id, item_id, sort_order) VALUES (?, ?, ?)');
      itemIds.forEach((itemId, index) => {
        itemStmt.run(req.params.id, itemId, index);
      });
    }
  });

  try {
    updateBuild();
    res.json({ success: true });
  } catch (e: any) {
    if (e.message === 'Build not found') return res.status(404).json({ error: 'Build not found' });
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/builds/:id', authenticateToken, (req: any, res) => {
  const stmt = db.prepare('DELETE FROM builds WHERE id = ? AND user_id = ?');
  const result = stmt.run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Build not found' });
  res.json({ success: true });
});

// Public Share Link Generation
app.post('/api/share', authenticateToken, (req: any, res) => {
  const { targetType, targetId } = req.body;
  
  // Verify ownership
  let ownerCheck;
  if (targetType === 'profile') {
     // Profile ID is user ID
     if (targetId !== req.user.id) return res.sendStatus(403);
  } else if (targetType === 'build') {
     const build = db.prepare('SELECT user_id FROM builds WHERE id = ?').get(targetId) as any;
     if (!build || build.user_id !== req.user.id) return res.sendStatus(403);
  } else {
    return res.status(400).json({ error: 'Invalid target type' });
  }

  const token = uuidv4();
  const id = uuidv4();
  
  // Check if link already exists
  const existing = db.prepare('SELECT token FROM share_links WHERE target_type = ? AND target_id = ?').get(targetType, targetId) as any;
  if (existing) {
    return res.json({ token: existing.token });
  }

  db.prepare('INSERT INTO share_links (id, target_type, target_id, token) VALUES (?, ?, ?, ?)').run(id, targetType, targetId, token);
  res.json({ token });
});

// Public View Route
app.get('/api/public/:token', (req, res) => {
  const { token } = req.params;
  const link = db.prepare('SELECT * FROM share_links WHERE token = ?').get(token) as any;
  
  if (!link) return res.status(404).json({ error: 'Link not found' });

  if (link.target_type === 'profile') {
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(link.target_id) as any;
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(link.target_id) as any;
    // Get public items for profile? Or just profile info?
    // Usually profile share includes public items.
    const items = db.prepare("SELECT * FROM items WHERE user_id = ? AND visibility = 'public'").all(link.target_id);
    
    return res.json({
      type: 'profile',
      data: {
        user: { name: user.name },
        profile: { ...profile, links: JSON.parse(profile.links || '[]') },
        items: items.map((item: any) => ({ ...item, tags: JSON.parse(item.tags || '[]') }))
      }
    });
  } else if (link.target_type === 'build') {
    const build = db.prepare('SELECT * FROM builds WHERE id = ?').get(link.target_id) as any;
    if (!build) return res.status(404).json({ error: 'Build not found' });
    
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(build.user_id) as any;
    
    const itemsStmt = db.prepare(`
      SELECT i.*, bi.sort_order 
      FROM items i 
      JOIN build_items bi ON i.id = bi.item_id 
      WHERE bi.build_id = ?
      ORDER BY bi.sort_order ASC
    `);
    const items = itemsStmt.all(build.id);

    return res.json({
      type: 'build',
      data: {
        user: { name: user.name },
        build,
        items: items.map((item: any) => ({ ...item, tags: JSON.parse(item.tags || '[]') }))
      }
    });
  }
});


// --- Vite Middleware ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    // Assuming build output is in dist/
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
