-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Profiles table (one-to-one with users)
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY,
  title TEXT,
  bio TEXT,
  links TEXT, -- JSON array of link objects { label, url }
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Items table (skills, weapons, armor, items)
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('weapon', 'armor', 'skill', 'item')),
  name TEXT NOT NULL,
  description TEXT,
  level INTEGER DEFAULT 1 CHECK(level >= 1 AND level <= 10),
  tags TEXT, -- JSON array of strings
  evidence_url TEXT,
  visibility TEXT DEFAULT 'private' CHECK(visibility IN ('public', 'private', 'unlisted')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Builds table (equipment sets)
CREATE TABLE IF NOT EXISTS builds (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  purpose TEXT,
  visibility TEXT DEFAULT 'private' CHECK(visibility IN ('public', 'private', 'unlisted')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Build Items (many-to-many relationship between builds and items)
CREATE TABLE IF NOT EXISTS build_items (
  build_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (build_id, item_id),
  FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Share Links (for public sharing)
CREATE TABLE IF NOT EXISTS share_links (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK(target_type IN ('profile', 'build')),
  target_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  visibility TEXT DEFAULT 'public',
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
