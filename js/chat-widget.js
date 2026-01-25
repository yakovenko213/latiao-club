/**
 * ═══════════════════════════════════════════════════════════════════════
 * 💬 BULLETPROOF LIVE CHAT WIDGET
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Robust chat widget with comprehensive logging and error handling
 * 
 * @version 3.0.0 - BULLETPROOF EDITION
 * @created 2026-01-25
 */

import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, doc, getDoc, setDoc, addDoc, onSnapshot, query, orderBy, Timestamp, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ═══════════════════════════════════════════════════════════════════
// 🔧 CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const CONFIG = {
    DEBUG: true,
    STORAGE_KEY: 'latiao_chat_session',
    USER_ID_KEY: 'latiao_user_id',
    CHAT_ICON: './images/chat-icon.png',
    MAX_WAIT_TIME: 10000, // 10 seconds max wait for Firebase
    CHECK_INTERVAL: 100    // Check every 100ms
};

console.log('🚀 Chat Widget Script Loaded');
console.log('⏰ Timestamp:', new Date().toISOString());

// ═══════════════════════════════════════════════════════════════════
// ⏳ WAIT FOR FIREBASE INITIALIZATION
// ═══════════════════════════════════════════════════════════════════

async function waitForFirebaseInit() {
    console.log('⏳ Waiting for Firebase initialization from firebase-init.js...');
    
    let elapsed = 0;
    const maxWait = CONFIG.MAX_WAIT_TIME;
    
    while (elapsed < maxWait) {
        // Check if window.db exists (exported by firebase-init.js)
        if (typeof window !== 'undefined' && window.db !== undefined) {
            console.log('✅ Firebase detected! (waited ' + elapsed + 'ms)');
            console.log('📦 window.db:', typeof window.db);
            return true;
        }
        
        // Wait 100ms before checking again
        await new Promise(resolve => setTimeout(resolve, CONFIG.CHECK_INTERVAL));
        elapsed += CONFIG.CHECK_INTERVAL;
        
        // Log progress every second
        if (elapsed % 1000 === 0) {
            console.log('⏳ Still waiting... ' + elapsed + 'ms');
        }
    }
    
    console.error('❌ Firebase initialization timeout after ' + maxWait + 'ms');
    console.error('💡 Make sure firebase-init.js or firebase-init-sync.js is loaded BEFORE chat-widget.js');
    return false;
}

// ═══════════════════════════════════════════════════════════════════
// 🔥 FIREBASE INITIALIZATION (FALLBACK)
// ═══════════════════════════════════════════════════════════════════

let db;

async function initializeFirebase() {
    console.log('🔥 Initializing Firebase...');
    
    const firebaseConfig = {
        apiKey: "AIzaSyDyQvItRyL4IKl9NmEItswwPOEiKAbWkMw",
        authDomain: "my-magazin-81c96.firebaseapp.com",
        projectId: "my-magazin-81c96",
        storageBucket: "my-magazin-81c96.firebasestorage.app",
        messagingSenderId: "129061757346",
        appId: "1:129061757346:web:3e7bc5838cc5f7bda992fb"
    };

    try {
        // Use existing app if available, otherwise create new
        const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log('✅ Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════
// 🎨 STYLES (INJECTED INTO HEAD)
// ═══════════════════════════════════════════════════════════════════

function injectStyles() {
    const styleId = 'chat-widget-styles';
    
    // Don't inject twice
    if (document.getElementById(styleId)) {
        console.log('📝 Styles already injected');
        return;
    }
    
    console.log('📝 Injecting chat widget styles...');
    
    const styles = `
        #chat-widget-container {
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            z-index: 9999 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        @media (max-width: 640px) {
            #chat-widget-container {
                bottom: 10px !important;
                right: 10px !important;
            }
        }

        #chat-toggle-btn {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ff6b00 0%, #ff8533 100%);
            border: none;
            box-shadow: 0 4px 20px rgba(255, 107, 0, 0.4);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            animation: bounceIn 0.6s ease-out, subtleBounce 3s ease-in-out 2s infinite;
        }

        @keyframes bounceIn {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
        }

        @keyframes subtleBounce {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-5px) scale(1.05); }
        }

        #chat-toggle-btn:hover {
            transform: scale(1.1) rotate(5deg);
            box-shadow: 0 6px 30px rgba(255, 107, 0, 0.6);
        }

        #chat-toggle-btn:active {
            transform: scale(0.95);
        }

        #chat-toggle-btn img {
            width: 36px;
            height: 36px;
            object-fit: contain;
            filter: brightness(0) invert(1);
        }

        #chat-toggle-btn.has-unread::after {
            content: '';
            position: absolute;
            top: 4px;
            right: 4px;
            width: 16px;
            height: 16px;
            background: #ef4444;
            border-radius: 50%;
            border: 3px solid white;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.15); }
        }

        #chat-window {
            position: fixed !important;
            bottom: 94px !important;
            right: 20px !important;
            width: 400px;
            height: 600px;
            max-height: calc(100vh - 120px);
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            display: none;
            flex-direction: column;
            overflow: hidden;
            animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            z-index: 9998 !important;
        }

        @media (max-width: 640px) {
            #chat-window {
                bottom: 0 !important;
                right: 0 !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: 100% !important;
                max-height: 100vh !important;
                border-radius: 0 !important;
            }
        }

        #chat-window.show {
            display: flex !important;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .chat-header {
            background: linear-gradient(135deg, #ff6b00 0%, #ff8533 100%);
            color: white;
            padding: 24px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .chat-header h3 {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .chat-status {
            font-size: 13px;
            opacity: 0.95;
            margin-top: 4px;
        }

        .chat-close {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }

        .chat-close:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: #f9fafb;
        }

        .chat-welcome {
            background: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            border: 2px dashed #e5e7eb;
        }

        .chat-welcome h4 {
            margin: 0 0 8px 0;
            color: #1f2937;
            font-size: 18px;
        }

        .chat-welcome p {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
        }

        .chat-message {
            margin-bottom: 16px;
            display: flex;
            flex-direction: column;
        }

        .chat-message.client {
            align-items: flex-end;
        }

        .chat-message.admin,
        .chat-message.ai {
            align-items: flex-start;
        }

        .message-bubble {
            max-width: 75%;
            padding: 12px 16px;
            border-radius: 16px;
            font-size: 14px;
            line-height: 1.5;
            word-wrap: break-word;
        }

        .chat-message.client .message-bubble {
            background: linear-gradient(135deg, #ff6b00 0%, #ff8533 100%);
            color: white;
            border-bottom-right-radius: 4px;
        }

        .chat-message.admin .message-bubble,
        .chat-message.ai .message-bubble {
            background: white;
            color: #1f2937;
            border: 1px solid #e5e7eb;
            border-bottom-left-radius: 4px;
        }

        .message-time {
            font-size: 11px;
            color: #9ca3af;
            margin-top: 4px;
        }

        .chat-input-area {
            padding: 16px;
            background: white;
            border-top: 1px solid #e5e7eb;
        }

        .chat-input {
            width: 100%;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            resize: none;
            font-family: inherit;
            margin-bottom: 8px;
        }

        .chat-input:focus {
            outline: none;
            border-color: #ff6b00;
            box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.1);
        }

        .chat-send-btn {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #ff6b00 0%, #ff8533 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }

        .chat-send-btn:hover {
            transform: scale(1.02);
        }

        .chat-send-btn:active {
            transform: scale(0.98);
        }

        .chat-send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
    
    console.log('✅ Styles injected successfully');
}

// ═══════════════════════════════════════════════════════════════════
// 🔍 CHECK IF PAGE IS ENABLED FOR CHAT
// ═══════════════════════════════════════════════════════════════════

async function checkIfPageEnabled() {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 CHECKING CHAT CONFIG...');
    console.log('═══════════════════════════════════════════════════════════════');
    
    try {
        // Step 1: Fetch config from Firestore
        console.log('📥 Step 1: Fetching settings/chat_config from Firestore...');
        const configDoc = await getDoc(doc(db, 'settings', 'chat_config'));
        
        if (!configDoc.exists()) {
            console.error('❌ Chat config document NOT FOUND in Firestore');
            console.log('💡 SOLUTION:');
            console.log('   1. Open admin.html in your browser');
            console.log('   2. Navigate to 💬 Онлайн чат | ШІ → ⚙️ Налаштування');
            console.log('   3. Select pages where you want chat to appear');
            console.log('   4. Click "💾 Зберегти налаштування чату"');
            console.log('═══════════════════════════════════════════════════════════════');
            return false;
        }
        
        console.log('✅ Config document found!');
        const config = configDoc.data();
        console.log('📄 Config data:', JSON.stringify(config, null, 2));
        
        // Step 2: Check global enabled flag
        console.log('');
        console.log('🎛️ Step 2: Checking global "enabled" flag...');
        if (!config.enabled) {
            console.error('❌ Chat is GLOBALLY DISABLED');
            console.log('💡 SOLUTION:');
            console.log('   1. Open admin.html');
            console.log('   2. Go to 💬 Онлайн чат | ШІ → ⚙️ Налаштування');
            console.log('   3. Check the box: ☑️ "Увімкнути чат на сайті"');
            console.log('   4. Click "💾 Зберегти налаштування чату"');
            console.log('═══════════════════════════════════════════════════════════════');
            return false;
        }
        console.log('✅ Chat is globally ENABLED');
        
        // Step 3: Get current page identifiers
        console.log('');
        console.log('📍 Step 3: Getting current page identifiers...');
        const currentPath = window.location.pathname;
        const currentSearch = window.location.search;
        const urlParams = new URLSearchParams(currentSearch);
        const categorySlug = urlParams.get('slug') || urlParams.get('cat') || urlParams.get('category');
        
        console.log('   📄 Current path:', currentPath);
        console.log('   🔍 Search params:', currentSearch || '(none)');
        console.log('   📁 Category slug:', categorySlug || '(none)');
        
        // Step 4: Build list of identifiers to check
        console.log('');
        console.log('🔎 Step 4: Building identifiers to check...');
        const identifiersToCheck = [];
        
        // Add current path
        identifiersToCheck.push(currentPath);
        
        // Add normalized path (handle / vs /index.html)
        if (currentPath === '/') {
            identifiersToCheck.push('/index.html');
        } else if (currentPath === '/index.html') {
            identifiersToCheck.push('/');
        }
        
        // Add path with category slug
        if (categorySlug) {
            identifiersToCheck.push(`${currentPath}?slug=${categorySlug}`);
            identifiersToCheck.push(`${currentPath}?cat=${categorySlug}`);
            identifiersToCheck.push(categorySlug); // Just the slug itself
        }
        
        console.log('   🎯 Identifiers to check:', identifiersToCheck);
        
        // Step 5: Get enabled pages from config
        console.log('');
        console.log('📊 Step 5: Getting enabled pages from database...');
        const enabledPages = config.enabledPages || [];
        console.log('   ✅ Enabled pages:', enabledPages);
        console.log('   📈 Total enabled:', enabledPages.length);
        
        // Step 6: Check for matches
        console.log('');
        console.log('🎯 Step 6: Checking for matches...');
        let matchFound = false;
        let matchedIdentifier = null;
        let matchedEnabledPage = null;
        
        for (const identifier of identifiersToCheck) {
            console.log('   🔍 Checking:', identifier);
            
            for (const enabledPage of enabledPages) {
                // Exact match
                if (identifier === enabledPage) {
                    matchFound = true;
                    matchedIdentifier = identifier;
                    matchedEnabledPage = enabledPage;
                    console.log('      ✅ EXACT MATCH with:', enabledPage);
                    break;
                }
                
                // Partial match (for category slugs)
                if (identifier.includes(enabledPage) || enabledPage.includes(identifier)) {
                    matchFound = true;
                    matchedIdentifier = identifier;
                    matchedEnabledPage = enabledPage;
                    console.log('      ✅ PARTIAL MATCH with:', enabledPage);
                    break;
                }
            }
            
            if (matchFound) break;
        }
        
        // Step 7: Final decision
        console.log('');
        console.log('═══════════════════════════════════════════════════════════════');
        if (matchFound) {
            console.log('✅✅✅ MATCH FOUND! SHOWING CHAT WIDGET ✅✅✅');
            console.log('   🎯 Matched identifier:', matchedIdentifier);
            console.log('   📄 Matched enabled page:', matchedEnabledPage);
            console.log('   💬 Chat widget will appear in the bottom-right corner');
        } else {
            console.log('❌❌❌ NO MATCH FOUND. CHAT HIDDEN ❌❌❌');
            console.log('   🚫 None of the identifiers matched enabled pages');
            console.log('');
            console.log('💡 TO ENABLE CHAT ON THIS PAGE:');
            console.log('   1. Open admin.html');
            console.log('   2. Go to 💬 Онлайн чат | ШІ → ⚙️ Налаштування');
            console.log('   3. Find and check one of these:');
            identifiersToCheck.forEach(id => {
                console.log('      ☐', id);
            });
            console.log('   4. Click "💾 Зберегти налаштування чату"');
            console.log('   5. Refresh this page');
        }
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('');
        
        return matchFound;
        
    } catch (error) {
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('❌❌❌ ERROR CHECKING CHAT CONFIG ❌❌❌');
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('Error details:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        
        if (error.code === 'permission-denied') {
            console.error('');
            console.error('🔒 PERMISSION DENIED ERROR');
            console.error('💡 SOLUTION:');
            console.error('   1. Open Firebase Console: https://console.firebase.google.com');
            console.error('   2. Go to Firestore Database → Rules');
            console.error('   3. Add this rule:');
            console.error('      match /settings/chat_config {');
            console.error('        allow read: if true;');
            console.error('      }');
            console.error('   4. Click "Publish"');
        }
        
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('');
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════
// 🎨 CREATE CHAT UI
// ═══════════════════════════════════════════════════════════════════

function createChatUI() {
    console.log('🎨 Creating chat UI elements...');
    
    const container = document.createElement('div');
    container.id = 'chat-widget-container';
    container.innerHTML = `
        <button id="chat-toggle-btn" title="Онлайн чат" aria-label="Відкрити чат">
            <img src="${CONFIG.CHAT_ICON}" alt="Чат" onerror="this.parentElement.innerHTML='💬'; console.error('❌ Failed to load chat icon from: ${CONFIG.CHAT_ICON}');">
        </button>
        
        <div id="chat-window">
            <div class="chat-header">
                <div>
                    <h3>
                        <span>💬</span>
                        <span>Онлайн допомога</span>
                    </h3>
                    <div class="chat-status" id="chat-status">✅ Зараз онлайн</div>
                </div>
                <button class="chat-close" aria-label="Закрити чат">✕</button>
            </div>
            
            <div class="chat-messages" id="chat-messages">
                <div class="chat-welcome">
                    <h4>👋 Вітаємо в чаті!</h4>
                    <p>Є питання? Напишіть нам і ми вам допоможемо!</p>
                </div>
            </div>
            
            <div class="chat-input-area">
                <textarea 
                    id="chat-input" 
                    class="chat-input" 
                    placeholder="Напишіть ваше повідомлення..."
                    rows="2"
                    maxlength="1000"></textarea>
                <button id="chat-send-btn" class="chat-send-btn" aria-label="Надіслати повідомлення">
                    ➤ Надіслати
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(container);
    console.log('✅ Chat UI created and appended to body');
    console.log('   Container ID:', container.id);
    console.log('   Position: fixed, bottom-right');
    console.log('   Z-index: 9999');
}

// ═══════════════════════════════════════════════════════════════════
// 🎮 SETUP EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════

function setupEventListeners() {
    console.log('🎮 Setting up event listeners...');
    
    const toggleBtn = document.getElementById('chat-toggle-btn');
    const chatWindow = document.getElementById('chat-window');
    const closeBtn = document.querySelector('.chat-close');
    const sendBtn = document.getElementById('chat-send-btn');
    const input = document.getElementById('chat-input');

    if (!toggleBtn || !chatWindow || !closeBtn || !sendBtn || !input) {
        console.error('❌ Failed to find chat UI elements');
        return;
    }

    // Toggle chat window
    toggleBtn.addEventListener('click', () => {
        console.log('🖱️ Toggle button clicked');
        const isShowing = chatWindow.classList.toggle('show');
        console.log('   Window now:', isShowing ? 'VISIBLE' : 'HIDDEN');
        
        if (isShowing) {
            input.focus();
            toggleBtn.classList.remove('has-unread');
        }
    });

    // Close chat
    closeBtn.addEventListener('click', () => {
        console.log('🖱️ Close button clicked');
        chatWindow.classList.remove('show');
    });

    // Send message on button click
    sendBtn.addEventListener('click', () => {
        sendMessage();
    });

    // Send message on Enter (but allow Shift+Enter for new line)
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    console.log('✅ Event listeners attached');
}

// ═══════════════════════════════════════════════════════════════════
// 💬 SEND MESSAGE
// ═══════════════════════════════════════════════════════════════════

let currentChatId = null;

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    
    if (!text) {
        console.log('⚠️ Empty message, not sending');
        return;
    }
    
    console.log('💬 Sending message:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    
    try {
        const userId = getUserId();
        console.log('   👤 User ID:', userId);

        // Create chat session if doesn't exist
        if (!currentChatId) {
            console.log('   📝 Creating new chat session...');
            currentChatId = userId;
            const chatRef = doc(db, 'chats', userId);
            
            await setDoc(chatRef, {
                userId,
                userName: 'Гість',
                userEmail: null,
                lastMessage: text,
                lastMessageTime: Timestamp.now(),
                activePage: window.location.pathname,
                status: 'active',
                aiMode: false,
                unreadCount: 1,
                createdAt: Timestamp.now(),
                metadata: {
                    userAgent: navigator.userAgent,
                    referrer: document.referrer || 'direct',
                    language: navigator.language,
                    currentUrl: window.location.href
                }
            });
            
            console.log('   ✅ Chat session created');
            setupRealtimeMessages(userId);
        }

        // Add message to subcollection
        console.log('   💾 Saving message to Firestore...');
        const messagesRef = collection(db, 'chats', currentChatId, 'messages');
        await addDoc(messagesRef, {
            sender: 'client',
            senderName: 'Гість',
            text,
            timestamp: Timestamp.now(),
            read: false,
            type: 'text'
        });

        // Update chat document
        const chatRef = doc(db, 'chats', currentChatId);
        const chatDoc = await getDoc(chatRef);
        const currentUnread = chatDoc.data()?.unreadCount || 0;
        
        await updateDoc(chatRef, {
            lastMessage: text,
            lastMessageTime: Timestamp.now(),
            activePage: window.location.pathname,
            unreadCount: currentUnread + 1
        });

        // Clear input and show in UI
        input.value = '';
        addMessageToUI('client', text);
        console.log('✅ Message sent successfully');

    } catch (error) {
        console.error('❌ Error sending message:', error);
        alert('Помилка при відправці повідомлення. Спробуйте ще раз.');
    }
}

// ═══════════════════════════════════════════════════════════════════
// 🆔 GET/CREATE USER ID
// ═══════════════════════════════════════════════════════════════════

function getUserId() {
    let userId = localStorage.getItem(CONFIG.USER_ID_KEY);
    
    if (!userId) {
        userId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(CONFIG.USER_ID_KEY, userId);
        console.log('🆔 Generated new user ID:', userId);
    } else {
        console.log('🆔 Retrieved existing user ID:', userId);
    }
    
    return userId;
}

// ═══════════════════════════════════════════════════════════════════
// 📨 ADD MESSAGE TO UI
// ═══════════════════════════════════════════════════════════════════

function addMessageToUI(sender, text, timestamp) {
    const messagesContainer = document.getElementById('chat-messages');
    
    // Remove welcome message if exists
    const welcome = messagesContainer.querySelector('.chat-welcome');
    if (welcome) welcome.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;
    
    messageDiv.appendChild(bubble);
    
    if (timestamp) {
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = new Date(timestamp.seconds * 1000).toLocaleTimeString('uk-UA', {
            hour: '2-digit',
            minute: '2-digit'
        });
        messageDiv.appendChild(timeDiv);
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ═══════════════════════════════════════════════════════════════════
// 🔄 SETUP REALTIME MESSAGE LISTENER
// ═══════════════════════════════════════════════════════════════════

function setupRealtimeMessages(chatId) {
    console.log('🔄 Setting up realtime message listener for chat:', chatId);
    
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const data = change.doc.data();
                if (data.sender !== 'client') {
                    addMessageToUI(data.sender, data.text, data.timestamp);
                    
                    // Show unread badge if window is closed
                    const chatWindow = document.getElementById('chat-window');
                    const toggleBtn = document.getElementById('chat-toggle-btn');
                    if (!chatWindow.classList.contains('show')) {
                        toggleBtn.classList.add('has-unread');
                    }
                }
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════════════
// 🚀 MAIN INITIALIZATION
// ═══════════════════════════════════════════════════════════════════

(async function init() {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🚀 INITIALIZING CHAT WIDGET');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📅 Date:', new Date().toLocaleString('uk-UA'));
    console.log('🌐 URL:', window.location.href);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    
    try {
        // Step 1: Wait for Firebase (or initialize ourselves)
        console.log('⏳ Step 1: Checking Firebase availability...');
        const firebaseReady = await waitForFirebaseInit();
        
        if (!firebaseReady) {
            console.log('⚠️ Firebase not ready from firebase-init.js, initializing ourselves...');
            const initSuccess = await initializeFirebase();
            if (!initSuccess) {
                console.error('❌ Failed to initialize Firebase. Chat widget cannot load.');
                return;
            }
        } else {
            // Use the db from window (exported by firebase-init.js)
            db = window.db || db;
        }
        
        // Step 2: Inject styles
        console.log('');
        console.log('🎨 Step 2: Injecting styles...');
        injectStyles();
        
        // Step 3: Check if page is enabled
        console.log('');
        console.log('🔍 Step 3: Checking if chat should load on this page...');
        const shouldLoad = await checkIfPageEnabled();
        
        if (!shouldLoad) {
            console.log('');
            console.log('🛑 Chat widget will NOT load on this page');
            console.log('═══════════════════════════════════════════════════════════════');
            return;
        }
        
        // Step 4: Create UI
        console.log('');
        console.log('🎨 Step 4: Creating chat UI...');
        createChatUI();
        
        // Step 5: Setup events
        console.log('');
        console.log('🎮 Step 5: Setting up event listeners...');
        setupEventListeners();
        
        // Success!
        console.log('');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('✅✅✅ CHAT WIDGET LOADED SUCCESSFULLY! ✅✅✅');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('💬 Look for the orange button in the bottom-right corner!');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('');
        
    } catch (error) {
        console.error('');
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('❌❌❌ FATAL ERROR LOADING CHAT WIDGET ❌❌❌');
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('');
    }
})();
