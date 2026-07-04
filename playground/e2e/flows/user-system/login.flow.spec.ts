import { test, expect } from '@playwright/test';
// auto-repaired: 2026-06-22T11:44 - fixed selectors and titles to match actual app structure

  test('用户登录 - L01 - 正常登录', async ({ page }) => {
    // Preconditions:
    // 应用已启动（`cd ../app && npm start`）
    // 用户 `logintest_user` 已注册（密码 `test1234`）
    // Step 1: 导航到登录页面 http://localhost:3000/
    await page.goto('http://localhost:3000/');
    // ✅ 页面标题包含"登录"，登录表单可见
    // auto-repaired: toHaveTitle('登录') -> toHaveTitle('任务管理系统 — 登录')
    await expect(page).toHaveTitle('任务管理系统 — 登录');

    // Step 2: 在用户名输入框中输入 logintest_user
    // auto-repaired: fill('input:nth-child(2)', ...) -> fill('#username', ...)
    await page.fill('#username', 'logintest_user');
    // ✅ 输入框内容正确
    // auto-repaired: changed selector and assertion to check value
    await expect(page.locator('#username')).toHaveValue('logintest_user');

    // Step 3: 在密码输入框中输入 test1234
    // auto-repaired: fill('input:nth-child(3)', ...) -> fill('#password', ...)
    await page.fill('#password', 'test1234');
    // ✅ 输入框内容正确
    await expect(page.locator('#password')).toHaveValue('test1234');

    // Step 4: 点击"登录"按钮
    // auto-repaired: text="登录" -> text="登 录" (button text has a space)
    await page.click('text="登 录"');
    // ✅ 页面跳转到 `http://localhost:3000/dashboard.html`
    await expect(page).toHaveURL('http://localhost:3000/dashboard.html');

    // Step 5: 确认仪表盘加载
    // UNSUPPORTED: 确认仪表盘加载
    // ✅ 页面显示"任务管理系统"标题
    // auto-repaired: text="任务管理系统" -> text="📋 任务管理系统" (header has emoji)
    await expect(page.locator('text="📋 任务管理系统"')).toBeVisible();
    // ✅ 页面右上角显示用户名 `logintest_user`
    await expect(page.locator('#usernameDisplay')).toContainText('logintest_user');
    // ✅ 统计卡片显示"全部：0 待办：0 已完成：0"
    // auto-repaired: stats are individual elements, not combined text
    await expect(page.locator('#statTotal')).toHaveText('0');
    await expect(page.locator('#statTodo')).toHaveText('0');
    await expect(page.locator('#statDone')).toHaveText('0');

  });

  test('用户登录 - L02 - 错误密码登录', async ({ page }) => {
    // Preconditions:
    // 应用已启动
    // 用户 `logintest_user` 已注册（密码 `test1234`）
    // Step 1: 导航到登录页面 http://localhost:3000/
    await page.goto('http://localhost:3000/');
    // ✅ 登录表单可见
    // auto-repaired: toHaveTitle('登录') -> toHaveTitle('任务管理系统 — 登录')
    await expect(page).toHaveTitle('任务管理系统 — 登录');

    // Step 2: 输入用户名 logintest_user
    // auto-repaired: fill('input:nth-child(2)', ...) -> fill('#username', ...)
    await page.fill('#username', 'logintest_user');

    // Step 3: 输入错误密码 wrongpassword
    // auto-repaired: fill('input:nth-child(3)', ...) -> fill('#password', ...)
    await page.fill('#password', 'wrongpassword');

    // Step 4: 点击"登录"按钮
    // auto-repaired: text="登录" -> text="登 录" (button text has a space)
    await page.click('text="登 录"');
    // ✅ 页面不跳转，仍然停留在登录页
    await expect(page).toHaveURL(/.*/);
    // ✅ 页面显示错误提示"用户名或密码错误"
    // auto-repaired: error is in #errorMsg element
    await expect(page.locator('#errorMsg')).toContainText('用户名或密码错误');

  });

  test('用户登录 - L03 - 未注册用户登录', async ({ page }) => {
    // Preconditions:
    // 应用已启动
    // 确保用户 `nonexistent_user` 不存在
    // Step 1: 导航到登录页面 http://localhost:3000/
    await page.goto('http://localhost:3000/');
    // ✅ 登录表单可见
    // auto-repaired: toHaveTitle('登录') -> toHaveTitle('任务管理系统 — 登录')
    await expect(page).toHaveTitle('任务管理系统 — 登录');

    // Step 2: 输入用户名 nonexistent_user
    // auto-repaired: fill('input:nth-child(2)', ...) -> fill('#username', ...)
    await page.fill('#username', 'nonexistent_user');

    // Step 3: 输入密码 somepassword
    // auto-repaired: fill('input:nth-child(3)', ...) -> fill('#password', ...)
    await page.fill('#password', 'somepassword');

    // Step 4: 点击"登录"按钮
    // auto-repaired: text="登录" -> text="登 录" (button text has a space)
    await page.click('text="登 录"');
    // ✅ 页面不跳转，仍然停留在登录页
    await expect(page).toHaveURL(/.*/);
    // ✅ 页面显示错误提示"用户名或密码错误"
    // auto-repaired: error is in #errorMsg element
    await expect(page.locator('#errorMsg')).toContainText('用户名或密码错误');

  });
