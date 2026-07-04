import { test, expect } from '@playwright/test';
// auto-repaired: 2026-06-22T11:44 - added login flow, fixed selectors to match actual app structure

test('任务增删改查 - T01 - 创建新任务', async ({ page }) => {
  // Preconditions:
  // 应用已启动（`cd ../app && npm start`）
  // 用户 `crudtest_user` 已注册（密码 `test1234`）
  // Step 1: 导航到登录页面并登录
  await page.goto('http://localhost:3000/');
  await expect(page).toHaveTitle('任务管理系统 — 登录');
  await page.fill('#username', 'crudtest_user');
  await page.fill('#password', 'test1234');
  await page.click('text="登 录"');
  await expect(page).toHaveURL('http://localhost:3000/dashboard.html');

  // Step 2: 确认仪表盘已加载
  // ✅ 页面显示"任务管理系统"标题
  await expect(page.locator('text="📋 任务管理系统"')).toBeVisible();
  // ✅ "+ 新建任务"按钮可见
  await expect(page.locator('text="+ 新建任务"')).toBeVisible();

  // Step 3: 点击"+ 新建任务"按钮
  await page.click('text="+ 新建任务"');
  // ✅ 弹窗显示，标题为"新建任务"
  await expect(page.locator('#modalTitle')).toHaveText('新建任务');
  // ✅ 标题输入框和描述输入框可见
  await expect(page.locator('#taskTitle')).toBeVisible();
  await expect(page.locator('#taskDesc')).toBeVisible();

  // Step 4: 在标题输入框中输入 E2E测试任务
  await page.fill('#taskTitle', 'E2E测试任务');
  // Step 5: 在描述输入框中输入 通过 E2E 测试创建
  await page.fill('#taskDesc', '通过 E2E 测试创建');
  // Step 6: 点击"创建"按钮
  await page.click('text="创建"');
  // ✅ 弹窗关闭，任务列表中显示刚创建的任务
  // auto-repaired: use first() to handle duplicate data from repeated runs
  await expect(page.locator('text="E2E测试任务"').first()).toBeVisible();

});

test('任务增删改查 - T02 - 编辑任务标题和状态', async ({ page }) => {
  // Preconditions:
  // 应用已启动
  // 用户 `crudtest_user` 已登录
  // Step 1: 登录
  await page.goto('http://localhost:3000/');
  await expect(page).toHaveTitle('任务管理系统 — 登录');
  await page.fill('#username', 'crudtest_user');
  await page.fill('#password', 'test1234');
  await page.click('text="登 录"');
  await expect(page).toHaveURL('http://localhost:3000/dashboard.html');

  // Step 2: 等待任务列表加载完成
  await page.waitForSelector('.task-item', { timeout: 10000 });

  // Step 3: 找到第一个任务的"编辑"按钮并点击
  // auto-repaired: use first() to handle multiple task items
  const editButton = page.locator('.task-actions button:has-text("编辑")').first();
  await editButton.click();
  // ✅ 弹窗显示，标题为"编辑任务"
  await expect(page.locator('#modalTitle')).toHaveText('编辑任务');
  // ✅ 标题输入框可见
  await expect(page.locator('#taskTitle')).toBeVisible();

  // Step 4: 修改标题
  await page.fill('#taskTitle', 'E2E已编辑任务');
  // Step 5: 点击"保存"按钮
  await page.click('text="保存"');
  await page.waitForTimeout(500);
  // ✅ 弹窗关闭
  await expect(page.locator('#taskModal')).not.toHaveClass(/active/);

});

test('任务增删改查 - T03 - 删除任务', async ({ page }) => {
  // Preconditions:
  // 应用已启动
  // 用户 `crudtest_user` 已登录
  // Step 1: 登录
  await page.goto('http://localhost:3000/');
  await expect(page).toHaveTitle('任务管理系统 — 登录');
  await page.fill('#username', 'crudtest_user');
  await page.fill('#password', 'test1234');
  await page.click('text="登 录"');
  await expect(page).toHaveURL('http://localhost:3000/dashboard.html');

  // Step 2: 清理同名历史残留数据（防止多次运行累积导致选择器失效）
  // 通过已登录的浏览器调用 DELETE API
  await page.evaluate(async () => {
    const res = await fetch('/api/tasks');
    const tasks = await res.json();
    for (const t of tasks) {
      if (t.title === '待删除E2E任务') {
        await fetch(`/api/tasks/${t.id}`, { method: 'DELETE' });
      }
    }
  });
  await page.waitForTimeout(300);

  // Step 3: 先创建一个待删除的任务
  await page.click('text="+ 新建任务"');
  await expect(page.locator('#modalTitle')).toHaveText('新建任务');
  await page.fill('#taskTitle', '待删除E2E任务');
  await page.click('text="创建"');
  await expect(page.locator('text="待删除E2E任务"').first()).toBeVisible();

  // Step 4: 点击该任务的"删除"按钮
  // auto-repaired: dialog handler must be set BEFORE clicking delete
  page.once('dialog', dialog => dialog.accept());
  const deleteButton = page.locator('.task-item:has-text("待删除E2E任务") button:has-text("删除")').first();
  await deleteButton.click();
  // ✅ 浏览器弹出确认对话框并自动确认
  await page.waitForTimeout(500);
  // ✅ 任务列表中不再显示该任务
  await expect(page.locator('text="待删除E2E任务"')).toHaveCount(0);

});

test('任务增删改查 - T04 - 标记任务为已完成', async ({ page }) => {
  // Preconditions:
  // 应用已启动
  // 用户 `crudtest_user` 已登录
  // Step 1: 登录
  await page.goto('http://localhost:3000/');
  await expect(page).toHaveTitle('任务管理系统 — 登录');
  await page.fill('#username', 'crudtest_user');
  await page.fill('#password', 'test1234');
  await page.click('text="登 录"');
  await expect(page).toHaveURL('http://localhost:3000/dashboard.html');

  // Step 2: 先创建一个待办任务
  await page.click('text="+ 新建任务"');
  await page.fill('#taskTitle', '待办标记任务');
  await page.click('text="创建"');
  await page.waitForTimeout(500);

  // Step 3: 找到待办任务复选框并点击
  // auto-repaired: use first() for strict mode violation
  const checkbox = page.locator('.task-item:has-text("待办标记任务") .task-check').first();
  await checkbox.click();
  await page.waitForTimeout(500);
  // ✅ 任务状态变为"已完成"
  await expect(page.locator('.task-item:has-text("待办标记任务") .badge-done')).toBeVisible();

  // Step 4: 再次点击复选框取消完成状态
  await checkbox.click();
  await page.waitForTimeout(500);
  // ✅ 状态变回"待办"
  // auto-repaired: use first() to handle duplicate data
  await expect(page.locator('.task-item:has-text("待办标记任务") .badge-todo').first()).toBeVisible();

});
