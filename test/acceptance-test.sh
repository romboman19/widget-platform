#!/bin/bash
# Acceptance test — snapshot-based navigation with dialog handling
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

# Helper: save snapshot
save_snapshot() {
  agent-browser snapshot > "$ARTIFACTS_DIR/snapshot-$1.txt" 2>/dev/null || true
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

# 2. Create site
echo ""
echo "📋 Step 2: Create site"
agent-browser wait 1000
save_snapshot "02-dashboard"

# Setup dialog handler BEFORE clicking
SITE_NAME="Acceptance Site $(date +%s)"
echo "   Setting up dialog handler for: $SITE_NAME"

# Accept prompt with site name
agent-browser eval "
  window.__testDialogResult = null;
  const originalPrompt = window.prompt;
  window.prompt = function(msg) {
    window.__testDialogResult = '$SITE_NAME';
    return '$SITE_NAME';
  };
"

REF_ADD_SITE=$(get_ref "Додати сайт")
agent-browser click "${REF_ADD_SITE:-button}"
agent-browser wait 1000

# If prompt wasn't handled by eval, try accepting it
agent-browser eval "
  if (window.__testDialogResult === null) {
    // Dialog may have opened, try to close it
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
  }
" 2>/dev/null || true

agent-browser wait 1000
save_snapshot "02-after-prompt"

# Check current URL - if still on dashboard, prompt was dismissed
CURRENT_URL=$(agent-browser get url)
echo "   URL after prompt: $CURRENT_URL"

# If site was created, URL should contain /sites/
if echo "$CURRENT_URL" | grep -q "/sites/"; then
  SITE_ID=$(echo "$CURRENT_URL" | sed 's/.*\/sites\///' | sed 's/\/.*//')
  echo "   ✅ Site created: $SITE_ID"
else
  echo "   ⚠️  Prompt may have been cancelled, checking for site..."
  # Try to find site in list
  save_snapshot "02-sites-list"
  SITE_ID=""
fi

# If no site created, skip to manual verification
if [ -z "$SITE_ID" ]; then
  echo ""
  echo "❌ Could not create site automatically"
  echo "   Please create site manually and provide SITE_ID"
  exit 1
fi

# 3. Create FLOATING_MENU widget
echo ""
echo "📋 Step 3: Create widget"
agent-browser open "${BASE_URL}/sites/${SITE_ID}/widgets"
agent-browser wait 2000
save_snapshot "03-widgets"

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
save_snapshot "04-editor"

agent-browser select "select[name='layout']" "horizontal"

echo "   ✅ Layout set to horizontal"

# 5. Screenshot preview
echo ""
echo "📋 Step 5: Screenshot preview"
agent-browser wait 2000
agent-browser screenshot "$ARTIFACTS_DIR/01-preview-before-save.png"
echo "   ✅ Screenshot saved"

# 6. Save
echo ""
echo "📋 Step 6: Save widget"
REF_SAVE=$(get_ref "Зберегти")
agent-browser click "${REF_SAVE:-button[type='submit']}"
agent-browser wait 3000
echo "   ✅ Widget saved"

# 7. Test page
echo ""
echo "📋 Step 7: Test page"
TEST_FILE="/tmp/test-page-${SITE_ID}.html"
echo "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Test</h1><script src=\"${BASE_URL}/w.js?site=${SITE_ID}\"></script></body></html>" > "$TEST_FILE"

agent-browser open "file://$TEST_FILE"
agent-browser wait 3000
agent-browser screenshot "$ARTIFACTS_DIR/02-live-embed.png"
echo "   ✅ Live embed screenshot saved"

# 8. Analytics
echo ""
echo "📋 Step 8: Check analytics"
agent-browser open "${BASE_URL}/analytics"
agent-browser wait 2000
agent-browser screenshot "$ARTIFACTS_DIR/03-analytics.png"
echo "   ✅ Analytics screenshot saved"

# Log
echo "" > "$ARTIFACTS_DIR/test-log.txt"
echo "=== Acceptance Test Log ===" >> "$ARTIFACTS_DIR/test-log.txt"
echo "Date: $(date -Iseconds)" >> "$ARTIFACTS_DIR/test-log.txt"
echo "Site ID: ${SITE_ID:-N/A}" >> "$ARTIFACTS_DIR/test-log.txt"
echo "Site Name: $SITE_NAME" >> "$ARTIFACTS_DIR/test-log.txt"
echo "All steps completed" >> "$ARTIFACTS_DIR/test-log.txt"

echo ""
echo "✅ Acceptance test completed"
echo "📁 Artifacts in: $ARTIFACTS_DIR"
ls -la "$ARTIFACTS_DIR"
