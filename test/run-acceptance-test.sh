#!/bin/bash
# Acceptance test script for agent-browser

set -e

echo "🚀 Starting FLOATING_MENU v2 acceptance test"

BASE_URL="http://localhost:8090"
ADMIN_URL="${BASE_URL}/admin"

# 1. Open admin and login
echo "📋 Step 1: Login to admin"
agent-browser open "${ADMIN_URL}/login" --no-sandbox --screenshot-dir ./test-artifacts

# Check if login form exists
if ! agent-browser find text "Email" --quiet 2>/dev/null; then
  echo "⚠️  Login form not found, checking current URL..."
  agent-browser get url
fi

# Fill login (using demo credentials)
agent-browser fill "input[type='email']" "admin@hunter.rv.ua"
agent-browser fill "input[type='password']" "admin123"
agent-browser click "button[type='submit']"
agent-browser wait 3000

# 2. Create site
echo "📋 Step 2: Create site"
agent-browser click "a:has-text('Новий сайт'), button:has-text('Новий сайт')"
agent-browser wait 1000
agent-browser fill "input[name='name']" "Acceptance Test Site"
agent-browser fill "input[name='slug']" "acceptance-test-$(date +%s)"
agent-browser fill "input[name='domain']" "test.example.com"
agent-browser click "button:has-text('Створити')"
agent-browser wait 3000

SITE_URL=$(agent-browser get url)
SITE_ID=$(echo "$SITE_URL" | sed 's/.*\///')
echo "   ✅ Site ID: $SITE_ID"

# 3. Create FLOATING_MENU widget
echo "📋 Step 3: Create FLOATING_MENU widget"
agent-browser open "${ADMIN_URL}/sites/${SITE_ID}/widgets"
agent-browser wait 2000
agent-browser click "a:has-text('Новий віджет'), button:has-text('Новий віджет')"
agent-browser wait 1000
agent-browser select "select[name='type']" "FLOATING_MENU"
agent-browser fill "input[name='name']" "Test Floating Menu"
agent-browser click "button:has-text('Створити')"
agent-browser wait 3000

# 4-5. Configure: horizontal layout, 2 buttons
echo "📋 Step 4-5: Configure widget"
agent-browser select "select[name='layout']" "horizontal"

# Add first button (direct phone)
agent-browser click "button:has-text('Додати кнопку')"
agent-browser wait 500
agent-browser select "select[name='buttons[0].mode']" "direct"
agent-browser fill "input[name='buttons[0].channels[0].value']" "+380501234567"
agent-browser fill "input[name='buttons[0].channels[0].label']" "Дзвінок"

# Add second button (menu)
agent-browser click "button:has-text('Додати кнопку')"
agent-browser wait 500
agent-browser select "select[name='buttons[1].mode']" "menu"

# Add 3 channels to second button
for i in 1 2 3; do
  agent-browser click "button:has-text('Додати канал')"
  agent-browser wait 300
done

# Configure channels
agent-browser select "select[name='buttons[1].channels[0].type']" "telegram"
agent-browser fill "input[name='buttons[1].channels[0].value']" "@test"
agent-browser fill "input[name='buttons[1].channels[0].label']" "Telegram"

agent-browser select "select[name='buttons[1].channels[1].type']" "viber"
agent-browser fill "input[name='buttons[1].channels[1].value']" "380501234567"
agent-browser fill "input[name='buttons[1].channels[1].label']" "Viber"

agent-browser select "select[name='buttons[1].channels[2].type']" "email"
agent-browser fill "input[name='buttons[1].channels[2].value']" "test@example.com"
agent-browser fill "input[name='buttons[1].channels[2].label']" "Email"

echo "   ✅ Widget configured"

# 6. Screenshot live preview
echo "📋 Step 6: Screenshot live preview"
agent-browser wait 2000
agent-browser screenshot "./test-artifacts/01-preview-before-save.png"

# 7. Save widget
echo "📋 Step 7: Save widget"
agent-browser click "button:has-text('Зберегти')"
agent-browser wait 3000

echo "   ✅ Widget saved"

# 8. Open test page with embed
echo "📋 Step 8: Open test page"
cat > /tmp/test-page.html << EOF
<!DOCTYPE html>
<html>
<head>
  <title>Acceptance Test</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>body{font-family:sans-serif;padding:40px}</style>
</head>
<body>
  <h1>Widget Acceptance Test</h1>
  <script src="${BASE_URL}/w.js?site=${SITE_ID}"></script>
</body>
</html>
EOF

agent-browser open "file:///tmp/test-page.html"
agent-browser wait 3000

# 9. Screenshot live
echo "📋 Step 9: Screenshot live embed"
agent-browser screenshot "./test-artifacts/02-live-embed.png"

# 10. Check analytics
echo "📋 Step 10: Check analytics"
agent-browser open "${ADMIN_URL}/analytics"
agent-browser wait 2000
agent-browser screenshot "./test-artifacts/03-analytics.png"

echo ""
echo "✅ Acceptance test completed!"
echo "📁 Screenshots saved to: ./test-artifacts/"
echo ""
echo "📊 Manual verification needed:"
echo "   1. Compare 01-preview-before-save.png vs 02-live-embed.png"
echo "   2. Check 03-analytics.png for preview pollution"
echo "   3. Verify icons resolved correctly in live render"
