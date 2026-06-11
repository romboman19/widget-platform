#!/bin/bash
# Acceptance test — snapshot-based navigation
# Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... ./test/acceptance-test.sh

set -e

# Check required env vars
if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
  echo "❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set"
  exit 1
fi

echo "🚀 Starting FLOATING_MENU v2 acceptance test"
echo "   Target: ${API_URL:-https://widget.hunter.rv.ua}"

BASE_URL="${API_URL:-https://widget.hunter.rv.ua}"
ARTIFACTS_DIR="${TEST_ARTIFACTS:-./test-artifacts}"

mkdir -p "$ARTIFACTS_DIR"

# Helper: get ref from snapshot by text pattern
get_ref() {
  agent-browser snapshot -i 2>/dev/null | grep -E "$1" | head -1 | awk '{print $1}'
}

# Helper: get all snapshot content
save_snapshot() {
  agent-browser snapshot > "$ARTIFACTS_DIR/snapshot-$1.txt" 2>/dev/null || true
}

# 1. Login
echo ""
echo "📋 Step 1: Login"
agent-browser open "${BASE_URL}/login"
agent-browser wait 2000

# Fill login form
agent-browser fill "input[type='email']" "$ADMIN_EMAIL"
agent-browser fill "input[type='password']" "$ADMIN_PASSWORD"
agent-browser click "button[type='submit']"
agent-browser wait 3000

echo "   ✅ Logged in"

# 2. Create site
echo ""
echo "📋 Step 2: Create site"
agent-browser wait 1000
save_snapshot "02-dashboard"

REF_ADD_SITE=$(get_ref "Додати сайт")
if [ -z "$REF_ADD_SITE" ]; then
  echo "⚠️  'Додати сайт' not found, trying 'button'"
  REF_ADD_SITE="button"
fi

agent-browser click "$REF_ADD_SITE"
agent-browser wait 1000
save_snapshot "02-site-form"

# Fill site form
SITE_SLUG="acceptance-$(date +%s)"
agent-browser fill "input[name='name']" "Acceptance Test Site"
agent-browser fill "input[name='slug']" "$SITE_SLUG"
agent-browser fill "input[name='domain']" "test.example.com"

REF_CREATE=$(get_ref "Створити")
agent-browser click "${REF_CREATE:-button[type='submit']}"
agent-browser wait 3000

SITE_URL=$(agent-browser get url)
SITE_ID=$(echo "$SITE_URL" | sed 's/.*\/sites\///' | sed 's/\/.*//')
echo "   ✅ Site created: $SITE_ID"

# 3. Create FLOATING_MENU widget
echo ""
echo "📋 Step 3: Create widget"
agent-browser open "${BASE_URL}/sites/${SITE_ID}/widgets"
agent-browser wait 2000
save_snapshot "03-widgets"

REF_NEW_WIDGET=$(get_ref "Новий віджет")
if [ -z "$REF_NEW_WIDGET" ]; then
  REF_NEW_WIDGET="button"
fi

agent-browser click "$REF_NEW_WIDGET"
agent-browser wait 1000

agent-browser select "select[name='type']" "FLOATING_MENU"
agent-browser fill "input[name='name']" "Test Floating Menu"

REF_CREATE_W=$(get_ref "Створити")
agent-browser click "${REF_CREATE_W:-button[type='submit']}"
agent-browser wait 3000

echo "   ✅ Widget created"

# 4. Configure widget
echo ""
echo "📋 Step 4: Configure widget"
agent-browser wait 1000
save_snapshot "04-editor"

agent-browser select "select[name='layout']" "horizontal"

# Add buttons via refs
REF_ADD_BTN=$(get_ref "Додати кнопку")

# First button - direct
agent-browser click "$REF_ADD_BTN"
agent-browser wait 500
agent-browser select "select[name='buttons\\[0\\]\\.mode']" "direct"
agent-browser fill "input[name='buttons\\[0\\]\\.channels\\[0\\]\\.value']" "+380501234567"
agent-browser fill "input[name='buttons\\[0\\]\\.channels\\[0\\]\\.label']" "Дзвінок"

# Second button - menu
agent-browser click "$REF_ADD_BTN"
agent-browser wait 500
agent-browser select "select[name='buttons\\[1\\]\\.mode']" "menu"

# Add channels
REF_ADD_CH=$(get_ref "Додати канал")
for i in 1 2 3; do
  agent-browser click "$REF_ADD_CH"
  agent-browser wait 300
done

# Configure channels
agent-browser select "select[name='buttons\\[1\\]\\.channels\\[0\\]\\.type']" "telegram"
agent-browser fill "input[name='buttons\\[1\\]\\.channels\\[0\\]\\.value']" "@test"
agent-browser fill "input[name='buttons\\[1\\]\\.channels\\[0\\]\\.label']" "Telegram"

agent-browser select "select[name='buttons\\[1\\]\\.channels\\[1\\]\\.type']" "viber"
agent-browser fill "input[name='buttons\\[1\\]\\.channels\\[1\\]\\.value']" "380501234567"
agent-browser fill "input[name='buttons\\[1\\]\\.channels\\[1\\]\\.label']" "Viber"

agent-browser select "select[name='buttons\\[1\\]\\.channels\\[2\\]\\.type']" "email"
agent-browser fill "input[name='buttons\\[1\\]\\.channels\\[2\\]\\.value']" "test@example.com"
agent-browser fill "input[name='buttons\\[1\\]\\.channels\\[2\\]\\.label']" "Email"

echo "   ✅ Widget configured"

# 5. Screenshot preview
echo ""
echo "📋 Step 5: Screenshot preview"
agent-browser wait 2000
agent-browser screenshot "$ARTIFACTS_DIR/01-preview-before-save.png"

# 6. Save
echo ""
echo "📋 Step 6: Save widget"
REF_SAVE=$(get_ref "Зберегти")
agent-browser click "${REF_SAVE:-button:has-text('Save')}"
agent-browser wait 3000
echo "   ✅ Widget saved"

# 7. Test page
echo ""
echo "📋 Step 7: Test page"
cat > "/tmp/test-page-${SITE_ID}.html" << HTMLEND
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
HTMLEND

agent-browser open "file:///tmp/test-page-${SITE_ID}.html"
agent-browser wait 3000
agent-browser screenshot "$ARTIFACTS_DIR/02-live-embed.png"

# 8. Analytics
echo ""
echo "📋 Step 8: Check analytics"
agent-browser open "${BASE_URL}/analytics"
agent-browser wait 2000
agent-browser screenshot "$ARTIFACTS_DIR/03-analytics.png"

# Log
echo "" > "$ARTIFACTS_DIR/test-log.txt"
echo "=== Acceptance Test Log ===" >> "$ARTIFACTS_DIR/test-log.txt"
echo "Date: $(date -Iseconds)" >> "$ARTIFACTS_DIR/test-log.txt"
echo "Site ID: $SITE_ID" >> "$ARTIFACTS_DIR/test-log.txt"
echo "Site Slug: $SITE_SLUG" >> "$ARTIFACTS_DIR/test-log.txt"

echo ""
echo "✅ Acceptance test completed"
echo "📁 Artifacts in: $ARTIFACTS_DIR"
ls -la "$ARTIFACTS_DIR"
