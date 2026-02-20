#!/bin/bash
# 🚀 Firebase Emulators Test Script for GitHub Codespaces
# This script helps quickly test Firebase emulator configuration

echo "🔧 Firebase Codespaces Emulator Test"
echo "===================================="

# 1. Check if we're in Codespaces
if [[ -n "$CODESPACE_NAME" ]]; then
    echo "✅ GitHub Codespaces detected: $CODESPACE_NAME"
    
    # Build expected URLs
    BASE_URL="${CODESPACE_NAME}.app.github.dev"
    FRONTEND_URL="https://${CODESPACE_NAME}-5000.app.github.dev"
    FIRESTORE_URL="https://${CODESPACE_NAME}-8080.app.github.dev"
    AUTH_URL="https://${CODESPACE_NAME}-9099.app.github.dev"
    FUNCTIONS_URL="https://${CODESPACE_NAME}-5001.app.github.dev"
    
    echo "📋 Expected URLs:"
    echo "   Frontend:  $FRONTEND_URL"
    echo "   Firestore: $FIRESTORE_URL"  
    echo "   Auth:      $AUTH_URL"
    echo "   Functions: $FUNCTIONS_URL"
    echo ""
else
    echo "❌ Not in GitHub Codespaces environment"
    echo "💡 This script is designed for Codespaces only"
    exit 1
fi

# 2. Check Firebase CLI
echo "🔍 Checking Firebase CLI..."
if command -v firebase &> /dev/null; then
    FIREBASE_VERSION=$(firebase --version)
    echo "✅ Firebase CLI found: $FIREBASE_VERSION"
else
    echo "❌ Firebase CLI not found"
    echo "💡 Install with: npm install -g firebase-tools"
    exit 1
fi

# 3. Check if firebase.json exists
if [[ -f "firebase.json" ]]; then
    echo "✅ firebase.json found"
else
    echo "❌ firebase.json not found"
    echo "💡 Run: firebase init"
    exit 1
fi

# 4. Check if emulators are running
echo ""
echo "🔍 Checking if emulators are running..."

# Check Firestore emulator (port 8080)
if curl -s --max-time 5 "http://localhost:8080" > /dev/null 2>&1; then
    echo "✅ Firestore emulator is running on port 8080"
else
    echo "❌ Firestore emulator not running on port 8080"
    NEED_START=true
fi

# Check Auth emulator (port 9099)
if curl -s --max-time 5 "http://localhost:9099" > /dev/null 2>&1; then
    echo "✅ Auth emulator is running on port 9099"
else
    echo "❌ Auth emulator not running on port 9099"
    NEED_START=true
fi

# Check Functions emulator (port 5001)  
if curl -s --max-time 5 "http://localhost:5001" > /dev/null 2>&1; then
    echo "✅ Functions emulator is running on port 5001"
else
    echo "❌ Functions emulator not running on port 5001"
    NEED_START=true
fi

# 5. Start emulators if needed
if [[ "$NEED_START" == true ]]; then
    echo ""
    echo "🚀 Starting Firebase emulators..."
    echo "💡 Run this command in a separate terminal:"
    echo "   firebase emulators:start --host 0.0.0.0"
    echo ""
    echo "⏰ Waiting 10 seconds for you to start emulators..."
    echo "   (Press Ctrl+C to cancel)"
    
    for i in {10..1}; do
        echo -ne "\r⏳ ${i}s remaining..."
        sleep 1
    done
    echo ""
fi

# 6. Check frontend server
echo ""
echo "🔍 Checking frontend server..."
if curl -s --max-time 5 "http://localhost:5000" > /dev/null 2>&1; then
    echo "✅ Frontend server is running on port 5000"
else
    echo "❌ Frontend server not running on port 5000"
    echo "💡 Start with: cd public-site && python3 -m http.server 5000"
    NEED_FRONTEND=true
fi

# 7. Test external URLs (Codespaces proxy)
echo ""
echo "🌐 Testing Codespaces proxy URLs..."

# Test frontend URL
if curl -s --max-time 10 --head "$FRONTEND_URL" > /dev/null 2>&1; then
    echo "✅ Frontend accessible: $FRONTEND_URL"
else
    echo "⚠️  Frontend not accessible externally (may need port forwarding)"
fi

# Test Firestore emulator via proxy
if curl -s --max-time 10 --head "$FIRESTORE_URL" > /dev/null 2>&1; then
    echo "✅ Firestore emulator accessible: $FIRESTORE_URL"
else
    echo "⚠️  Firestore emulator not accessible externally (may need port forwarding)"
fi

# 8. Final status and recommendations
echo ""
echo "📊 Test Summary"
echo "==============="

if [[ -z "$NEED_START" ]] && [[ -z "$NEED_FRONTEND" ]]; then
    echo "🎉 All systems ready! Your Firebase emulators are properly configured for Codespaces."
    echo ""
    echo "🌟 Next steps:"
    echo "   1. Open: $FRONTEND_URL"
    echo "   2. Check browser console for emulator connection logs"
    echo "   3. Test your Firebase features"
else
    echo "⚠️  Setup incomplete. Please follow the recommendations above."
    echo ""
    echo "🔧 Quick setup commands:"
    if [[ "$NEED_START" == true ]]; then
        echo "   firebase emulators:start --host 0.0.0.0"
    fi
    if [[ "$NEED_FRONTEND" == true ]]; then
        echo "   cd public-site && python3 -m http.server 5000"
    fi
fi

echo ""
echo "📚 For detailed instructions, see: GITHUB_CODESPACES_EMULATOR_SETUP.md"