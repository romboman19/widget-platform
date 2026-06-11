#!/usr/bin/env node
/**
 * Acceptance Test: FLOATING_MENU v2 full cycle
 * 
 * Сценарій:
 * 1. Логін в адмінку
 * 2. Створити сайт
 * 3. Створити FLOATING_MENU з horizontal layout
 * 4. Дві кнопки: direct phone + menu з 3 каналами
 * 5. Іконки через Icon picker
 * 6. Скріншот live preview
 * 7. Зберегти
 * 8. Відкрити тест-сторінку з embed
 * 9. Скріншот
 * 10. Порівняти
 * 11. Перевірити analytics (no pollution)
 */

import { AgentBrowser } from '@openclaw/agent-browser';
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const SCREENSHOT_DIR = join(__dirname, '..', 'test-artifacts', 'acceptance-test');

// Ensure screenshot directory exists
if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const BASE_URL = process.env.TEST_URL || 'http://localhost:8090';
const ADMIN_URL = `${BASE_URL}/admin`;
const API_URL = `${BASE_URL}/api`;

async function takeScreenshot(page, name) {
  const path = join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 Screenshot saved: ${path}`);
  return path;
}

async function runTest() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();
  
  const agent = new AgentBrowser({ page, baseUrl: BASE_URL });

  try {
    console.log('🚀 Starting acceptance test...');
    console.log(`   Base URL: ${BASE_URL}`);
    console.log(`   Screenshots: ${SCREENSHOT_DIR}`);

    // 1. Login (using demo credentials or create new user)
    console.log('\n📋 Step 1: Login');
    await page.goto(`${ADMIN_URL}/login`);
    
    // Wait for form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Try to login with demo account or create one
    // Note: In real scenario, user should be pre-created
    await page.fill('input[type="email"]', 'admin@hunter.rv.ua');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to sites list
    await page.waitForURL(/.*\/sites/, { timeout: 15000 });
    console.log('   ✅ Logged in');

    // 2. Create site
    console.log('\n📋 Step 2: Create site');
    await page.click('a:has-text("Новий сайт"), button:has-text("Новий сайт")');
    await page.waitForSelector('input[name="name"]', { timeout: 5000 });
    
    const siteName = `Test Site ${Date.now()}`;
    await page.fill('input[name="name"]', siteName);
    await page.fill('input[name="slug"]', `test-site-${Date.now()}`);
    await page.fill('input[name="domain"]', 'test.hunter.rv.ua');
    await page.click('button:has-text("Створити")');
    
    await page.waitForURL(/.*\/sites\/\w+/, { timeout: 10000 });
    const siteUrl = page.url();
    const siteId = siteUrl.split('/').pop();
    console.log(`   ✅ Site created: ${siteId}`);

    // 3. Create FLOATING_MENU widget
    console.log('\n📋 Step 3: Create FLOATING_MENU widget');
    await page.goto(`${ADMIN_URL}/sites/${siteId}/widgets`);
    await page.click('a:has-text("Новий віджет"), button:has-text("Новий віджет")');
    await page.waitForSelector('select[name="type"]', { timeout: 5000 });
    
    await page.selectOption('select[name="type"]', 'FLOATING_MENU');
    await page.fill('input[name="name"]', 'Test Floating Menu');
    await page.click('button:has-text("Створити")');
    
    await page.waitForURL(/.*\/widgets\/\w+/, { timeout: 10000 });
    console.log('   ✅ Widget created');

    // 4. Configure widget
    console.log('\n📋 Step 4: Configure widget (horizontal, 2 buttons)');
    
    // Wait for editor to load
    await page.waitForSelector('[data-widget-editor]', { timeout: 10000 });
    
    // Select layout horizontal
    await page.selectOption('select[name="layout"]', 'horizontal');
    console.log('   ✅ Layout: horizontal');

    // 5. Add buttons via UI
    console.log('\n📋 Step 5: Add buttons');
    
    // Click "Add button"
    await page.click('button:has-text("Додати кнопку")');
    
    // Configure first button (direct phone)
    await page.selectOption('select[name="buttons[0].mode"]', 'direct');
    await page.fill('input[name="buttons[0].channels[0].value"]', '+380501234567');
    await page.fill('input[name="buttons[0].channels[0].label"]', 'Дзвінок');
    
    // Add second button (menu with 3 channels)
    await page.click('button:has-text("Додати кнопку")');
    await page.selectOption('select[name="buttons[1].mode"]', 'menu');
    
    // Add 3 channels to second button
    for (let i = 0; i < 3; i++) {
      await page.click('button:has-text("Додати канал")');
    }
    
    // Configure channels
    const channels = [
      { type: 'telegram', value: '@test', label: 'Telegram' },
      { type: 'viber', value: '380501234567', label: 'Viber' },
      { type: 'email', value: 'test@example.com', label: 'Email' },
    ];
    
    for (let i = 0; i < channels.length; i++) {
      await page.selectOption(`select[name="buttons[1].channels[${i}].type"]`, channels[i].type);
      await page.fill(`input[name="buttons[1].channels[${i}].value"]`, channels[i].value);
      await page.fill(`input[name="buttons[1].channels[${i}].label"]`, channels[i].label);
    }
    
    console.log('   ✅ Buttons configured');

    // 6. Screenshot live preview
    console.log('\n📋 Step 6: Screenshot live preview');
    
    // Wait for preview iframe
    await page.waitForSelector('iframe[title="Widget Preview"]', { timeout: 5000 });
    await page.waitForTimeout(1000); // Let preview render
    
    const previewScreenshot = await takeScreenshot(page, '01-preview-before-save');
    console.log(`   ✅ Preview screenshot: ${previewScreenshot}`);

    // 7. Save widget
    console.log('\n📋 Step 7: Save widget');
    await page.click('button:has-text("Зберегти")');
    await page.waitForSelector('.toast:has-text("Збережено")', { timeout: 10000 });
    console.log('   ✅ Widget saved');

    // 8. Open test page with embed
    console.log('\n📋 Step 8: Open test page');
    
    const testPageContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Page</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: sans-serif; padding: 40px; }
  </style>
</head>
<body>
  <h1>Widget Test Page</h1>
  <p>This page has the widget embedded.</p>
  <script src="${BASE_URL}/w.js?site=${siteId}"><\/script>
</body>
</html>
    `;
    
    // Create temp file or serve via data URL
    await page.goto(`${BASE_URL}/test-page.html?site=${siteId}`);
    await page.waitForTimeout(2000); // Let widget load
    
    const liveScreenshot = await takeScreenshot(page, '02-live-embed');
    console.log(`   ✅ Live screenshot: ${liveScreenshot}`);

    // 9. Compare (visual check - agent will review screenshots)
    console.log('\n📋 Step 9: Visual comparison ready');
    console.log(`   Preview: ${previewScreenshot}`);
    console.log(`   Live: ${liveScreenshot}`);

    // 10. Check analytics
    console.log('\n📋 Step 10: Check analytics');
    await page.goto(`${ADMIN_URL}/analytics`);
    await page.waitForTimeout(2000);
    
    const analyticsScreenshot = await takeScreenshot(page, '03-analytics');
    console.log(`   ✅ Analytics screenshot: ${analyticsScreenshot}`);
    console.log('   ⚠️ Manual review needed: verify no widget impressions from preview');

    console.log('\n✅ Acceptance test completed!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOT_DIR}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await takeScreenshot(page, 'error-state');
    throw error;
  } finally {
    await browser.close();
  }
}

runTest().catch(console.error);
