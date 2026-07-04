// ─── 状态 ──────────────────────────────────────────
let editingTaskId = null;

// ─── 初始化 ────────────────────────────────────────
async function init() {
  try {
    const res = await fetch('/api/me');
    const user = await res.json();
    if (!res.ok) throw new Error(user.error);
    document.getElementById('usernameDisplay').textContent = `👤 ${user.username}`;
    await loadTasks();
  } catch {
    window.location.href = '/';
  }
}

// ─── 任务列表 ──────────────────────────────────────
async function loadTasks() {
  const params = new URLSearchParams();
  const q = document.getElementById('searchInput').value.trim();
  const status = document.getElementById('statusFilter').value;
  if (q) params.set('q', q);
  if (status) params.set('status', status);

  const res = await fetch(`/api/tasks?${params}`);
  const tasks = await res.json();

  renderTasks(tasks);
  renderStats(tasks);
}

function renderTasks(tasks) {
  const el = document.getElementById('taskList');
  if (!tasks.length) {
    el.innerHTML = '<div class="empty">📭 暂无任务</div>';
    return;
  }

  el.innerHTML = tasks.map(t => `
    <div class="task-item">
      <input type="checkbox" class="task-check" ${t.status === 'done' ? 'checked' : ''}
             onchange="toggleTask(${t.id}, this.checked)">
      <div class="task-info">
        <span class="task-title ${t.status === 'done' ? 'done' : ''}">
          ${escapeHtml(t.title)}
          <span class="badge ${t.status === 'done' ? 'badge-done' : 'badge-todo'}">
            ${t.status === 'done' ? '已完成' : '待办'}
          </span>
        </span>
        ${t.description ? `<div class="task-desc">${escapeHtml(t.description)}</div>` : ''}
      </div>
      <div class="task-actions">
        <button class="btn btn-sm btn-success" onclick="openEditModal(${t.id})">编辑</button>
        <button class="btn btn-sm btn-danger" onclick="deleteTask(${t.id})">删除</button>
      </div>
    </div>
  `).join('');
}

function renderStats(tasks) {
  document.getElementById('statTotal').textContent = tasks.length;
  document.getElementById('statTodo').textContent = tasks.filter(t => t.status === 'todo').length;
  document.getElementById('statDone').textContent = tasks.filter(t => t.status === 'done').length;
}

// ─── 任务操作 ──────────────────────────────────────
async function toggleTask(id, done) {
  await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: done ? 'done' : 'todo' }),
  });
  await loadTasks();
}

async function deleteTask(id) {
  if (!confirm('确定删除此任务？')) return;
  const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  if (res.ok) await loadTasks();
  else alert('删除失败');
}

// ─── Modal ─────────────────────────────────────────
function openCreateModal() {
  editingTaskId = null;
  document.getElementById('modalTitle').textContent = '新建任务';
  document.getElementById('taskTitle').value = '';
  document.getElementById('taskDesc').value = '';
  document.getElementById('statusGroup').style.display = 'none';
  document.getElementById('saveBtn').textContent = '创建';
  document.getElementById('taskModal').classList.add('active');
}

async function openEditModal(id) {
  editingTaskId = id;
  const res = await fetch(`/api/tasks/${id}`);
  const task = await res.json();
  document.getElementById('modalTitle').textContent = '编辑任务';
  document.getElementById('taskTitle').value = task.title;
  document.getElementById('taskDesc').value = task.description || '';
  document.getElementById('taskStatus').value = task.status;
  document.getElementById('statusGroup').style.display = 'block';
  document.getElementById('saveBtn').textContent = '保存';
  document.getElementById('taskModal').classList.add('active');
}

function closeModal() {
  document.getElementById('taskModal').classList.remove('active');
}

async function saveTask() {
  const title = document.getElementById('taskTitle').value.trim();
  const description = document.getElementById('taskDesc').value.trim();

  if (!title) {
    alert('标题不能为空');
    return;
  }

  if (editingTaskId) {
    const status = document.getElementById('taskStatus').value;
    const res = await fetch(`/api/tasks/${editingTaskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, status }),
    });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
  } else {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
  }

  closeModal();
  await loadTasks();
}

// ─── 工具函数 ──────────────────────────────────────
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── 事件绑定 ──────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/';
});

// ─── 启动 ──────────────────────────────────────────
init();

// Enter 快速搜索
document.getElementById('searchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loadTasks();
});
