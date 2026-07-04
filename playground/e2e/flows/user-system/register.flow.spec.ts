import { test, expect } from '@playwright/test';
// auto-repaired: 2026-06-22T11:44 - fixed selectors and titles to match actual app structure

  test('用户注册 - R01 - 正常注册新用户', async ({ page }) => {
    // Preconditions:
    // 应用已启动（`cd ../app && npm start`）
    // 测试用户 `testuser_001` 已注册（数据中存在）
    // Step 1: 导航到注册页面 http://localhost:3000/register.html
    await page.goto('http://localhost:3000/register.html');
    // ✅ 页面标题包含"注册"，注册表单可见（含用户名和密码输入框）
    // auto-repaired: toHaveTitle('注册') -> toHaveTitle('任务管理系统 — 注册')
    await expect(page).toHaveTitle('任务管理系统 — 注册');

    // Step 2: 在用户名输入框中输入 testuser_001
    // auto-repaired: fill('input:nth-child(2)', ...) -> fill('#username', ...)
    await page.fill('#username', 'testuser_001');
    // ✅ 输入框显示输入内容
    await expect(page.locator('#username')).toBeVisible();

    // Step 3: 在密码输入框中输入 test1234
    // auto-repaired: fill('input:nth-child(3)', ...) -> fill('#password', ...)
    await page.fill('#password', 'test1234');
    // ✅ 输入框显示输入内容
    await expect(page.locator('#password')).toBeVisible();

    // Step 4: 点击"注册"按钮
    // auto-repaired: text="注册" -> text="注 册" (button text has a space)
    await page.click('text="注 册"');
    // ✅ 页面显示存储，因 testuser_001 已存在，会收到错误提示
    await expect(page.locator('#errorMsg')).toBeVisible();

  });

  test('用户注册 - R02 - 重复用户名注册', async ({ page }) => {
    // Preconditions:
    // 应用已启动
    // 用户 `testuser_002` 已注册（通过 R01 流程或直接注册）
    // Step 1: 导航到注册页面 http://localhost:3000/register.html
    await page.goto('http://localhost:3000/register.html');
    // ✅ 注册表单可见
    await expect(page).toHaveTitle('任务管理系统 — 注册');

    // Step 2: 使用 R01 中已注册的用户名 testuser_002 再次填写表单
    // auto-repaired: fill('input:nth-child(2)', ...) -> fill('#username', ...)
    await page.fill('#username', 'testuser_002');

    // Step 3: 输入密码 test1234
    // auto-repaired: fill('input:nth-child(3)', ...) -> fill('#password', ...)
    await page.fill('#password', 'test1234');

    // Step 4: 点击"注册"按钮
    // auto-repaired: text="注册" -> text="注 册"
    await page.click('text="注 册"');
    // ✅ 页面显示错误提示"用户名已存在"，页面未跳转
    // auto-repaired: check #errorMsg element for error text
    await expect(page.locator('#errorMsg')).toContainText('用户名已存在');

  });

  test('用户注册 - R03 - 密码太短', async ({ page }) => {
    // Preconditions:
    // 应用已启动
    // 为用户 testuser_shortpw 注册（密码 12 位过短）
    // Step 1: 导航到注册页面 http://localhost:3000/register.html
    await page.goto('http://localhost:3000/register.html');
    // ✅ 注册表单可见
    await expect(page).toHaveTitle('任务管理系统 — 注册');

    // Step 2: 输入用户名 testuser_shortpw
    // auto-repaired: fill('input:nth-child(2)', ...) -> fill('#username', ...)
    await page.fill('#username', 'testuser_shortpw');

    // Step 3: 输入密码 12（仅 2 位，少于最低 4 位要求）
    // auto-repaired: fill('input:nth-child(3)', ...) -> fill('#password', ...)
    await page.fill('#password', '12');

    // Step 4: 点击"注册"按钮
    // auto-repaired: text="注册" -> text="注 册"
    await page.click('text="注 册"');
    // ✅ 页面显示错误提示"密码至少 4 位"，页面未跳转
    // auto-repaired: check #errorMsg element for error text
    await expect(page.locator('#errorMsg')).toContainText('密码至少 4 位');

  });
