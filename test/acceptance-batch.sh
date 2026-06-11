#!/bin/bash
# Acceptance test — all in one agent-browser session via batch
# Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... ./test/acceptance-batch.sh

set -e

if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
  echo "❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set"
  exit 1
fi

BASE_URL="${API_URL:-https://widget.hunter.rv.ua}"
ARTIFACTS_DIR="${TEST_ARTIFACTS:-./test-artifacts}"

mkdir -p "$ARTIFACTS_DIR"

echo "🚀 Starting acceptance test via batch"
echo "   Target: $BASE_URL"

# Use session to preserve auth
export AGENT_BROWSER_SESSION_NAME="acceptance-test-$(date +%s)"

# Step 1: Login and get to dashboard
echo "📋 Step 1: Login"
agent-browser open "${BASE_URL}/login"
agent-browser fill "input[type='email']" "$ADMIN_EMAIL"
agent-browser fill "input[type='password']" "$ADMIN_PASSWORD"  
agent-browser click "button[type='submit']"
agent-browser wait 3000

echo "   ✅ Logged in"

# Save state
agent-browser session save

# Step 2: Create site (manual approach needed due to prompts)
echo ""
echo "📋 Step 2: Create site"
echo "   ⚠️  This requires manual interaction due to window.prompt()"
echo "   Please:"
echo "   1. Click 'Додати сайт' in sidebar"
echo "   2. Enter site name: Acceptance Test Site"
echo "   3. Enter domain: test.example.com"
echo ""
echo "   Pausing for manual creation..."
echo "   After creating site, note the SITE_ID from URL and continue"
echo ""

# Take screenshot for manual verification
agent-browser screenshot "$ARTIFACTS_DIR/01-dashboard-for-manual.png"

echo "   Screenshot saved: 01-dashboard-for-manual.png"
echo ""
echo "   Current URL: $(agent-browser get url)"
echo ""
echo "❌ Automated test blocked at site creation due to window.prompt()"
echo ""
echo "Recommendation: Replace window.prompt() with modal form in Layout.jsx"
echo "This would allow full automation and improve UX."

# Cleanup
agent-browser close
