#!/bin/bash
# Simple manual test steps

echo "Test Steps:"
echo "1. Open https://widget.hunter.rv.ua/login"
echo "2. Log in with the owner account (credentials are not stored in the repository)"
echo "3. Click 'Додати сайт'"
echo "4. Fill: Name='Test Site', Slug='test-$(date +%s)', Domain='test.com'"
echo "5. Click 'Створити'"
echo "6. Go to Widgets, create FLOATING_MENU"
echo "7. Configure: horizontal layout, 2 buttons"
echo "8. Screenshot preview, save"
echo "9. Open test page with embed, compare"
