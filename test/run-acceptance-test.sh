#!/bin/bash
# Acceptance test script for agent-browser
# Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... ./test/run-acceptance-test.sh

set -e

# Check required env vars
if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
  echo "❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set"
  echo "   Usage: ADMIN_EMAIL=user@example.com ADMIN_PASSWORD=secret ./test/run-acceptance-test.sh"
  exit 1
fi

echo "🚀 Starting FLOATING_MENU v2 acceptance test"
echo "   Admin: $ADMIN_EMAIL"
echo "   Target: ${API_URL:-http://localhost:8090}"

BASE_URL="${API_URL:-http://localhost:8090}"
ADMIN_URL="${BASE_URL}"
ARTIFACTS_DIR="${TEST_ARTIFACTS:-./test-artifacts}"

mkdir -p "$ARTIFACTS_DIR"

# Helper: get snapshot and find ref
get_ref() {
  agent-browser snapshot -i 2>/dev/null | grep -E "$1" | head -1 | awk '{print $1}'
}

# 1. Open admin and login
echo ""
echo "📋 Step 1: Login to admin"
echo "   Opening: ${ADMIN_URL}/login"
agent-browser open "${ADMIN_URL}/login" --screenshot-dir "$ARTIFACTS_DIR" || true

# Get snapshot to find actual selectors
echo "   Getting page snapshot..."
agent-browser snapshot > "$ARTIFACTS_DIR/snapshot-01-login.txt" 2>/dev/null || true

# Fill login
agent-browser fill "input[type='email']" "$ADMIN_EMAIL"
agent-browser fill "input[type='password']" "$ADMIN_PASSWORD"
agent-browser click "button[type='submit']"
agent-browser wait 3000

CURRENT_URL=$(agent-browser get url)
echo "   URL after login: $CURRENT_URL"

# Check if redirected to sites (success) or still on login (failure)
if echo "$CURRENT_URL" | grep -q "/login"; then
  echo "⚠️  Still on login page — possible auth failure"
  agent-browser screenshot "$ARTIFACTS_DIR/error-login-failed.png"
  exit 1
fi

echo "   ✅ Logged in"

# 2. Create site
echo ""
echo "📋 Step 2: Create site"

# Find "Новий сайт" button
REF_NEW_SITE=$(get_ref "Новий сайт")
if [ -z "$REF_NEW_SITE" ]; then
  # Try generic selectors
  REF_NEW_SITE=$(get_ref "button" | head -1)
fi

if [ -n "$REF_NEW_SITE" ]; then
  agent-browser click "$REF_NEW_SITE"
else
  # Fallback
  agent-browser click "button"
fi

agent-browser wait 1000

# Get snapshot of site form
agent-browser snapshot > "$ARTIFACTS_DIR/snapshot-02-site-form.txt" 2>/dev/null || true

SITE_SLUG="acceptance-test-$(date +%s)"
agent-browser fill "input[name='name']" "Acceptance Test Site"
agent-browser fill "input[name='slug']" "$SITE_SLUG"
agent-browser fill "input[name='domain']" "test.example.com"
agent-browser click "button:has-text('Створити')"
agent-browser wait 3000

SITE_URL=$(agent-browser get url)
SITE_ID=$(echo "$SITE_URL" | sed 's/.*\///')
echo "   ✅ Site ID: $SITE_ID"

if [ -z "$SITE_ID" ]; then
  echo "❌ Failed to extract site ID from URL: $SITE_URL"
  agent-browser screenshot "$ARTIFACTS_DIR/error-site-creation.png"
  exit 1
fi

# 3. Create FLOATING_MENU widget
echo ""
echo "📋 Step 3: Create FLOATING_MENU widget"
agent-browser open "${ADMIN_URL}/sites/${SITE_ID}/widgets"
agent-browser wait 2000

agent-browser snapshot > "$ARTIFACTS_DIR/snapshot-03-widgets.txt" 2>/dev/null || true

REF_NEW_WIDGET=$(get_ref "Новий віджет")
if [ -n "$REF_NEW_WIDGET" ]; then
  agent-browser click "$REF_NEW_WIDGET"
else
  agent-browser click "button"
fi

agent-browser wait 1000
agent-browser select "select[name='type']" "FLOATING_MENU"
agent-browser fill "input[name='name']" "Test Floating Menu"
agent-browser click "button:has-text('Створити')"
agent-browser wait 3000

echo "   ✅ Widget created"

# 4-5. Configure: horizontal layout, 2 buttons
echo ""
echo "📋 Step 4-5: Configure widget"

agent-browser snapshot > "$ARTIFACTS_DIR/snapshot-04-editor.txt" 2>/dev/null || true

# Select layout horizontal
agent-browser select "select[name='layout']" "horizontal"

# Find Add button
REF_ADD_BTN=$(get_ref "Додати кнопку")
if [ -z "$REF_ADD_BTN" ]; then
  REF_ADD_BTN=$(get_ref "button" | tail -1)
fi

# Add first button (direct phone)
agent-browser click "$REF_ADD_BTN"
agent-browser wait 500
agent-browser select "select[name='buttons[0].mode']" "direct"
agent-browser fill "input[name='buttons[0].channels[0].value']" "+380501234567"
agent-browser fill "input[name='buttons[0].channels[0].label']" "Дзвінок"

# Add second button (menu)
agent-browser click "$REF_ADD_BTN"
agent-browser wait 500
agent-browser select "select[name='buttons[1].mode']" "menu"

# Add 3 channels to second button
REF_ADD_CH=$(get_ref "Додати канал")
if [ -z "$REF_ADD_CH" ]; then
  REF_ADD_CH="button:has-text('Додати')"
fi

for i in 1 2 3; do
  agent-browser click "$REF_ADD_CH"
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
echo ""
echo "📋 Step 6: Screenshot live preview"
agent-browser wait 2000
agent-browser snapshot > "$ARTIFACTS_DIR/snapshot-05-preview.txt" 2>/dev/null || true
agent-browser screenshot "$ARTIFACTS_DIR/01-preview-before-save.png"

# 7. Save widget
echo ""
echo "📋 Step 7: Save widget"
REF_SAVE=$(get_ref "Зберегти")
if [ -n "$REF_SAVE" ]; then
  agent-browser click "$REF_SAVE"
else
  agent-browser click "button:has-text('Save')"
fi

agent-browser wait 3000
echo "   ✅ Widget saved"

# 8. Open test page with embed
echo ""
echo "📋 Step 8: Open test page"
cat > "/tmp/test-page-${SITE_ID}.html" << EOF
<!DOCTYPE html>
<html>
<head>
  <title>Acceptance Test</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>body{font-family:sans-serif;padding:40px}</style>
</head>
<body>
  <h1>Widget Acceptance Test</h1>
  <script src="${BASE_URL}/w.js?site=${SITE_ID}"><\/script>
</body>
</html>
EOF

agent-browser open "file:///tmp/test-page-${SITE_ID}.html"
agent-browser wait 3000

# 9. Screenshot live
echo ""
echo "📋 Step 9: Screenshot live embed"
agent-browser screenshot "$ARTIFACTS_DIR/02-live-embed.png"

# 10. Check analytics
echo ""
echo "📋 Step 10: Check analytics"
agent-browser open "${ADMIN_URL}/analytics"
agent-browser wait 2000
agent-browser snapshot > "$ARTIFACTS_DIR/snapshot-06-analytics.txt" 2>/dev/null || true
agent-browser screenshot "$ARTIFACTS_DIR/03-analytics.png"

# Save log
echo "" > "$ARTIFACTS_DIR/test-log.txt"
echo "=== Acceptance Test Log ===" >> "$ARTIFACTS_DIR/test-log.txt"
echo "Date: $(date -Iseconds)" >> "$ARTIFACTS_DIR/test-log.txt"
echo "Site ID: $SITE_ID" >> "$ARTIFACTS_DIR/test-log.txt"
echo "Site Slug: $SITE_SLUG" >> "$ARTIFACTS_DIR/test-log.txt"
echo "All steps completed" >> "$ARTIFACTS_DIR/test-log.txt"

echo ""
echo "✅ Acceptance test completed"
echo "📁 Artifacts in: $ARTIFACTS_DIR"
echo ""
echo "Files:"
ls -la "$ARTIFACTS_DIR"
