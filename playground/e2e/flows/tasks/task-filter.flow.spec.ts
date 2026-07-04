import { test, expect } from '@playwright/test';
// auto-repaired: 2026-06-22T11:44 - added login flow, fixed selectors to match actual app structure

test('任务筛选与搜索 - F01 - 按状态筛选任务', async ({ page }) => {
  // Preconditions:
  // 应用已启动（`cd ../app && npm start`）
  // 用户 `filtertest_user` 已注册并登录（密码 `test1234`）
  // 存在多个任务，包含待办和已完成
  // Step 1: 登录
  await page.goto('http://localhost:3000/');
  await expect(page).toHaveTitle('任务管理系统 — 登录');
  await page.fill('#username', 'filtertest_user');
  await page.fill('#password', 'test1234');
  await page.click('text="登 录"');
  await expect(page).toHaveURL('http://localhost:3000/dashboard.html');
  await expect(page.locator('text="📋 任务管理系统"')).toBeVisible();

  // Step 2: 在状态筛选下拉框中选择"已完成"
  // auto-repaired: select -> #statusFilter
  await page.selectOption('#statusFilter', 'done');
  await page.waitForTimeout(500);
  // ✅ 任务列表更新
  await expect(page.locator('#taskList')).toBeVisible();

  // Step 3: 在状态筛选下拉框中选择"待办"
  await page.selectOption('#statusFilter', 'todo');
  await page.waitForTimeout(500);
  await expect(page.locator('#taskList')).toBeVisible();

  // Step 4: 在状态筛选下拉框中选择"全部状态"
  await page.selectOption('#statusFilter', '');
  await page.waitForTimeout(500);
  await expect(page.locator('#taskList')).toBeVisible();

});

test('任务筛选与搜索 - F02 - 关键字搜索任务', async ({ page }) => {
  // Preconditions:
  // 应用已启动
  // 用户 `filtertest_user` 已登录
  // 存在任务"购买办公用品"和"提交周报"
  // Step 1: 登录
  await page.goto('http://localhost:3000/');
  await expect(page).toHaveTitle('任务管理系统 — 登录');
  await page.fill('#username', 'filtertest_user');
  await page.fill('#password', 'test1234');
  await page.click('text="登 录"');
  await expect(page).toHaveURL('http://localhost:3000/dashboard.html');
  await expect(page.locator('text="📋 任务管理系统"')).toBeVisible();

  // Step 2: 在搜索框中输入"办公"
  // auto-repaired: [placeholder="办公" i] -> #searchInput
  await page.fill('#searchInput', '办公');
  // 触发搜索（Enter 键或加载）
  await page.locator('#searchInput').press('Enter');
  await page.waitForTimeout(500);

  // ✅ 搜索结果应包含"购买办公用品"
  await expect(page.locator('text="购买办公用品"')).toBeVisible();

  // Step 3: 清空搜索框
  await page.fill('#searchInput', '');
  await page.locator('#searchInput').press('Enter');
  await page.waitForTimeout(500);
  // ✅ 任务列表恢复显示所有任务
  await expect(page.locator('#taskList')).toBeVisible();

});

test('任务筛选与搜索 - F03 - 搜索不存在内容', async ({ page }) => {
  // Preconditions:
  // 应用已启动
  // 用户 `filtertest_user` 已登录
  // 存在至少一个任务
  // Step 1: 登录
  await page.goto('http://localhost:3000/');
  await expect(page).toHaveTitle('任务管理系统 — 登录');
  await page.fill('#username', 'filtertest_user');
  await page.fill('#password', 'test1234');
  await page.click('text="登 录"');
  await expect(page).toHaveURL('http://localhost:3000/dashboard.html');
  await expect(page.locator('text="📋 任务管理系统"')).toBeVisible();

  // Step 2: 在搜索框中输入不存在的关键字 xyz_nonexistent_abc
  // auto-repaired: input:nth-child(2) -> #searchInput
  await page.fill('#searchInput', 'xyz_nonexistent_abc');
  await page.locator('#searchInput').press('Enter');
  await page.waitForTimeout(500);
  // ✅ 任务列表显示"暂无任务"空状态提示
  // auto-repaired: empty state div has emoji prefix "📭 暂无任务"
  await expect(page.locator('.empty')).toContainText('暂无任务');

  // Step 3: 清空搜索框
  await page.fill('#searchInput', '');
  await page.locator('#searchInput').press('Enter');
  await page.waitForTimeout(500);
  // ✅ 任务列表恢复显示所有任务
  await expect(page.locator('#taskList')).toBeVisible();

});
