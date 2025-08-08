// Custom json-server to fully mock the Frontend API (no backend required)
// Run with: node mock-server/server.cjs

const jsonServer = require('json-server');
const path = require('path');

const PORT = process.env.MOCK_PORT ? Number(process.env.MOCK_PORT) : 3001;
const API_PREFIX = '/api/v1';

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults({ logger: true });
const routes = require(path.join(__dirname, 'routes.json'));
const rewriter = jsonServer.rewriter(routes);

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Small artificial delay to simulate network
server.use((req, res, next) => {
  setTimeout(next, 150);
});

// Helpers
const nowIso = () => new Date().toISOString();
const generateId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
const getCorrelationId = (req) => req.headers['x-correlation-id'] || generateId('cid');

const apiOk = (req, data, pagination) => ({
  success: true,
  data,
  message: 'OK',
  errors: [],
  metadata: {
    timestamp: nowIso(),
    correlationId: getCorrelationId(req),
    ...(pagination ? { pagination } : {}),
  },
});

const db = router.db; // lowdb instance

// Ensure required collections exist
['users', 'publications', 'reviews', 'notifications', 'statusHistory', 'notificationSubscriptions', 'notificationPreferences', 'catalogPublications', 'catalogAuthors', 'categories']
  .forEach((key) => {
    if (!db.has(key).value()) db.set(key, []).write();
  });

// Seed defaults if empty
if (db.get('users').value().length === 0) {
  db.get('users')
    .push({
      id: 1,
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@test.com',
      role: 'ROLE_ADMIN',
      affiliation: 'Universidad de las Fuerzas Armadas ESPE',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })
    .write();
}

// ===================== AUTH =====================
server.post(`${API_PREFIX}/auth/login`, (req, res) => {
  const { email } = req.body || {};
  const user = db.get('users').find({ email }).value() || db.get('users').first().value();
  const response = {
    message: 'Login successful',
    user,
    accessToken: generateId('access'),
    refreshToken: generateId('refresh'),
  };
  return res.json(response);
});

server.post(`${API_PREFIX}/auth/register`, (req, res) => {
  const payload = req.body || {};
  const nextId = Math.max(...db.get('users').map('id').value(), 0) + 1;
  const user = {
    id: nextId,
    firstName: payload.firstName || 'User',
    lastName: payload.lastName || 'Test',
    email: payload.email || `user${nextId}@test.com`,
    role: payload.role || 'ROLE_AUTOR',
    affiliation: payload.affiliation || '',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.get('users').push(user).write();
  const response = {
    message: 'User registered',
    user,
    accessToken: generateId('access'),
    refreshToken: generateId('refresh'),
  };
  return res.json(response);
});

server.get(`${API_PREFIX}/auth/profile`, (req, res) => {
  const user = db.get('users').first().value();
  return res.json(user);
});

server.put(`${API_PREFIX}/auth/profile`, (req, res) => {
  const updates = req.body || {};
  const user = db.get('users').first().assign({ ...updates, updatedAt: nowIso() }).write();
  return res.json(user);
});

server.post(`${API_PREFIX}/auth/refresh`, (req, res) => {
  const tokens = {
    accessToken: generateId('access'),
    refreshToken: generateId('refresh'),
  };
  // Return both flat tokens and ApiResponse-wrapped to satisfy both callers
  return res.json({
    ...apiOk(req, tokens),
    ...tokens,
  });
});

server.post(`${API_PREFIX}/auth/logout`, (req, res) => {
  return res.status(200).json({ message: 'Logged out' });
});

server.get(`${API_PREFIX}/auth/jwks`, (req, res) => {
  return res.json({ keys: [] });
});

// ===================== PUBLICATIONS =====================
server.get(`${API_PREFIX}/publications`, (req, res) => {
  const { page = 1, limit = 20, status, type, primaryAuthorId } = req.query;
  let items = db.get('publications').value();
  if (status) items = items.filter((p) => p.status === status);
  if (type) items = items.filter((p) => p.type === type);
  if (primaryAuthorId) items = items.filter((p) => String(p.primaryAuthorId) === String(primaryAuthorId));
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limitNum));
  const start = (pageNum - 1) * limitNum;
  const data = items.slice(start, start + limitNum);
  return res.json(
    apiOk(req, data, {
      page: pageNum,
      limit: limitNum,
      totalCount,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1,
    })
  );
});

server.get(`${API_PREFIX}/publications/:id`, (req, res) => {
  const pub = db.get('publications').find({ id: req.params.id }).value();
  if (!pub) return res.status(404).json({ success: false, message: 'Not found' });
  return res.json(apiOk(req, pub));
});

server.post(`${API_PREFIX}/publications`, (req, res) => {
  const payload = req.body || {};
  const id = generateId('p');
  const record = {
    id,
    title: payload.title || 'Untitled',
    abstract: payload.abstract || '',
    keywords: payload.keywords || [],
    type: payload.type || 'ARTICLE',
    status: 'DRAFT',
    currentVersion: 1,
    primaryAuthorId: payload.primaryAuthorId || String(db.get('users').first().value().id),
    coAuthorIds: payload.coAuthorIds || [],
    metadata: payload.metadata || {},
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.get('publications').push(record).write();
  return res.status(201).json(apiOk(req, record));
});

server.put(`${API_PREFIX}/publications/:id`, (req, res) => {
  const updates = req.body || {};
  const updated = db
    .get('publications')
    .find({ id: req.params.id })
    .assign({ ...updates, updatedAt: nowIso() })
    .write();
  if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
  return res.json(apiOk(req, updated));
});

const pushStatusHistory = (publicationId, fromStatus, toStatus, notes) => {
  const item = {
    id: generateId('sh'),
    fromStatus,
    toStatus,
    changedBy: '1',
    changedByName: 'System Administrator',
    notes,
    timestamp: nowIso(),
  };
  db.get('statusHistory').push({ publicationId, ...item }).write();
  return item;
};

server.post(`${API_PREFIX}/publications/:id/submit-for-review`, (req, res) => {
  const pub = db.get('publications').find({ id: req.params.id }).value();
  if (!pub) return res.status(404).json({ success: false, message: 'Not found' });
  const from = pub.status;
  db.get('publications').find({ id: pub.id }).assign({ status: 'IN_REVIEW', submittedAt: nowIso(), updatedAt: nowIso() }).write();
  pushStatusHistory(pub.id, from, 'IN_REVIEW', req.body?.notes || 'Submitted for review');
  return res.json(apiOk(req, null));
});

server.get(`${API_PREFIX}/publications/:id/reviews`, (req, res) => {
  const list = db.get('reviews').filter({ publicationId: req.params.id }).value();
  return res.json(apiOk(req, list));
});

server.post(`${API_PREFIX}/publications/:id/reviews`, (req, res) => {
  const id = generateId('r');
  const payload = req.body || {};
  const rec = {
    id,
    publicationId: req.params.id,
    publicationTitle: db.get('publications').find({ id: req.params.id }).value()?.title || 'Untitled',
    reviewerId: '1',
    reviewerName: 'System Administrator',
    status: 'ASSIGNED',
    comments: payload.comments || '',
    createdAt: nowIso(),
    changeRequests: [],
  };
  db.get('reviews').push(rec).write();
  return res.status(201).json(apiOk(req, null));
});

server.put(`${API_PREFIX}/publications/:id/approve`, (req, res) => {
  const pub = db.get('publications').find({ id: req.params.id }).value();
  if (!pub) return res.status(404).json({ success: false, message: 'Not found' });
  const from = pub.status;
  db.get('publications').find({ id: pub.id }).assign({ status: 'APPROVED', updatedAt: nowIso() }).write();
  pushStatusHistory(pub.id, from, 'APPROVED', req.body?.notes || 'Approved');
  return res.json(apiOk(req, null));
});

server.put(`${API_PREFIX}/publications/:id/publish`, (req, res) => {
  const pub = db.get('publications').find({ id: req.params.id }).value();
  if (!pub) return res.status(404).json({ success: false, message: 'Not found' });
  const from = pub.status;
  db.get('publications').find({ id: pub.id }).assign({ status: 'PUBLISHED', publishedAt: nowIso(), updatedAt: nowIso() }).write();
  pushStatusHistory(pub.id, from, 'PUBLISHED', req.body?.notes || 'Published');
  return res.json(apiOk(req, null));
});

server.put(`${API_PREFIX}/publications/:id/request-changes`, (req, res) => {
  const pub = db.get('publications').find({ id: req.params.id }).value();
  if (!pub) return res.status(404).json({ success: false, message: 'Not found' });
  const from = pub.status;
  db.get('publications').find({ id: pub.id }).assign({ status: 'CHANGES_REQUESTED', updatedAt: nowIso() }).write();
  pushStatusHistory(pub.id, from, 'CHANGES_REQUESTED', req.body?.notes || 'Changes requested');
  return res.json(apiOk(req, null));
});

server.get(`${API_PREFIX}/publications/:id/history`, (req, res) => {
  const list = db.get('statusHistory').filter({ publicationId: req.params.id }).value();
  return res.json(apiOk(req, list));
});

// ===================== REVIEWS =====================
server.get(`${API_PREFIX}/reviews`, (req, res) => {
  const list = db.get('reviews').value();
  return res.json(apiOk(req, list));
});

server.get(`${API_PREFIX}/reviews/:id/detail`, (req, res) => {
  const item = db.get('reviews').find({ id: req.params.id }).value();
  if (!item) return res.status(404).json({ success: false, message: 'Not found' });
  return res.json(apiOk(req, item));
});

server.put(`${API_PREFIX}/reviews/:id/complete`, (req, res) => {
  const updates = req.body || {};
  const updated = db
    .get('reviews')
    .find({ id: req.params.id })
    .assign({
      status: 'COMPLETED',
      overallRecommendation: updates.overallRecommendation || 'ACCEPT',
      comments: updates.comments || '',
      strengths: updates.strengths,
      weaknesses: updates.weaknesses,
      suggestions: updates.suggestions,
      confidenceLevel: updates.confidenceLevel,
      changeRequests: updates.changeRequests || [],
      completedAt: nowIso(),
    })
    .write();
  if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
  return res.json(apiOk(req, null));
});

// ===================== NOTIFICATIONS =====================
server.get(`${API_PREFIX}/notifications`, (req, res) => {
  const { page = 1, limit = 20, userId, status, type, channel } = req.query;
  let items = db.get('notifications').value();
  if (userId) items = items.filter((n) => String(n.userId) === String(userId));
  if (status) items = items.filter((n) => n.status === status);
  if (type) items = items.filter((n) => n.type === type);
  if (channel) items = items.filter((n) => n.channel === channel);
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limitNum));
  const start = (pageNum - 1) * limitNum;
  const data = items.slice(start, start + limitNum);
  return res.json(
    apiOk(req, data, {
      page: pageNum,
      limit: limitNum,
      totalCount,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1,
    })
  );
});

server.get(`${API_PREFIX}/notifications/unread-count`, (req, res) => {
  const { userId } = req.query;
  let items = db.get('notifications').value();
  if (userId) items = items.filter((n) => String(n.userId) === String(userId));
  const count = items.filter((n) => n.status !== 'READ').length;
  return res.json(apiOk(req, { count }));
});

server.put(`${API_PREFIX}/notifications/:id/mark-read`, (req, res) => {
  const updated = db
    .get('notifications')
    .find({ id: req.params.id })
    .assign({ status: 'READ', readAt: nowIso() })
    .write();
  if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
  return res.json(apiOk(req, null));
});

server.put(`${API_PREFIX}/notifications/mark-all-read`, (req, res) => {
  const { userId } = req.query;
  let chain = db.get('notifications');
  const items = chain.value();
  const targetIds = items
    .filter((n) => (userId ? String(n.userId) === String(userId) : true))
    .map((n) => n.id);
  targetIds.forEach((id) => {
    chain.find({ id }).assign({ status: 'READ', readAt: nowIso() }).write();
  });
  return res.json(apiOk(req, null));
});

server.delete(`${API_PREFIX}/notifications/:id`, (req, res) => {
  db.get('notifications').remove({ id: req.params.id }).write();
  return res.json(apiOk(req, null));
});

server.delete(`${API_PREFIX}/notifications/clear-read`, (req, res) => {
  db.get('notifications').remove((n) => n.status === 'READ').write();
  return res.json(apiOk(req, null));
});

// Subscriptions
server.get(`${API_PREFIX}/notifications/subscriptions`, (req, res) => {
  const list = db.get('notificationSubscriptions').value();
  return res.json(apiOk(req, list));
});

server.post(`${API_PREFIX}/notifications/subscriptions`, (req, res) => {
  const id = generateId('ns');
  const payload = req.body || {};
  const rec = {
    id,
    userId: String(payload.userId || 1),
    type: payload.type || 'USER_LOGIN',
    channel: payload.channel || 'WEBSOCKET',
    enabled: payload.enabled ?? true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.get('notificationSubscriptions').push(rec).write();
  return res.status(201).json(apiOk(req, rec));
});

server.put(`${API_PREFIX}/notifications/subscriptions/:id`, (req, res) => {
  const updates = req.body || {};
  const updated = db
    .get('notificationSubscriptions')
    .find({ id: req.params.id })
    .assign({ ...updates, updatedAt: nowIso() })
    .write();
  if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
  return res.json(apiOk(req, updated));
});

server.delete(`${API_PREFIX}/notifications/subscriptions/:id`, (req, res) => {
  db.get('notificationSubscriptions').remove({ id: req.params.id }).write();
  return res.json(apiOk(req, null));
});

// Preferences
server.get(`${API_PREFIX}/notifications/preferences`, (req, res) => {
  let pref = db.get('notificationPreferences').first().value();
  if (!pref) {
    pref = {
      id: generateId('np'),
      userId: '1',
      emailNotifications: false,
      pushNotifications: false,
      websocketNotifications: true,
      notificationTypes: ['USER_LOGIN', 'PUBLICATION_PUBLISHED'],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.get('notificationPreferences').push(pref).write();
  }
  return res.json(apiOk(req, pref));
});

server.put(`${API_PREFIX}/notifications/preferences`, (req, res) => {
  let pref = db.get('notificationPreferences').first().value();
  if (!pref) {
    pref = { id: generateId('np'), userId: '1', createdAt: nowIso() };
    db.get('notificationPreferences').push(pref).write();
  }
  const updated = db
    .get('notificationPreferences')
    .find({ id: pref.id })
    .assign({ ...req.body, updatedAt: nowIso() })
    .write();
  return res.json(apiOk(req, updated));
});

// ===================== CATALOG =====================
server.get(`${API_PREFIX}/catalog/publications`, (req, res) => {
  const { q, type, author, category, page = 1, limit = 20, sortBy = 'relevance', sortOrder = 'desc' } = req.query;
  let items = db.get('catalogPublications').value();
  if (q) {
    const qLower = String(q).toLowerCase();
    items = items.filter((p) =>
      [p.title, p.abstract, ...(p.keywords || [])].join(' ').toLowerCase().includes(qLower)
    );
  }
  if (type) items = items.filter((p) => p.type === type);
  if (author) items = items.filter((p) => String(p.primaryAuthor) === String(author) || (p.coAuthors || []).includes(author));
  if (category) items = items.filter((p) => p.category === category);

  // Sort (very naive)
  const sorted = [...items].sort((a, b) => {
    if (sortBy === 'date') return (a.publishedAt || '').localeCompare(b.publishedAt || '') * (sortOrder === 'asc' ? 1 : -1);
    if (sortBy === 'title') return a.title.localeCompare(b.title) * (sortOrder === 'asc' ? 1 : -1);
    return 0;
  });

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const totalCount = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limitNum));
  const start = (pageNum - 1) * limitNum;
  const publications = sorted.slice(start, start + limitNum);

  // Facets (very naive)
  const facets = {
    types: Object.values(
      publications.reduce((acc, p) => {
        acc[p.type] = { type: p.type, count: (acc[p.type]?.count || 0) + 1 };
        return acc;
      }, {})
    ),
    categories: Object.values(
      publications.reduce((acc, p) => {
        acc[p.category] = { category: p.category, count: (acc[p.category]?.count || 0) + 1 };
        return acc;
      }, {})
    ),
    years: [],
    authors: [],
  };

  const response = {
    publications,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalCount,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1,
    },
    facets,
    executionTime: 5,
  };
  return res.json(response);
});

server.get(`${API_PREFIX}/catalog/publications/:id`, (req, res) => {
  const item = db.get('catalogPublications').find({ id: req.params.id }).value();
  if (!item) return res.status(404).json({ message: 'Not found' });
  const detail = {
    ...item,
    metadata: item.metadata || {},
    license: item.license || 'CC-BY-4.0',
    doi: item.doi || '10.0000/mock',
    relatedPublications: db.get('catalogPublications').take(3).value(),
  };
  return res.json(detail);
});

server.get(`${API_PREFIX}/catalog/authors`, (req, res) => {
  const list = db.get('catalogAuthors').value();
  return res.json(apiOk(req, list));
});

server.get(`${API_PREFIX}/catalog/authors/:id/publications`, (req, res) => {
  const author = db.get('catalogAuthors').find({ id: req.params.id }).value();
  const publications = db.get('catalogPublications').filter((p) => String(p.primaryAuthor) === String(author?.fullName)).value();
  const payload = {
    author: author || null,
    publications,
    pagination: {
      page: 1,
      limit: publications.length,
      totalCount: publications.length,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  };
  return res.json(payload);
});

server.get(`${API_PREFIX}/catalog/categories`, (req, res) => {
  const list = db.get('categories').value();
  return res.json(list);
});

server.get(`${API_PREFIX}/catalog/statistics`, (req, res) => {
  const publications = db.get('catalogPublications').value();
  const authors = db.get('catalogAuthors').value();
  const publicationsByType = Object.values(
    publications.reduce((acc, p) => {
      acc[p.type] = { type: p.type, count: (acc[p.type]?.count || 0) + 1 };
      return acc;
    }, {})
  );
  const topCategories = Object.values(
    publications.reduce((acc, p) => {
      acc[p.category] = { category: p.category, count: (acc[p.category]?.count || 0) + 1 };
      return acc;
    }, {})
  );
  const payload = {
    totalPublications: publications.length,
    totalAuthors: authors.length,
    publicationsByType,
    publicationsByYear: [],
    topCategories,
    recentPublications: publications.slice(0, 5),
  };
  return res.json(payload);
});

// Apply rewrites and fallback to default router for any other endpoints
server.use(rewriter);

// Wrap default router responses which need ApiResponse shape?
// Note: We have already custom-handled all endpoints the app uses.
server.use(router);

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Mock API listening on http://localhost:${PORT}${API_PREFIX}`);
});


