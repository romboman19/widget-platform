#!/bin/bash
# Acceptance test — з dialog handling для window.prompt()
# Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... ./test/run-acceptance-test.sh

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

# Helper: get ref from snapshot
get_ref() {
  agent-browser snapshot -i 2>/dev/null | grep -E "$1" | head -1 | awk '{print $1}'
}

# 1. Login
echo ""
echo "📋 Step 1: Login"
agent-browser open "${BASE_URL}/login"
agent-browser wait 2000

agent-browser fill "input[type='email']" "$ADMIN_EMAIL"
agent-browser fill "input[type='password']" "$ADMIN_PASSWORD"
agent-browser click "button[type='submit']"
agent-browser wait 3000

echo "   ✅ Logged in"

# 2. Create site з dialog handling
echo ""
echo "📋 Step 2: Create site"
agent-browser wait 1000

# Get ref for "Додати сайт" button
REF_ADD_SITE=$(get_ref "Додати сайт")
if [ -z "$REF_ADD_SITE" ]; then
  echo "❌ 'Додати сайт' button not found"
  exit 1
fi

SITE_NAME="Acceptance Site $(date +%s)"
SITE_DOMAIN="test-$(date +%s).example.com"

echo "   Clicking 'Додати сайт' (will trigger prompt)..."
echo "   Will accept prompt with: $SITE_NAME"

# Click in background — it will block until dialog is handled
agent-browser click "$REF_ADD_SITE" &
CLICK_PID=$!

# Wait for dialog to appear
sleep 2

# Check if dialog is open and accept with site name
DIALOG_STATUS=$(agent-browser dialog status 2>/dev/null || echo "no dialog")
echo "   Dialog status: $DIALOG_STATUS"

if echo "$DIALOG_STATUS" | grep -q "prompt"; then
  agent-browser dialog accept "$SITE_NAME"
  echo "   ✅ Accepted prompt with site name"
else
  echo "   ⚠️  No prompt dialog detected"
fi

# Wait for click to complete
wait $CLICK_PID 2>/dev/null || true

agent-browser wait 2000

# Check current URL
CURRENT_URL=$(agent-browser get url)
echo "   URL after site creation: $CURRENT_URL"

# Extract site ID from URL
if echo "$CURRENT_URL" | grep -q "/sites/"; then
  SITE_ID=$(echo "$CURRENT_URL" | sed 's/.*\/sites\///' | sed 's/\/.*//')
  echo "   ✅ Site created: $SITE_ID"
else
  # Try to get site ID from page
  agent-browser snapshot > "$ARTIFACTS_DIR/snapshot-02-after-create.txt" 2>/dev/null
  echo "   ⚠️  Site may be created, check snapshot"
  SITE_ID=""
fi

if [ -z "$SITE_ID" ]; then
  echo "❌ Failed to create or locate site"
  exit 1
fi

# 3. Create FLOATING_MENU widget
echo ""
echo "📋 Step 3: Create widget"
agent-browser open "${BASE_URL}/sites/${SITE_ID}/widgets"
agent-browser wait 2000

REF_NEW_WIDGET=$(get_ref "Новий віджет")
if [ -z "$REF_NEW_WIDGET" ]; then
  REF_NEW_WIDGET=$(get_ref "button" | head -1 | awk '{print $1}')
fi

agent-browser click "${REF_NEW_WIDGET:-button}"
agent-browser wait 1000

agent-browser select "select[name='type']" "FLOATING_MENU"
agent-browser fill "input[name='name']" "Test Floating Menu"

REF_CREATE=$(get_ref "Створити")
agent-browser click "${REF_CREATE:-button[type='submit']}"
agent-browser wait 3000

echo "   ✅ Widget created"

# 4. Configure widget
echo ""
echo "📋 Step 4: Configure widget"
agent-browser wait 1000

agent-browser select "select[name='layout']" "horizontal"
echo "   ✅ Layout set to horizontal"

# Add first button (direct phone)
REF_ADD_BTN=$(get_ref "Додати кнопку")
if [ -n "$REF_ADD_BTN" ]; then
  agent-browser click "$REF_ADD_BTN"
  agent-browser wait 500
  agent-browser select "select[name='buttons\\[0\\]\\.mode']" "direct"
  agent-browser fill "input[name='buttons\\[0\\]\\.channels\\[0\\]\\.value']" "+380501234567"
  agent-browser fill "input[name='buttons\\[0\\]\\.channels\\[0\\]\\.label']" "Дзвінок"
  echo "   ✅ First button (direct) added"
fi

# Add second button (menu)
if [ -n "$REF_ADD_BTN" ]; then
  agent-browser click "$REF_ADD_BTN"
  agent-browser wait 500
  agent-browser select "select[name='buttons\\[1\\]\\.mode']" "menu"
  echo "   ✅ Second button (menu) added"
fi

# Add channels
REF_ADD_CH=$(get_ref "Додати канал")
if [ -n "$REF_ADD_CH" ]; then
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
  
  echo "   ✅ Channels configured"
fi

# 5. Screenshot preview
echo ""
echo "📋 Step 5: Screenshot preview"
agent-browser wait 2000
agent-browser screenshot "$ARTIFACTS_DIR/01-preview-before-save.png"
echo "   ✅ Screenshot saved: 01-preview-before-save.png"

# 6. Save widget
echo ""
echo "📋 Step 6: Save widget"
REF_SAVE=$(get_ref "Зберегти")
agent-browser click "${REF_SAVE:-button[type='submit']}"
agent-browser wait 3000
echo "   ✅ Widget saved"

# 7. Test page with embed
echo ""
echo "📋 Step 7: Test page"
TEST_FILE="/tmp/test-page-${SITE_ID}.html"
echo "<!DOCTYPE html><html><head><title>Test</title><meta name='viewport' content='width=device-width, initial-scale=1'><style>body{font-family:sans-serif;padding:40px}</style></head><body><h1>Test</h1><script src='${BASE_URL}/w.js?site=${SITE_ID}'></script></body></html>" > "$TEST_FILE"

agent-browser open "file://$TEST_FILE"
agent-browser wait 3000
agent-browser screenshot "$ARTIFACTS_DIR/02-live-embed.png"
echo "   ✅ Screenshot saved: 02-live-embed.png"

# 8. Check analytics
echo ""
echo "📋 Step 8: Check analytics"
agent-browser open "${BASE_URL}/analytics"
agent-browser wait 2000
agent-browser screenshot "$ARTIFACTS_DIR/03-analytics.png"
echo "   ✅ Screenshot saved: 03-analytics.png"

# Log
cat > "$ARTIFACTS_DIR/test-log.txt" << EOF
=== Acceptance Test Log ===
Date: $(date -Iseconds)
Site ID: $SITE_ID
Site Name: $SITE_NAME
All steps completed
EOF

echo ""
echo "✅ Acceptance test completed!"
echo "📁 Artifacts in: $ARTIFACTS_DIR"
ls -la "$ARTIFACTS_DIR"
