const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── 数据持久化 ───────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
  } catch { return []; }
}

function writeJSON(file, data) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

function nextId(arr) {
  return arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1;
}

// ─── 中间件 ──────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'deepstorm-demo-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
}));

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

// Auth 中间件
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: '请先登录' });
  next();
}

// ─── Auth 路由 ───────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
  if (password.length < 4) return res.status(400).json({ error: '密码至少 4 位' });

  const users = readJSON('users.json');
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ error: '用户名已存在' });
  }

  const user = { id: nextId(users), username, password, createdAt: new Date().toISOString() };
  users.push(user);
  writeJSON('users.json', users);
  res.status(201).json({ message: '注册成功' });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });

  const users = readJSON('users.json');
  const user = users.find(u => u.username === username);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  req.session.userId = user.id;
  req.session.username = user.username;
  res.json({ message: '登录成功', username: user.username });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: '已退出' }));
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ id: req.session.userId, username: req.session.username });
});

// ─── Task 路由 ───────────────────────────────────────
app.get('/api/tasks', requireAuth, (req, res) => {
  const userId = req.session.userId;
  let tasks = readJSON('tasks.json').filter(t => t.userId === userId);

  // 筛选
  const { status, q } = req.query;
  if (status) tasks = tasks.filter(t => t.status === status);
  if (q) tasks = tasks.filter(t =>
    t.title.toLowerCase().includes(q.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(q.toLowerCase())
  );

  res.json(tasks);
});

app.post('/api/tasks', requireAuth, (req, res) => {
  const { title, description } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: '任务标题不能为空' });

  const tasks = readJSON('tasks.json');
  const task = {
    id: nextId(tasks),
    userId: req.session.userId,
    title: title.trim(),
    description: (description || '').trim(),
    status: 'todo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tasks.push(task);
  writeJSON('tasks.json', tasks);
  res.status(201).json(task);
});

app.get('/api/tasks/:id', requireAuth, (req, res) => {
  const tasks = readJSON('tasks.json');
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  if (!task) return res.status(404).json({ error: '任务不存在' });
  if (task.userId !== req.session.userId) return res.status(403).json({ error: '无权访问' });
  res.json(task);
});

app.put('/api/tasks/:id', requireAuth, (req, res) => {
  const tasks = readJSON('tasks.json');
  const idx = tasks.findIndex(t => t.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: '任务不存在' });
  if (tasks[idx].userId !== req.session.userId) return res.status(403).json({ error: '无权修改' });

  const { title, description, status } = req.body;
  if (title !== undefined && !title.trim()) return res.status(400).json({ error: '任务标题不能为空' });

  if (title !== undefined) tasks[idx].title = title.trim();
  if (description !== undefined) tasks[idx].description = description.trim();
  if (status !== undefined) tasks[idx].status = status;
  tasks[idx].updatedAt = new Date().toISOString();
  writeJSON('tasks.json', tasks);
  res.json(tasks[idx]);
});

app.delete('/api/tasks/:id', requireAuth, (req, res) => {
  let tasks = readJSON('tasks.json');
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  if (!task) return res.status(404).json({ error: '任务不存在' });
  if (task.userId !== req.session.userId) return res.status(403).json({ error: '无权删除' });

  tasks = tasks.filter(t => t.id !== parseInt(req.params.id));
  writeJSON('tasks.json', tasks);
  res.json({ message: '已删除' });
});

// ─── 启动 ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✓ DeepStorm Demo running at http://localhost:${PORT}`);
});
