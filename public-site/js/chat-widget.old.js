/**
 * ═══════════════════════════════════════════════════════════════════════
 * 💬 LIVE CHAT WIDGET - Client Side
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Real-time chat widget with admin/AI support
 * Conditionally loads based on Firestore settings
 * 
 * @version 2.0.0
 * @created 2026-01-25
 */

import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, doc, getDoc, setDoc, addDoc, onSnapshot, query, orderBy, Timestamp, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

(async function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════
    // 🔧 CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════
    
    const CONFIG = {
        DEBUG: true,
        STORAGE_KEY: 'latiao_chat_session',
        USER_ID_KEY: 'latiao_user_id',
        CHAT_ICON: 'https://raw.githubusercontent.com/yakovenko213/latiao-club/main/images/chat-icon.png'
    };

    // ═══════════════════════════════════════════════════════════════════
    // 🔥 FIREBASE INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════
    
    const firebaseConfig = {
        apiKey: "AIzaSyDyQvItRyL4IKl9NmEItswwPOEiKAbWkMw",
        authDomain: "my-magazin-81c96.firebaseapp.com",
        projectId: "my-magazin-81c96",
        storageBucket: "my-magazin-81c96.firebasestorage.app",
        messagingSenderId: "129061757346",
        appId: "1:129061757346:web:3e7bc5838cc5f7bda992fb"
    };

    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);

    if (CONFIG.DEBUG) console.log('💬 Chat Widget: Firebase initialized');

    // ═══════════════════════════════════════════════════════════════════
    // 🎨 STYLES
    // ═══════════════════════════════════════════════════════════════════
    
    const styles = `
        #chat-widget-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        @media (max-width: 640px) {
            #chat-widget-container {
                bottom: 10px;
                right: 10px;
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
            position: fixed;
            bottom: 94px;
            right: 20px;
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
        }

        @media (max-width: 640px) {
            #chat-window {
                bottom: 0;
                right: 0;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                max-height: 100vh;
                border-radius: 0;
            }
        }

        #chat-window.show {
            display: flex;
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

        .chat-message.ai .message-bubble {
            border-left: 3px solid #8b5cf6;
        }

        .message-sender {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 4px;
            padding: 0 4px;
        }

        .message-time {
            font-size: 11px;
            color: #9ca3af;
            margin-top: 4px;
            padding: 0 4px;
        }

        .chat-input-area {
            padding: 16px;
            background: white;
            border-top: 1px solid #e5e7eb;
        }

        .chat-input {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid #d1d5db;
            border-radius: 12px;
            font-size: 14px;
            resize: none;
            font-family: inherit;
            transition: border-color 0.2s;
        }

        .chat-input:focus {
            outline: none;
            border-color: #ff6b00;
        }

        .chat-send-btn {
            margin-top: 8px;
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #ff6b00 0%, #ff8533 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .chat-send-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
        }

        .chat-send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .chat-welcome {
            text-align: center;
            color: #6b7280;
            padding: 40px 20px;
        }

        .chat-welcome h4 {
            margin: 0 0 8px 0;
            color: #1f2937;
            font-size: 16px;
        }

        @media (max-width: 480px) {
            #chat-window {
                width: calc(100vw - 40px);
                right: 20px;
                left: 20px;
                bottom: 90px;
            }
        }
    `;

    // ═══════════════════════════════════════════════════════════════════
    // 🎯 MAIN INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════
    
    async function init() {
        // Check if chat widget should load on this page
        const shouldLoad = await checkIfPageEnabled();
        if (!shouldLoad) {
            if (CONFIG.DEBUG) console.log('💬 Chat Widget: Not enabled for this page');
            return;
        }

        if (CONFIG.DEBUG) console.log('💬 Chat Widget: Loading on this page');

        // Inject styles
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);

        // Create UI
        createChatUI();

        // Setup event listeners
        setupEventListeners();

        // Get or create user session
        const userId = getUserId();
        
        // Load existing chat or wait for first message
        loadChatHistory(userId);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🔍 CHECK IF WIDGET SHOULD LOAD
    // ═══════════════════════════════════════════════════════════════════
    
    async function checkIfPageEnabled() {
        try {
            const configDoc = await getDoc(doc(db, 'settings', 'chat_config'));
            
            if (!configDoc.exists()) {
                console.warn('❌ Chat config not found in Firestore');
                console.log('💡 Create it in Admin Panel: admin.html → 💬 Онлайн чат | ШІ → ⚙️ Налаштування');
                return false;
            }

            const config = configDoc.data();
            
            // Check if chat is globally enabled
            if (!config.enabled) {
                console.log('🔕 Chat is globally DISABLED');
                console.log('💡 Enable it in Admin Panel: admin.html → Chat Settings');
                return false;
            }

            // Get current page path and URL parameters
            const currentPath = window.location.pathname;
            const urlParams = new URLSearchParams(window.location.search);
            const categorySlug = urlParams.get('slug') || urlParams.get('cat') || urlParams.get('category');
            
            // Build possible URLs to check
            const urlsToCheck = [currentPath];
            
            // Add normalized path
            const normalizedPath = currentPath === '/' ? '/index.html' : currentPath;
            if (normalizedPath !== currentPath) {
                urlsToCheck.push(normalizedPath);
            }
            
            // Add category URL if present
            if (categorySlug) {
                urlsToCheck.push(`${currentPath}?slug=${categorySlug}`);
                urlsToCheck.push(`${currentPath}?cat=${categorySlug}`);
                urlsToCheck.push(`/category.html?slug=${categorySlug}`);
            }
            
            // Check if current page is in enabledPages array
            const enabledPages = config.enabledPages || [];
            
            let isEnabled = false;
            let matchedUrl = null;
            
            for (const url of urlsToCheck) {
                if (enabledPages.some(page => {
                    // Exact match
                    if (page === url) return true;
                    // Handle both "/" and "/index.html"
                    if (page === '/' && url === '/index.html') return true;
                    if (page === '/index.html' && url === '/') return true;
                    // Partial match for categories
                    if (categorySlug && page.includes(categorySlug)) return true;
                    return false;
                })) {
                    isEnabled = true;
                    matchedUrl = url;
                    break;
                }
            }

            // Detailed debug logging
            console.log('═══════════════════════════════════════');
            console.log('💬 CHAT WIDGET LOADING CHECK');
            console.log('═══════════════════════════════════════');
            console.log('📍 Current URL:', window.location.href);
            console.log('📄 Path:', currentPath);
            console.log('📁 Category:', categorySlug || 'N/A');
            console.log('🔍 Checking URLs:', urlsToCheck);
            console.log('✅ Enabled Pages:', enabledPages);
            console.log('───────────────────────────────────────');
            
            if (isEnabled) {
                console.log('✅ CHAT ENABLED ON THIS PAGE');
                console.log('🎯 Matched URL:', matchedUrl);
                console.log('💬 Chat widget will appear in 3... 2... 1...');
            } else {
                console.log('❌ CHAT DISABLED ON THIS PAGE');
                console.log('🚫 Reason: Current page not in enabledPages array');
                console.log('💡 To enable chat here:');
                console.log('   1. Open admin.html');
                console.log('   2. Go to 💬 Онлайн чат | ШІ → ⚙️ Налаштування');
                console.log('   3. Check the box for:', currentPath);
                console.log('   4. Click "💾 Зберегти налаштування чату"');
            }
            
            console.log('═══════════════════════════════════════');

            return isEnabled;

        } catch (error) {
            console.error('❌ Error checking chat config:', error);
            console.log('💡 Check Firestore connection and rules');
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🆔 USER ID MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════
    
    function getUserId() {
        let userId = localStorage.getItem(CONFIG.USER_ID_KEY);
        
        if (!userId) {
            // Generate anonymous user ID
            userId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(CONFIG.USER_ID_KEY, userId);
        }

        return userId;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🎨 CREATE UI
    // ═══════════════════════════════════════════════════════════════════
    
    function createChatUI() {
        const container = document.createElement('div');
        container.id = 'chat-widget-container';
        container.innerHTML = `
            <button id="chat-toggle-btn" title="Онлайн чат" aria-label="Відкрити чат">
                <img src="${CONFIG.CHAT_ICON}" alt="Чат" onerror="this.parentElement.innerHTML='💬'">
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
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🎮 EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════════
    
    function setupEventListeners() {
        const toggleBtn = document.getElementById('chat-toggle-btn');
        const chatWindow = document.getElementById('chat-window');
        const closeBtn = document.querySelector('.chat-close');
        const sendBtn = document.getElementById('chat-send-btn');
        const input = document.getElementById('chat-input');

        // Toggle chat window
        toggleBtn.addEventListener('click', () => {
            chatWindow.classList.toggle('show');
            if (chatWindow.classList.contains('show')) {
                input.focus();
                toggleBtn.classList.remove('has-unread');
            }
        });

        // Close chat
        closeBtn.addEventListener('click', () => {
            chatWindow.classList.remove('show');
        });

        // Send message
        sendBtn.addEventListener('click', () => sendMessage());

        // Send on Enter (Shift+Enter for new line)
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 💬 CHAT FUNCTIONALITY
    // ═══════════════════════════════════════════════════════════════════
    
    let currentChatId = null;
    let messagesUnsubscribe = null;

    async function loadChatHistory(userId) {
        try {
            // Try to find existing chat session
            const chatRef = doc(db, 'chats', userId);
            const chatDoc = await getDoc(chatRef);

            if (chatDoc.exists()) {
                currentChatId = userId;
                setupRealtimeMessages(userId);
            } else {
                // Chat will be created when user sends first message
                currentChatId = null;
            }

        } catch (error) {
            console.error('💬 Error loading chat:', error);
        }
    }

    function setupRealtimeMessages(chatId) {
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        // Unsubscribe from previous listener if exists
        if (messagesUnsubscribe) {
            messagesUnsubscribe();
        }

        messagesUnsubscribe = onSnapshot(q, (snapshot) => {
            const messagesContainer = document.getElementById('chat-messages');
            messagesContainer.innerHTML = ''; // Clear previous messages

            snapshot.forEach((doc) => {
                const message = doc.data();
                appendMessage(message);
            });

            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            // Show unread indicator if window is closed
            const chatWindow = document.getElementById('chat-window');
            if (!chatWindow.classList.contains('show')) {
                const toggleBtn = document.getElementById('chat-toggle-btn');
                toggleBtn.classList.add('has-unread');
            }
        });
    }

    function appendMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${message.sender}`;

        const time = message.timestamp?.toDate?.() || new Date();
        const timeStr = time.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

        let senderLabel = '';
        if (message.sender === 'admin') {
            senderLabel = '<div class="message-sender">👤 Менеджер</div>';
        } else if (message.sender === 'ai') {
            senderLabel = '<div class="message-sender">🤖 AI Помічник</div>';
        }

        messageDiv.innerHTML = `
            ${senderLabel}
            <div class="message-bubble">${escapeHtml(message.text)}</div>
            <div class="message-time">${timeStr}</div>
        `;

        messagesContainer.appendChild(messageDiv);
    }

    async function sendMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();

        if (!text) return;

        const sendBtn = document.getElementById('chat-send-btn');
        sendBtn.disabled = true;
        input.disabled = true;

        try {
            const userId = getUserId();

            // Create chat session if doesn't exist
            if (!currentChatId) {
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
                        language: navigator.language
                    }
                });

                // Setup real-time listener for this new chat
                setupRealtimeMessages(userId);
            }

            // Add message to sub-collection
            const messagesRef = collection(db, 'chats', currentChatId, 'messages');
            await addDoc(messagesRef, {
                sender: 'client',
                senderName: 'Гість',
                text,
                timestamp: Timestamp.now(),
                read: false,
                type: 'text'
            });

            // Update chat document with last message
            const chatRef = doc(db, 'chats', currentChatId);
            await updateDoc(chatRef, {
                lastMessage: text,
                lastMessageTime: Timestamp.now(),
                activePage: window.location.pathname,
                unreadCount: (await getDoc(chatRef)).data().unreadCount + 1
            });

            // Clear input
            input.value = '';

        } catch (error) {
            console.error('💬 Error sending message:', error);
            alert('Помилка при відправці повідомлення. Спробуйте ще раз.');
        } finally {
            sendBtn.disabled = false;
            input.disabled = false;
            input.focus();
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🛠️ UTILITIES
    // ═══════════════════════════════════════════════════════════════════
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🚀 AUTO-INITIALIZE
    // ═══════════════════════════════════════════════════════════════════
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
