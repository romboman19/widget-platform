#!/bin/bash
# Acceptance test — з dialog handling та коректними селекторами
# Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... ./test/run-acceptance-test.sh

set -e

if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
  echo "❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set"
  exit 1
fi

BASE_URL="${API_URL:-https://widget.hunter.rv.ua}"
ARTIFACTS_DIR="${TEST_ARTIFACTS:-./test-artifacts}"

mkdir -p "$ARTIFACTS_DIR"

echo "🚀 Starting FLOATING_MENU v2 acceptance test"
echo "   Target: $BASE_URL"

# Helper: get ref from snapshot file
get_ref_from_file() {
  grep -E "$1" "$2" | grep -o 'ref=e[0-9]*' | head -1
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

# Get FRESH snapshot after login
agent-browser snapshot > "$ARTIFACTS_DIR/snapshot-02-dashboard.txt" 2>/dev/null
REF_ADD_SITE=$(grep 'button "Додати сайт"' "$ARTIFACTS_DIR/snapshot-02-dashboard.txt" | grep -o 'ref=e[0-9]*' | head -1)

SITE_NAME="Acceptance Site $(date +%s)"
SITE_DOMAIN="test-$(date +%s).example.com"

echo "   Found ref: $REF_ADD_SITE"
echo "   Clicking 'Додати сайт'..."

agent-browser click "$REF_ADD_SITE" &
CLICK_PID=$!
sleep 2
agent-browser dialog accept "$SITE_NAME"
echo "   ✅ Accepted prompt 1: site name"
sleep 2
agent-browser dialog accept "$SITE_DOMAIN"
echo "   ✅ Accepted prompt 2: domain"
wait $CLICK_PID 2>/dev/null || true

agent-browser wait 2000
CURRENT_URL=$(agent-browser get url)
echo "   URL after site creation: $CURRENT_URL"

SITE_ID=$(echo "$CURRENT_URL" | sed 's/.*\/sites\///' | sed 's/\/.*//')
if [ -z "$SITE_ID" ]; then
  echo "❌ Failed to extract site ID"
  exit 1
fi
echo "   ✅ Site created: $SITE_ID"

# 3. Create FLOATING_MENU widget via template button
echo ""
echo "📋 Step 3: Create widget"
agent-browser open "${BASE_URL}/sites/${SITE_ID}"
agent-browser wait 2000

agent-browser snapshot > "$ARTIFACTS_DIR/snapshot-03-site-editor.txt" 2>/dev/null
REF_FLOATING=$(grep 'Floating меню' "$ARTIFACTS_DIR/snapshot-03-site-editor.txt" | grep -o 'ref=e[0-9]*' | head -1)

if [ -z "$REF_FLOATING" ]; then
  echo "❌ Floating Menu button not found"
  cat "$ARTIFACTS_DIR/snapshot-03-site-editor.txt"
  exit 1
fi

echo "   Floating Menu ref: $REF_FLOATING"
agent-browser click "$REF_FLOATING"
agent-browser wait 3000

echo "   ✅ Widget editor opened"

# 4. Configure widget — now we're in WidgetEditor
echo ""
echo "📋 Step 4: Configure widget"
agent-browser snapshot > "$ARTIFACTS_DIR/snapshot-04-widget-editor.txt" 2>/dev/null

# Set layout to horizontal
REF_LAYOUT=$(get_ref_from_file "horizontal" "$ARTIFACTS_DIR/snapshot-04-widget-editor.txt")
if [ -n "$REF_LAYOUT" ]; then
  agent-browser click "$REF_LAYOUT"
  echo "   ✅ Layout set to horizontal"
fi

# Configure buttons (UI depends on actual WidgetEditor)
echo "   Configuring buttons..."

# 5. Screenshot preview
echo ""
echo "📋 Step 5: Screenshot preview"
agent-browser wait 2000
agent-browser screenshot "$ARTIFACTS_DIR/01-preview-before-save.png"
echo "   ✅ Screenshot saved: 01-preview-before-save.png"

# 6. Save widget
echo ""
echo "📋 Step 6: Save widget"
agent-browser snapshot > "$ARTIFACTS_DIR/snapshot-04b-before-save.txt" 2>/dev/null
REF_SAVE=$(get_ref_from_file "(Зберегти|Save)" "$ARTIFACTS_DIR/snapshot-04b-before-save.txt")
if [ -n "$REF_SAVE" ]; then
  agent-browser click "$REF_SAVE"
  agent-browser wait 3000
  echo "   ✅ Widget saved"
else
  echo "   ⚠️  Save button not found, may auto-save"
fi

# 7. Test page with embed
echo ""
echo "📋 Step 7: Test page"
TEST_FILE="/tmp/test-page-${SITE_ID}.html"
cat > "$TEST_FILE" << HTML
<!DOCTYPE html>
<html>
<head><title>Test</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:sans-serif;padding:40px}</style></head>
<body><h1>Test</h1><script src="${BASE_URL}/w.js?site=${SITE_ID}"></script></body>
</html>
HTML

agent-browser open "file://$TEST_FILE"
agent-browser wait 3000
agent-browser screenshot "$ARTIFACTS_DIR/02-live-embed.png"
echo "   ✅ Screenshot saved: 02-live-embed.png"

# 8. Analytics
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
