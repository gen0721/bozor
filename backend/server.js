require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {}
  }
  next();
}

// ============================
// AUTH ROUTES
// ============================

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone, city } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  const avatarNum = Math.floor(Math.random() * 70) + 1;
  const result = db.prepare(`
    INSERT INTO users (name, email, password, phone, city, avatar)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, email, hashedPassword, phone || null, city || null, `https://i.pravatar.cc/150?img=${avatarNum}`);

  const user = db.prepare('SELECT id, name, email, avatar, phone, city, rating, review_count, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({ token, user });
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
  const { password: _, ...userWithoutPassword } = user;
  res.json({ token, user: userWithoutPassword });
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, name, email, avatar, phone, city, bio, rating, review_count, is_admin, is_banned, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// ============================
// CATEGORIES ROUTES
// ============================

// GET /api/categories
app.get('/api/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories').all();
  const withCounts = categories.map(cat => {
    const count = db.prepare("SELECT COUNT(*) as count FROM listings WHERE category_id = ? AND status = 'active'").get(cat.id);
    return { ...cat, listing_count: count.count };
  });
  res.json(withCounts);
});

// ============================
// LISTINGS ROUTES
// ============================

// GET /api/listings
app.get('/api/listings', optionalAuth, (req, res) => {
  const {
    search, category, city, minPrice, maxPrice,
    sort = 'newest', page = 1, limit = 20, premium
  } = req.query;

  let query = `
    SELECT l.*, u.name as seller_name, u.avatar as seller_avatar, u.rating as seller_rating,
           c.name_ru, c.name_uz, c.name_en, c.icon as category_icon, c.color as category_color, c.slug as category_slug
    FROM listings l
    JOIN users u ON l.user_id = u.id
    JOIN categories c ON l.category_id = c.id
    WHERE l.status = 'active'
  `;
  const params = [];

  if (search) {
    query += ` AND (l.title LIKE ? OR l.description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    const cat = db.prepare('SELECT id FROM categories WHERE slug = ? OR id = ?').get(category, parseInt(category) || 0);
    if (cat) {
      query += ` AND l.category_id = ?`;
      params.push(cat.id);
    }
  }
  if (city) {
    query += ` AND l.city LIKE ?`;
    params.push(`%${city}%`);
  }
  if (minPrice) {
    query += ` AND l.price >= ?`;
    params.push(parseFloat(minPrice));
  }
  if (maxPrice) {
    query += ` AND l.price <= ?`;
    params.push(parseFloat(maxPrice));
  }
  if (premium === 'true') {
    query += ` AND l.is_premium = 1`;
  }

  switch (sort) {
    case 'price_asc': query += ' ORDER BY l.price ASC'; break;
    case 'price_desc': query += ' ORDER BY l.price DESC'; break;
    case 'popular': query += ' ORDER BY l.views DESC'; break;
    case 'premium': query += ' ORDER BY l.is_premium DESC, l.created_at DESC'; break;
    default: query += ' ORDER BY l.is_premium DESC, l.created_at DESC';
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const countQuery = query.replace(/SELECT l\.\*.*?FROM listings l/, 'SELECT COUNT(*) as total FROM listings l');
  const totalResult = db.prepare(countQuery).get(...params);
  const total = totalResult ? totalResult.total : 0;

  query += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const listings = db.prepare(query).all(...params).map(l => ({
    ...l,
    images: JSON.parse(l.images || '[]')
  }));

  if (req.user) {
    const favs = db.prepare('SELECT listing_id FROM favorites WHERE user_id = ?').all(req.user.id);
    const favSet = new Set(favs.map(f => f.listing_id));
    listings.forEach(l => { l.is_favorited = favSet.has(l.id); });
  }

  res.json({ listings, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

// GET /api/listings/:id
app.get('/api/listings/:id', optionalAuth, (req, res) => {
  const listing = db.prepare(`
    SELECT l.*, u.name as seller_name, u.avatar as seller_avatar, u.rating as seller_rating,
           u.phone as seller_phone, u.city as seller_city, u.review_count as seller_review_count,
           u.created_at as seller_since,
           c.name_ru, c.name_uz, c.name_en, c.icon as category_icon, c.slug as category_slug
    FROM listings l
    JOIN users u ON l.user_id = u.id
    JOIN categories c ON l.category_id = c.id
    WHERE l.id = ?
  `).get(req.params.id);

  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  // Increment views
  db.prepare('UPDATE listings SET views = views + 1 WHERE id = ?').run(req.params.id);

  listing.images = JSON.parse(listing.images || '[]');
  if (req.user) {
    const fav = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND listing_id = ?').get(req.user.id, listing.id);
    listing.is_favorited = !!fav;
  }

  // Similar listings
  const similar = db.prepare(`
    SELECT l.*, u.name as seller_name, c.name_ru, c.name_uz, c.name_en, c.icon as category_icon
    FROM listings l
    JOIN users u ON l.user_id = u.id
    JOIN categories c ON l.category_id = c.id
    WHERE l.category_id = ? AND l.id != ? AND l.status = 'active'
    ORDER BY l.created_at DESC LIMIT 4
  `).all(listing.category_id, listing.id).map(l => ({ ...l, images: JSON.parse(l.images || '[]') }));

  res.json({ ...listing, similar });
});

// POST /api/listings
app.post('/api/listings', authenticateToken, (req, res) => {
  const { title, description, price, category_id, city, images, is_premium } = req.body;
  if (!title || !description || !price || !category_id || !city) {
    return res.status(400).json({ error: 'All required fields must be filled' });
  }
  const result = db.prepare(`
    INSERT INTO listings (user_id, title, description, price, category_id, city, images, is_premium)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, title, description, parseFloat(price), parseInt(category_id), city, JSON.stringify(images || []), is_premium ? 1 : 0);

  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(result.lastInsertRowid);
  listing.images = JSON.parse(listing.images);
  res.status(201).json(listing);
});

// PUT /api/listings/:id
app.put('/api/listings/:id', authenticateToken, (req, res) => {
  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const { title, description, price, category_id, city, images, is_premium, status } = req.body;
  db.prepare(`
    UPDATE listings SET title=?, description=?, price=?, category_id=?, city=?, images=?, is_premium=?, status=?
    WHERE id=?
  `).run(
    title || listing.title,
    description || listing.description,
    price ? parseFloat(price) : listing.price,
    category_id ? parseInt(category_id) : listing.category_id,
    city || listing.city,
    images ? JSON.stringify(images) : listing.images,
    is_premium !== undefined ? (is_premium ? 1 : 0) : listing.is_premium,
    status || listing.status,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  updated.images = JSON.parse(updated.images);
  res.json(updated);
});

// DELETE /api/listings/:id
app.delete('/api/listings/:id', authenticateToken, (req, res) => {
  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM listings WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// GET /api/listings/user/:userId
app.get('/api/listings/user/:userId', optionalAuth, (req, res) => {
  const listings = db.prepare(`
    SELECT l.*, c.name_ru, c.name_uz, c.name_en, c.icon as category_icon, c.slug as category_slug
    FROM listings l
    JOIN categories c ON l.category_id = c.id
    WHERE l.user_id = ? AND l.status = 'active'
    ORDER BY l.created_at DESC
  `).all(req.params.userId).map(l => ({ ...l, images: JSON.parse(l.images || '[]') }));
  res.json(listings);
});

// ============================
// FAVORITES ROUTES
// ============================

// GET /api/favorites
app.get('/api/favorites', authenticateToken, (req, res) => {
  const favorites = db.prepare(`
    SELECT l.*, u.name as seller_name, u.avatar as seller_avatar,
           c.name_ru, c.name_uz, c.name_en, c.icon as category_icon, c.slug as category_slug,
           f.created_at as favorited_at
    FROM favorites f
    JOIN listings l ON f.listing_id = l.id
    JOIN users u ON l.user_id = u.id
    JOIN categories c ON l.category_id = c.id
    WHERE f.user_id = ? AND l.status = 'active'
    ORDER BY f.created_at DESC
  `).all(req.user.id).map(l => ({ ...l, images: JSON.parse(l.images || '[]'), is_favorited: true }));
  res.json(favorites);
});

// POST /api/favorites/:listingId
app.post('/api/favorites/:listingId', authenticateToken, (req, res) => {
  try {
    db.prepare('INSERT INTO favorites (user_id, listing_id) VALUES (?, ?)').run(req.user.id, req.params.listingId);
    res.json({ success: true, favorited: true });
  } catch (err) {
    res.status(409).json({ error: 'Already in favorites' });
  }
});

// DELETE /api/favorites/:listingId
app.delete('/api/favorites/:listingId', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND listing_id = ?').run(req.user.id, req.params.listingId);
  res.json({ success: true, favorited: false });
});

// ============================
// MESSAGES ROUTES
// ============================

// GET /api/messages - get all conversations for current user
app.get('/api/messages', authenticateToken, (req, res) => {
  const conversations = db.prepare(`
    SELECT
      m.*,
      CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
      u.name as other_user_name, u.avatar as other_user_avatar,
      l.title as listing_title, l.images as listing_images,
      (SELECT COUNT(*) FROM messages WHERE receiver_id = ? AND sender_id = other_user_id AND read = 0) as unread_count
    FROM messages m
    JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
    LEFT JOIN listings l ON m.listing_id = l.id
    WHERE m.sender_id = ? OR m.receiver_id = ?
    GROUP BY CASE WHEN m.sender_id < m.receiver_id THEN m.sender_id || '-' || m.receiver_id
                  ELSE m.receiver_id || '-' || m.sender_id END
    ORDER BY m.created_at DESC
  `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);

  res.json(conversations.map(c => ({
    ...c,
    listing_images: c.listing_images ? JSON.parse(c.listing_images) : []
  })));
});

// GET /api/messages/:userId - get messages with a specific user
app.get('/api/messages/:userId', authenticateToken, (req, res) => {
  const messages = db.prepare(`
    SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE (m.sender_id = ? AND m.receiver_id = ?)
       OR (m.sender_id = ? AND m.receiver_id = ?)
    ORDER BY m.created_at ASC
  `).all(req.user.id, req.params.userId, req.params.userId, req.user.id);

  // Mark messages as read
  db.prepare('UPDATE messages SET read = 1 WHERE receiver_id = ? AND sender_id = ?').run(req.user.id, req.params.userId);

  res.json(messages);
});

// POST /api/messages
app.post('/api/messages', authenticateToken, (req, res) => {
  const { receiver_id, listing_id, text } = req.body;
  if (!receiver_id || !text) {
    return res.status(400).json({ error: 'receiver_id and text are required' });
  }
  const result = db.prepare(`
    INSERT INTO messages (sender_id, receiver_id, listing_id, text)
    VALUES (?, ?, ?, ?)
  `).run(req.user.id, receiver_id, listing_id || null, text);

  const message = db.prepare(`
    SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
    FROM messages m JOIN users u ON m.sender_id = u.id
    WHERE m.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(message);
});

// ============================
// USERS ROUTES
// ============================

// GET /api/users/:id
app.get('/api/users/:id', (req, res) => {
  const user = db.prepare('SELECT id, name, email, avatar, phone, city, bio, rating, review_count, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const reviews = db.prepare(`
    SELECT r.*, u.name as reviewer_name, u.avatar as reviewer_avatar
    FROM reviews r JOIN users u ON r.reviewer_id = u.id
    WHERE r.reviewed_id = ?
    ORDER BY r.created_at DESC LIMIT 10
  `).all(req.params.id);

  res.json({ ...user, reviews });
});

// PUT /api/users/:id
app.put('/api/users/:id', authenticateToken, (req, res) => {
  if (parseInt(req.params.id) !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { name, phone, city, bio, avatar } = req.body;
  db.prepare('UPDATE users SET name=?, phone=?, city=?, bio=?, avatar=? WHERE id=?')
    .run(name, phone, city, bio, avatar, req.user.id);
  const user = db.prepare('SELECT id, name, email, avatar, phone, city, bio, rating, review_count, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// POST /api/reviews
app.post('/api/reviews', authenticateToken, (req, res) => {
  const { reviewed_id, rating, comment, listing_id } = req.body;
  if (!reviewed_id || !rating) return res.status(400).json({ error: 'reviewed_id and rating required' });
  if (reviewed_id === req.user.id) return res.status(400).json({ error: 'Cannot review yourself' });

  db.prepare('INSERT INTO reviews (reviewer_id, reviewed_id, rating, comment, listing_id) VALUES (?,?,?,?,?)')
    .run(req.user.id, reviewed_id, rating, comment || null, listing_id || null);

  // Update user rating
  const avg = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE reviewed_id = ?').get(reviewed_id);
  db.prepare('UPDATE users SET rating = ?, review_count = ? WHERE id = ?').run(avg.avg, avg.cnt, reviewed_id);

  res.status(201).json({ success: true });
});

// GET /api/stats - public stats
app.get('/api/stats', (req, res) => {
  const listingCount = db.prepare("SELECT COUNT(*) as count FROM listings WHERE status = 'active'").get();
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const cityCount = db.prepare("SELECT COUNT(DISTINCT city) as count FROM listings WHERE status = 'active'").get();
  res.json({
    listings: listingCount.count,
    users: userCount.count,
    cities: cityCount.count
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================
// ADMIN MIDDLEWARE
// ============================

function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    const u = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id);
    if (!u || !u.is_admin) return res.status(403).json({ error: 'Admin access required' });
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// ============================
// ADMIN ROUTES
// ============================

// GET /api/admin/stats
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const totalUsers    = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const totalListings = db.prepare('SELECT COUNT(*) as c FROM listings').get().c;
  const activeListings= db.prepare("SELECT COUNT(*) as c FROM listings WHERE status='active'").get().c;
  const totalMessages = db.prepare('SELECT COUNT(*) as c FROM messages').get().c;
  const totalFavs     = db.prepare('SELECT COUNT(*) as c FROM favorites').get().c;
  const premiumCount  = db.prepare('SELECT COUNT(*) as c FROM listings WHERE is_premium=1').get().c;
  const bannedUsers   = db.prepare('SELECT COUNT(*) as c FROM users WHERE is_banned=1').get().c;
  const newUsersToday = db.prepare("SELECT COUNT(*) as c FROM users WHERE DATE(created_at)=DATE('now')").get().c;
  const newListingsToday = db.prepare("SELECT COUNT(*) as c FROM listings WHERE DATE(created_at)=DATE('now')").get().c;
  const recentUsers   = db.prepare('SELECT id, name, email, avatar, city, is_admin, is_banned, created_at FROM users ORDER BY created_at DESC LIMIT 5').all();
  const recentListings= db.prepare(`
    SELECT l.id, l.title, l.price, l.status, l.is_premium, l.views, l.created_at,
           u.name as seller_name, c.name_ru, c.name_uz, c.name_en
    FROM listings l JOIN users u ON l.user_id=u.id JOIN categories c ON l.category_id=c.id
    ORDER BY l.created_at DESC LIMIT 5
  `).all();
  res.json({ totalUsers, totalListings, activeListings, totalMessages, totalFavs, premiumCount, bannedUsers, newUsersToday, newListingsToday, recentUsers, recentListings });
});

// GET /api/admin/users
app.get('/api/admin/users', requireAdmin, (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  let q = 'SELECT id, name, email, avatar, phone, city, rating, review_count, is_admin, is_banned, created_at FROM users';
  const params = [];
  if (search) { q += ' WHERE name LIKE ? OR email LIKE ?'; params.push(`%${search}%`, `%${search}%`); }
  const total = db.prepare(q.replace('SELECT id, name, email, avatar, phone, city, rating, review_count, is_admin, is_banned, created_at', 'SELECT COUNT(*) as c')).get(...params).c;
  q += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  const users = db.prepare(q).all(...params);
  res.json({ users, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

// PUT /api/admin/users/:id/ban
app.put('/api/admin/users/:id/ban', requireAdmin, (req, res) => {
  const user = db.prepare('SELECT id, is_banned, is_admin FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.is_admin) return res.status(400).json({ error: 'Cannot ban an admin' });
  const newBanned = user.is_banned ? 0 : 1;
  db.prepare('UPDATE users SET is_banned = ? WHERE id = ?').run(newBanned, req.params.id);
  res.json({ success: true, is_banned: newBanned });
});

// PUT /api/admin/users/:id/admin
app.put('/api/admin/users/:id/admin', requireAdmin, (req, res) => {
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot change your own admin status' });
  const user = db.prepare('SELECT id, is_admin FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const newAdmin = user.is_admin ? 0 : 1;
  db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(newAdmin, req.params.id);
  res.json({ success: true, is_admin: newAdmin });
});

// DELETE /api/admin/users/:id
app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// GET /api/admin/listings
app.get('/api/admin/listings', requireAdmin, (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;
  let q = `SELECT l.*, u.name as seller_name, c.name_ru, c.name_uz, c.name_en, c.icon as category_icon
           FROM listings l JOIN users u ON l.user_id=u.id JOIN categories c ON l.category_id=c.id WHERE 1=1`;
  const params = [];
  if (search) { q += ' AND (l.title LIKE ? OR l.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (status) { q += ' AND l.status = ?'; params.push(status); }
  const countQ = q.replace(/SELECT l\.\*.*?WHERE 1=1/, 'SELECT COUNT(*) as c FROM listings l JOIN users u ON l.user_id=u.id JOIN categories c ON l.category_id=c.id WHERE 1=1');
  const total = db.prepare(countQ).get(...params).c;
  q += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  const listings = db.prepare(q).all(...params).map(l => ({ ...l, images: JSON.parse(l.images || '[]') }));
  res.json({ listings, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

// PUT /api/admin/listings/:id/status
app.put('/api/admin/listings/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!['active', 'inactive', 'deleted'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE listings SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true, status });
});

// PUT /api/admin/listings/:id/premium
app.put('/api/admin/listings/:id/premium', requireAdmin, (req, res) => {
  const listing = db.prepare('SELECT id, is_premium FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  const newPremium = listing.is_premium ? 0 : 1;
  db.prepare('UPDATE listings SET is_premium = ? WHERE id = ?').run(newPremium, req.params.id);
  res.json({ success: true, is_premium: newPremium });
});

// DELETE /api/admin/listings/:id
app.delete('/api/admin/listings/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM listings WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// GET /api/admin/categories
app.get('/api/admin/categories', requireAdmin, (req, res) => {
  const cats = db.prepare('SELECT *, (SELECT COUNT(*) FROM listings WHERE category_id=categories.id) as listing_count FROM categories ORDER BY id').all();
  res.json(cats);
});

// POST /api/admin/categories
app.post('/api/admin/categories', requireAdmin, (req, res) => {
  const { name_ru, name_uz, name_en, icon, color, slug } = req.body;
  if (!name_ru || !name_en || !slug) return res.status(400).json({ error: 'name_ru, name_en, slug required' });
  const result = db.prepare('INSERT INTO categories (name_ru, name_uz, name_en, icon, color, slug) VALUES (?,?,?,?,?,?)')
    .run(name_ru, name_uz || name_en, name_en, icon || '🏷️', color || '#6B7280', slug);
  res.status(201).json(db.prepare('SELECT * FROM categories WHERE id=?').get(result.lastInsertRowid));
});

// PUT /api/admin/categories/:id
app.put('/api/admin/categories/:id', requireAdmin, (req, res) => {
  const cat = db.prepare('SELECT * FROM categories WHERE id=?').get(req.params.id);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const { name_ru, name_uz, name_en, icon, color, slug } = req.body;
  db.prepare('UPDATE categories SET name_ru=?,name_uz=?,name_en=?,icon=?,color=?,slug=? WHERE id=?')
    .run(name_ru||cat.name_ru, name_uz||cat.name_uz, name_en||cat.name_en, icon||cat.icon, color||cat.color, slug||cat.slug, req.params.id);
  res.json(db.prepare('SELECT * FROM categories WHERE id=?').get(req.params.id));
});

// DELETE /api/admin/categories/:id
app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as c FROM listings WHERE category_id=?').get(req.params.id).c;
  if (count > 0) return res.status(400).json({ error: `Cannot delete: ${count} listings use this category` });
  db.prepare('DELETE FROM categories WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Marketplace server running on http://localhost:${PORT}`);
});
