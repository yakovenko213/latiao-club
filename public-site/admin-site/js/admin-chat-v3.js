/**
 * ═══════════════════════════════════════════════════════════════════════
 * 💬 ADMIN LIVE CHAT MANAGEMENT SYSTEM
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Manages customer chats with AI assistance
 * Real-time message sync with Firestore
 * 
 * @version 2.0.0 - SAFE START EDITION
 * @created 2026-01-24
 * @updated 2026-01-28 - Added comprehensive error handling
 */

console.log('🚀 Admin Chat Script Started - File loaded successfully');
console.log('⏰ Load time:', new Date().toISOString());

// NOTE: This file assumes Firebase is already initialized in admin.html
// Uses global variables: db, auth, onSnapshot, collection, doc, etc.

(function() {
    'use strict';

    console.log('🚀 Admin Chat IIFE executing...');

    // ═══════════════════════════════════════════════════════════════════
    // 🔧 CONFIG
    // ═══════════════════════════════════════════════════════════════════
    
    const CONFIG = {
        DEBUG: true,
        LOAD_TIMEOUT: 10000, // 10 seconds timeout
        MAX_RETRIES: 3, // Maximum retry attempts
        RETRY_DELAY: 2000, // 2 seconds between retries
        GEMINI_API_KEY: 'AIzaSyA11Wu1XUxEXXeCz3t_NfOr0ygoEblvbhY',
        GEMINI_MODEL: 'gemini-2.0-flash-exp',
        GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'
    };

    // ═══════════════════════════════════════════════════════════════════
    // 💾 STATE
    // ═══════════════════════════════════════════════════════════════════
    
    let chats = [];
    let currentChatId = null;
    let messagesUnsubscribe = null;
    let chatsUnsubscribe = null;
    let loadingTimeoutId = null;
    let isAuthenticated = false;
    let retryAttempt = 0;

    // ═══════════════════════════════════════════════════════════════════
    // 🛡️ ERROR DISPLAY HELPER
    // ═══════════════════════════════════════════════════════════════════
    
    function showErrorInUI(errorMessage, errorCode = null) {
        console.error('💬 UI Error:', errorMessage, errorCode);
        const chatListContainer = document.getElementById('chat-list-container');
        if (!chatListContainer) return;
        
        chatListContainer.innerHTML = `
            <div class="text-center py-8 px-4">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="alert-triangle" class="w-8 h-8 text-red-500"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Помилка завантаження</h3>
                <p class="text-sm text-gray-600 mb-2">${errorMessage}</p>
                ${errorCode ? `<p class="text-xs text-red-500 font-mono mb-4">Код: ${errorCode}</p>` : ''}
                <button onclick="window.retryLoadChats()" 
                        class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                    <i data-lucide="refresh-cw" class="w-4 h-4 inline mr-2"></i>
                    Спробувати знову
                </button>
                <p class="text-xs text-gray-400 mt-4">Перевірте консоль (F12) для деталей</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    }
    
    function showLoadingWithTimeout() {
        const chatListContainer = document.getElementById('chat-list-container');
        if (!chatListContainer) return;
        
        chatListContainer.innerHTML = `
            <div class="text-center py-12" id="chat-loading-indicator">
                <div class="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p class="text-gray-500">Завантаження чатів...</p>
                <p class="text-xs text-gray-400 mt-2" id="loading-status">Очікування Firebase...</p>
            </div>
        `;
        
        // Set timeout for loading
        if (loadingTimeoutId) clearTimeout(loadingTimeoutId);
        loadingTimeoutId = setTimeout(() => {
            console.error('💬 Loading timeout after', CONFIG.LOAD_TIMEOUT, 'ms');
            showErrorInUI('Таймаут завантаження. Перевірте підключення до інтернету або авторизацію.', 'TIMEOUT');
        }, CONFIG.LOAD_TIMEOUT);
    }
    
    function updateLoadingStatus(status) {
        const statusEl = document.getElementById('loading-status');
        if (statusEl) statusEl.textContent = status;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🎬 INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════
    
    window.initLiveChat = async function() {
        console.log('💬 initLiveChat() called - Attempt', retryAttempt + 1, 'of', CONFIG.MAX_RETRIES);
        
        if (CONFIG.DEBUG) console.log('💬 Initializing Live Chat Management...');
        
        showLoadingWithTimeout();
        
        try {
            // Step 1: Wait for Firebase
            updateLoadingStatus('Очікування Firebase...');
            await waitForFirebase();
            
            // Step 2: Ensure network is enabled
            updateLoadingStatus('Перевірка мережі...');
            await ensureNetworkEnabled();
            
            // Step 3: Wait for pending writes
            updateLoadingStatus('Синхронізація...');
            await checkPendingWrites();
            
            // Step 4: Wait for Authentication
            updateLoadingStatus('Перевірка авторизації...');
            await waitForAuth();
            
            // Step 5: Load chats (only after all checks passed)
            updateLoadingStatus('Завантаження чатів...');
            loadChats();
            
            loadChatSettings();
            setupEventListeners();
            
            // Reset retry counter on success
            retryAttempt = 0;
            
        } catch (error) {
            console.error('💬 Chat Debug - Initialization failed:', {
                message: error.message,
                code: error.code,
                name: error.name,
                stack: error.stack,
                attempt: retryAttempt + 1,
                maxRetries: CONFIG.MAX_RETRIES
            });
            
            // Check for specific Firestore errors
            if (error.code === 'resource-exhausted') {
                showErrorInUI('Перевищено ліміт запитів. Спробуйте пізніше.', 'RESOURCE_EXHAUSTED');
                return;
            } else if (error.code === 'permission-denied') {
                showErrorInUI('Немає доступу до чатів. Перевірте авторизацію.', 'PERMISSION_DENIED');
                return;
            }
            
            // Retry logic
            if (retryAttempt < CONFIG.MAX_RETRIES) {
                retryAttempt++;
                console.log('🔄 Retrying in', CONFIG.RETRY_DELAY, 'ms... (attempt', retryAttempt, 'of', CONFIG.MAX_RETRIES, ')');
                await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
                window.initLiveChat();
            } else {
                showErrorInUI(
                    `Не вдалося підключитися після ${CONFIG.MAX_RETRIES} спроб. ${error.message}`,
                    error.code || 'INIT_FAILED'
                );
                retryAttempt = 0; // Reset for next manual retry
            }
        }
    };
    
    // Retry function exposed globally
    window.retryLoadChats = function() {
        console.log('💬 Manual retry requested...');
        retryAttempt = 0; // Reset retry counter
        if (loadingTimeoutId) clearTimeout(loadingTimeoutId);
        if (chatsUnsubscribe) chatsUnsubscribe();
        window.initLiveChat();
    };
    
    // Ensure network is enabled
    async function ensureNetworkEnabled() {
        if (typeof window.enableNetwork === 'undefined') {
            console.warn('💬 enableNetwork not available, skipping network check');
            return;
        }
        
        try {
            console.log('💬 Ensuring Firestore network is enabled...');
            await window.enableNetwork(window.db);
            console.log('✅ Network enabled successfully');
        } catch (error) {
            console.error('💬 Chat Debug - Network enable error:', {
                message: error.message,
                code: error.code,
                name: error.name
            });
            // Don't throw - network might already be enabled
        }
    }
    
    // Check for pending writes
    async function checkPendingWrites() {
        if (typeof window.waitForPendingWrites === 'undefined') {
            console.warn('💬 waitForPendingWrites not available, skipping sync check');
            return;
        }
        
        try {
            console.log('💬 Waiting for pending writes to sync...');
            await window.waitForPendingWrites(window.db);
            console.log('✅ All writes synced successfully');
        } catch (error) {
            console.error('💬 Chat Debug - Pending writes error:', {
                message: error.message,
                code: error.code,
                name: error.name
            });
            // Don't throw - we can proceed even if sync is pending
        }
    };

    // Wait for Firebase initialization with detailed checks
    async function waitForFirebase() {
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds max
        
        console.log('💬 Waiting for Firebase initialization...');
        console.log('💬 Current state:', {
            'window.db': typeof window.db,
            'window.auth': typeof window.auth,
            'window.collection': typeof window.collection,
            'window.onSnapshot': typeof window.onSnapshot,
            'window.firebaseInit': typeof window.firebaseInit
        });
        
        while (typeof window.db === 'undefined' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
            
            if (attempts % 10 === 0 && CONFIG.DEBUG) {
                console.log('💬 Still waiting... Elapsed:', attempts * 100, 'ms');
                console.log('💬 Firebase globals:', Object.keys(window).filter(k => 
                    k.startsWith('firebase') || k === 'db' || k === 'auth' || k.includes('Firestore')
                ).join(', '));
            }
        }
        
        if (typeof window.db === 'undefined') {
            const availableGlobals = Object.keys(window).filter(k => 
                k.startsWith('firebase') || k === 'db' || k === 'auth' || k === 'collection'
            );
            
            console.error('💬 Chat Debug - Firebase initialization timeout:', {
                elapsedMs: attempts * 100,
                availableGlobals: availableGlobals,
                windowDb: typeof window.db,
                windowAuth: typeof window.auth,
                documentReadyState: document.readyState
            });
            
            throw new Error('Firebase не ініціалізовано після ' + (attempts * 100) + 'мс. Оновіть сторінку.');
        }
        
        console.log('✅ Firebase ready after', attempts * 100, 'ms');
        console.log('✅ Available Firebase methods:', {
            db: !!window.db,
            collection: !!window.collection,
            onSnapshot: !!window.onSnapshot,
            query: !!window.query,
            orderBy: !!window.orderBy
        });
        
        return true;
    }
    
    // Wait for Authentication with safety checks
    async function waitForAuth() {
        console.log('💬 Checking authentication...');
        
        return new Promise((resolve, reject) => {
            // Check if auth is available
            if (typeof window.auth === 'undefined') {
                console.error('💬 window.auth is undefined');
                reject(new Error('Firebase Auth не доступний'));
                return;
            }
            
            // Critical safety check for onAuthStateChanged
            if (typeof window.onAuthStateChanged !== 'function') {
                console.error('💬 Chat Debug - onAuthStateChanged is not a function:', {
                    type: typeof window.onAuthStateChanged,
                    value: window.onAuthStateChanged,
                    windowAuth: typeof window.auth,
                    availableAuthMethods: Object.keys(window.auth || {})
                });
                reject(new Error('onAuthStateChanged не імпортовано коректно. Перезавантажте сторінку.'));
                return;
            }
            
            try {
                // Check current auth state
                const unsubscribe = window.onAuthStateChanged(window.auth, (user) => {
                    unsubscribe(); // Only need to check once
                    
                    if (user) {
                        console.log('✅ User authenticated:', user.email);
                        isAuthenticated = true;
                        resolve(true);
                    } else {
                        console.warn('⚠️ User NOT authenticated - chats may fail to load');
                        // Still try to load, but warn
                        isAuthenticated = false;
                        resolve(false);
                    }
                }, (error) => {
                    console.error('💬 Auth error:', error);
                    reject(error);
                });
                
                // Timeout for auth check
                setTimeout(() => {
                    unsubscribe();
                    console.warn('💬 Auth check timeout, proceeding anyway...');
                    resolve(false);
                }, 5000);
            } catch (error) {
                console.error('💬 Chat Debug - Auth check crashed:', {
                    message: error.message,
                    stack: error.stack
                });
                reject(error);
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 📡 LOAD CHATS
    // ═══════════════════════════════════════════════════════════════════
    
    function loadChats() {
        console.log('💬 loadChats() called');
        console.log('💬 isAuthenticated:', isAuthenticated);
        
        if (typeof window.db === 'undefined') {
            console.error('💬 Firebase not initialized yet');
            showErrorInUI('Firebase не ініціалізовано', 'NO_FIREBASE');
            return;
        }
        
        if (!isAuthenticated) {
            console.warn('💬 User not authenticated, chat list may be empty or fail');
        }

        try {
            const chatsRef = window.collection(window.db, 'chats');
            console.log('💬 chatsRef created:', chatsRef);
            
            const q = window.query(chatsRef, window.orderBy('lastMessageTime', 'desc'));
            console.log('💬 Query created, subscribing to onSnapshot...');

            if (chatsUnsubscribe) {
                console.log('💬 Unsubscribing from previous listener');
                chatsUnsubscribe();
            }

            chatsUnsubscribe = window.onSnapshot(q, 
                // Success callback
                (snapshot) => {
                    // Clear loading timeout on success
                    if (loadingTimeoutId) {
                        clearTimeout(loadingTimeoutId);
                        loadingTimeoutId = null;
                    }
                    
                    console.log('✅ onSnapshot SUCCESS - received', snapshot.size, 'documents');
                    
                    chats = [];
                    let totalUnread = 0;

                    snapshot.forEach((doc) => {
                        const chat = { id: doc.id, ...doc.data() };
                        chats.push(chat);
                        if (chat.unreadCount > 0) {
                            totalUnread += chat.unreadCount;
                        }
                    });

                    renderChatList();
                    updateUnreadBadge(totalUnread);

                    console.log('💬 Loaded', chats.length, 'chats, unread:', totalUnread);
                },
                // Error callback - THIS IS CRITICAL!
                (error) => {
                    console.error('❌ onSnapshot ERROR:', error);
                    console.error('❌ Error code:', error.code);
                    console.error('❌ Error message:', error.message);
                    
                    // Clear loading timeout
                    if (loadingTimeoutId) {
                        clearTimeout(loadingTimeoutId);
                        loadingTimeoutId = null;
                    }
                    
                    // Handle specific errors
                    if (error.code === 'permission-denied') {
                        showErrorInUI(
                            'Немає дозволу на читання чатів. Увійдіть як адміністратор.',
                            'permission-denied'
                        );
                    } else if (error.code === 'unavailable') {
                        showErrorInUI(
                            'Firestore недоступний. Перевірте інтернет-з\'єднання.',
                            'unavailable'
                        );
                    } else {
                        showErrorInUI(
                            error.message || 'Невідома помилка',
                            error.code
                        );
                    }
                }
            );
            
            console.log('💬 onSnapshot listener attached');
            
        } catch (error) {
            console.error('💬 Exception in loadChats:', error);
            showErrorInUI(error.message, error.code || 'EXCEPTION');
        }
    }

    function renderChatList() {
        const chatListContainer = document.getElementById('chat-list-container');
        if (!chatListContainer) return;

        if (chats.length === 0) {
            chatListContainer.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i data-lucide="message-circle" class="w-12 h-12 mx-auto mb-3 text-gray-400"></i>
                    <p>Немає активних чатів</p>
                    <p class="text-sm mt-1">Чати з'являться автоматично</p>
                </div>
            `;
            window.lucide.createIcons();
            return;
        }

        chatListContainer.innerHTML = chats.map(chat => `
            <div class="chat-list-item ${currentChatId === chat.id ? 'active' : ''}" 
                 onclick="selectChat('${chat.id}')"
                 data-chat-id="${chat.id}">
                <div class="flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors border-b border-gray-100">
                    <div class="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        ${chat.userName ? chat.userName[0].toUpperCase() : 'Г'}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-2 mb-1">
                            <h4 class="font-semibold text-gray-900 truncate">${chat.userName || 'Гість'}</h4>
                            ${chat.unreadCount > 0 ? `
                                <span class="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold flex-shrink-0">
                                    ${chat.unreadCount}
                                </span>
                            ` : ''}
                        </div>
                        <p class="text-sm text-gray-600 truncate">${chat.lastMessage || 'Нове повідомлення'}</p>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-xs text-gray-400">
                                ${formatTimestamp(chat.lastMessageTime)}
                            </span>
                            ${chat.activePage ? `
                                <span class="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                    ${chat.activePage}
                                </span>
                            ` : ''}
                            ${chat.aiMode ? `
                                <span class="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded flex items-center gap-1">
                                    <i data-lucide="bot" class="w-3 h-3"></i> AI
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        window.lucide.createIcons();
    }

    window.selectChat = async function(chatId) {
        currentChatId = chatId;
        
        // Update UI
        document.querySelectorAll('.chat-list-item').forEach(item => {
            item.classList.toggle('active', item.dataset.chatId === chatId);
        });

        // Show chat window
        document.getElementById('chat-empty-state').classList.add('hidden');
        document.getElementById('chat-window-container').classList.remove('hidden');

        // Load messages
        loadMessages(chatId);

        // Mark as read
        await markChatAsRead(chatId);

        // Load chat info
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            document.getElementById('chat-window-user-name').textContent = chat.userName || 'Гість';
            document.getElementById('chat-window-page').textContent = chat.activePage || 'Невідома сторінка';
            document.getElementById('ai-mode-toggle').checked = chat.aiMode || false;
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // 💬 MESSAGES
    // ═══════════════════════════════════════════════════════════════════
    
    function loadMessages(chatId) {
        if (CONFIG.DEBUG) console.log('💬 Loading messages for chat:', chatId);
        
        // Unsubscribe from previous listener
        if (messagesUnsubscribe) {
            messagesUnsubscribe();
            messagesUnsubscribe = null;
        }

        const messagesContainer = document.getElementById('chat-messages-container');
        if (!messagesContainer) {
            console.error('💬 Messages container not found!');
            return;
        }

        // Show loading state
        messagesContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i data-lucide="loader" class="w-8 h-8 mx-auto mb-2 animate-spin"></i>
                <p>Завантаження повідомлень...</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();

        try {
            const messagesRef = window.collection(window.db, 'chats', chatId, 'messages');
            const q = window.query(messagesRef, window.orderBy('timestamp', 'asc'));

            messagesUnsubscribe = window.onSnapshot(q, (snapshot) => {
                if (CONFIG.DEBUG) console.log('💬 Messages snapshot received:', snapshot.size, 'messages');
                
                messagesContainer.innerHTML = '';

                if (snapshot.empty) {
                    messagesContainer.innerHTML = `
                        <div class="text-center py-8 text-gray-500">
                            <i data-lucide="message-square" class="w-12 h-12 mx-auto mb-3 text-gray-300"></i>
                            <p>Поки що немає повідомлень</p>
                            <p class="text-sm mt-1">Клієнт ще не написав</p>
                        </div>
                    `;
                    if (window.lucide) window.lucide.createIcons();
                    return;
                }

                snapshot.forEach((doc) => {
                    const message = { id: doc.id, ...doc.data() };
                    appendMessage(message);
                });

                // Auto-scroll to bottom with slight delay for DOM update
                requestAnimationFrame(() => {
                    messagesContainer.scrollTo({
                        top: messagesContainer.scrollHeight,
                        behavior: 'smooth'
                    });
                });
                
            }, (error) => {
                console.error('💬 Error listening to messages:', error);
                messagesContainer.innerHTML = `
                    <div class="text-center py-8 text-red-500">
                        <i data-lucide="alert-circle" class="w-12 h-12 mx-auto mb-3"></i>
                        <p>Помилка завантаження повідомлень</p>
                        <p class="text-sm mt-1">${error.message}</p>
                        <button onclick="loadMessages('${chatId}')" class="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                            Спробувати знову
                        </button>
                    </div>
                `;
                if (window.lucide) window.lucide.createIcons();
            });
        } catch (error) {
            console.error('💬 Error setting up messages listener:', error);
        }
    }

    // Expose loadMessages globally for retry button
    window.loadMessages = loadMessages;

    function appendMessage(message) {
        const messagesContainer = document.getElementById('chat-messages-container');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        
        const isClient = message.sender === 'client';
        const isAdmin = message.sender === 'admin';
        const isAI = message.sender === 'ai';
        
        // From admin perspective: client messages on LEFT, admin/AI messages on RIGHT
        const isOurMessage = isAdmin || isAI;
        
        messageDiv.className = `flex ${isOurMessage ? 'justify-end' : 'justify-start'} mb-4`;
        
        const time = message.timestamp?.toDate?.() || new Date();
        const timeStr = time.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

        let senderLabel = '';
        let bubbleClass = '';
        let roundedCorner = '';
        
        if (isClient) {
            // Client messages: LEFT side, blue bubble
            senderLabel = `<div class="text-xs text-blue-600 mb-1 flex items-center gap-1">
                <i data-lucide="user" class="w-3 h-3"></i> ${message.senderName || 'Клієнт'}
            </div>`;
            bubbleClass = 'bg-blue-500 text-white';
            roundedCorner = 'rounded-bl-sm';
        } else if (isAI) {
            // AI messages: RIGHT side, purple bubble
            senderLabel = '<div class="text-xs text-purple-600 mb-1 flex items-center gap-1"><i data-lucide="bot" class="w-3 h-3"></i> AI Помічник</div>';
            bubbleClass = 'bg-purple-100 text-gray-900 border border-purple-200';
            roundedCorner = 'rounded-br-sm';
        } else {
            // Admin messages: RIGHT side, orange bubble
            senderLabel = '<div class="text-xs text-orange-600 mb-1 flex items-center gap-1"><i data-lucide="shield" class="w-3 h-3"></i> Ви</div>';
            bubbleClass = 'bg-orange-500 text-white';
            roundedCorner = 'rounded-br-sm';
        }

        // Safely escape and format message text
        const messageText = message.text || '';
        const formattedText = linkify(escapeHtml(messageText));

        messageDiv.innerHTML = `
            <div class="max-w-[70%]">
                ${senderLabel}
                <div class="${bubbleClass} rounded-2xl px-4 py-2.5 ${roundedCorner} shadow-sm">
                    <p class="text-sm leading-relaxed">${formattedText}</p>
                </div>
                <div class="text-xs text-gray-400 mt-1 ${isOurMessage ? 'text-right' : 'text-left'}">${timeStr}</div>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        if (window.lucide) window.lucide.createIcons();
    }

    window.sendAdminMessage = async function() {
        if (!currentChatId) return;

        const input = document.getElementById('admin-message-input');
        const text = input.value.trim();

        if (!text) return;

        const sendBtn = document.getElementById('admin-send-btn');
        sendBtn.disabled = true;
        input.disabled = true;

        try {
            const messagesRef = window.collection(window.db, 'chats', currentChatId, 'messages');
            await window.addDoc(messagesRef, {
                sender: 'admin',
                senderName: 'Адміністратор',
                text,
                timestamp: window.Timestamp.now(),
                read: false,
                type: 'text'
            });

            // Update chat document
            const chatRef = window.doc(window.db, 'chats', currentChatId);
            await window.updateDoc(chatRef, {
                lastMessage: text,
                lastMessageTime: window.Timestamp.now()
            });

            input.value = '';

        } catch (error) {
            console.error('💬 Error sending message:', error);
            alert('Помилка відправки повідомлення');
        } finally {
            sendBtn.disabled = false;
            input.disabled = false;
            input.focus();
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // 🤖 AI MODE
    // ═══════════════════════════════════════════════════════════════════
    
    window.toggleAIMode = async function(enabled) {
        if (!currentChatId) return;

        try {
            const chatRef = window.doc(window.db, 'chats', currentChatId);
            await window.updateDoc(chatRef, {
                aiMode: enabled
            });

            if (CONFIG.DEBUG) console.log('💬 AI Mode:', enabled ? 'ON' : 'OFF');

        } catch (error) {
            console.error('💬 Error toggling AI mode:', error);
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // ⚙️ SETTINGS
    // ═══════════════════════════════════════════════════════════════════
    
    function loadChatSettings() {
        const settingsRef = window.doc(window.db, 'settings', 'chat_config');
        
        window.onSnapshot(settingsRef, async (doc) => {
            if (doc.exists()) {
                const settings = doc.data();
                await renderChatSettings(settings);
            } else {
                // Create default settings
                await createDefaultChatSettings();
            }
        });
    }

    async function createDefaultChatSettings() {
        const settingsRef = window.doc(window.db, 'settings', 'chat_config');
        await window.setDoc(settingsRef, {
            enabled: true,
            enabledPages: [
                '/',
                '/index.html',
                '/category.html',
                '/product.html',
                '/checkout.html',
                '/cart.html'
            ],
            welcomeMessage: 'Привіт! 👋 Чим можу допомогти?',
            aiEnabled: true
        });
    }

    async function renderChatSettings(settings) {
        const container = document.getElementById('chat-settings-container');
        if (!container) return;

        // Load pages and categories from Firestore database
        let allPages = [];
        let loadedFromDB = false;
        let stats = { pages: 0, categories: 0 };
        
        try {
            // Load from 'pages' collection
            const pagesSnapshot = await window.getDocs(window.collection(window.db, 'pages'));
            pagesSnapshot.forEach((doc) => {
                const pageData = doc.data();
                const pagePath = pageData.path || pageData.slug || '';
                const pageTitle = pageData.title || pageData.name || pagePath;
                
                if (pagePath) {
                    allPages.push({
                        slug: pagePath,
                        title: `📄 ${pageTitle}`,
                        type: 'page'
                    });
                    stats.pages++;
                    loadedFromDB = true;
                }
            });
            
            // Load from 'categories' collection
            const categoriesSnapshot = await window.getDocs(window.collection(window.db, 'categories'));
            categoriesSnapshot.forEach((doc) => {
                const catData = doc.data();
                const catPath = catData.path || catData.slug || `/category.html?cat=${doc.id}`;
                const catTitle = catData.title || catData.name || doc.id;
                
                if (catPath) {
                    allPages.push({
                        slug: catPath,
                        title: `📁 ${catTitle}`,
                        type: 'category'
                    });
                    stats.categories++;
                    loadedFromDB = true;
                }
            });
            
            // Sort: pages first, then categories
            allPages.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'page' ? -1 : 1;
                return a.title.localeCompare(b.title);
            });
            
            // Add fallback pages if database is empty
            if (allPages.length === 0) {
                allPages = [
                    { slug: '/', title: '📄 Головна', type: 'page' },
                    { slug: '/index.html', title: '📄 Головна (index.html)', type: 'page' },
                    { slug: '/category.html', title: '📁 Всі категорії', type: 'page' },
                    { slug: '/product.html', title: '📄 Сторінка товару', type: 'page' },
                    { slug: '/checkout.html', title: '📄 Оформлення замовлення', type: 'page' },
                    { slug: '/cart.html', title: '📄 Кошик', type: 'page' },
                    { slug: '/thank-you.html', title: '📄 Дякуємо за замовлення', type: 'page' }
                ];
            }
            
            if (CONFIG.DEBUG) console.log('💬 Loaded pages/categories:', stats, 'Total:', allPages.length);
            
        } catch (error) {
            console.error('💬 Error loading pages:', error);
            
            // Fallback to default pages
            allPages = [
                { slug: '/', title: '📄 Головна', type: 'page' },
                { slug: '/index.html', title: '📄 Головна (index.html)', type: 'page' },
                { slug: '/category.html', title: '📁 Всі категорії', type: 'page' },
                { slug: '/product.html', title: '📄 Сторінка товару', type: 'page' },
                { slug: '/checkout.html', title: '📄 Оформлення замовлення', type: 'page' },
                { slug: '/cart.html', title: '📄 Кошик', type: 'page' },
                { slug: '/thank-you.html', title: '📄 Дякуємо за замовлення', type: 'page' }
            ];
        }

        // Get current enabledPages array
        const enabledPages = settings.enabledPages || [];

        container.innerHTML = `
            <div class="space-y-6">
                <!-- General Settings -->
                <div class="bg-white p-6 rounded-xl border border-gray-200">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Загальні налаштування</h3>
                    
                    <div class="space-y-4">
                        <label class="flex items-center gap-3">
                            <input type="checkbox" 
                                   id="chat-enabled-toggle"
                                   ${settings.enabled ? 'checked' : ''}
                                   onchange="toggleChatEnabled(this.checked)"
                                   class="w-5 h-5 text-orange-600 rounded">
                            <span class="font-medium text-gray-900">Увімкнути чат на сайті</span>
                        </label>
                    </div>
                </div>

                <!-- AI Assistant Settings -->
                <div class="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border-2 border-purple-200">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">🤖 ШІ-асистент (Gemini 2.0 Flash)</h3>
                            <p class="text-sm text-gray-600">Автоматичні відповіді від штучного інтелекту</p>
                        </div>
                    </div>
                    
                    <div class="space-y-4">
                        <!-- AI Enable Toggle -->
                        <label class="flex items-center gap-3 p-4 bg-white rounded-lg border border-purple-200">
                            <input type="checkbox" 
                                   id="ai-enabled-toggle"
                                   ${settings.aiEnabled ? 'checked' : ''}
                                   class="w-5 h-5 text-purple-600 rounded">
                            <div class="flex-1">
                                <span class="font-bold text-gray-900">Увімкнути ШІ-асистента</span>
                                <p class="text-xs text-gray-600 mt-1">ШІ буде автоматично відповідати на повідомлення клієнтів</p>
                            </div>
                        </label>
                        
                        <!-- AI System Prompt -->
                        <div class="bg-white p-4 rounded-lg border border-purple-200">
                            <label class="block">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="font-bold text-gray-900">📝 Інструкції для ШІ (System Prompt)</span>
                                    <span class="text-xs text-gray-500">Опишіть поведінку асистента</span>
                                </div>
                                <textarea 
                                    id="ai-system-prompt"
                                    rows="6"
                                    placeholder="Приклад: Ти корисний асистент інтернет-магазину. Відповідай дружньо українською мовою. Допомагай з вибором товарів, питаннями доставки та оплати. Будь ввічливим та професійним..."
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
                                >${settings.aiSystemPrompt || 'Ти корисний асистент інтернет-магазину latiao.club. Відповідай дружньо українською мовою. Допомагай клієнтам з питаннями про товари, доставку, оплату. Будь ввічливим та професійним.'}</textarea>
                                <p class="text-xs text-gray-500 mt-2">💡 Порада: Будьте конкретними - опишіть тон спілкування, обмеження, типові питання</p>
                            </label>
                        </div>
                        
                        <!-- AI Response Delay Info -->
                        <div class="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <div class="flex items-start gap-2">
                                <svg class="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                                </svg>
                                <div class="text-sm text-purple-900">
                                    <strong>Логіка роботи ШІ:</strong> Асистент відповідає через 2-3 секунди після повідомлення клієнта. Якщо адміністратор відповість першим протягом 10 секунд - ШІ не втручається.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Active Pages -->
                <div class="bg-white p-6 rounded-xl border border-gray-200">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">Активні сторінки та категорії</h3>
                            <p class="text-sm text-gray-600 mt-1">Виберіть де буде відображатися віджет чату</p>
                        </div>
                        <button 
                            onclick="selectAllPages(true)"
                            class="text-sm text-orange-600 hover:text-orange-700 font-medium"
                        >
                            Вибрати всі
                        </button>
                    </div>
                    
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <div class="flex items-start gap-2">
                            <svg class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                            </svg>
                            <div class="text-sm">
                                <span class="font-medium text-blue-900">Джерело даних:</span>
                                <span class="text-blue-700">
                                    ${loadedFromDB 
                                        ? `📊 Завантажено: ${stats.pages} сторінок + ${stats.categories} категорій з Firestore` 
                                        : `⚠️ Використовуються дефолтні сторінки (колекції "pages" та "categories" порожні)`
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="space-y-2 max-h-[400px] overflow-y-auto" id="pages-list">
                        ${allPages.map(page => `
                            <label class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition-all">
                                <input type="checkbox" 
                                       class="page-checkbox"
                                       value="${page.slug}"
                                       ${enabledPages.includes(page.slug) ? 'checked' : ''}
                                       onchange="handlePageToggle(this.value, this.checked)"
                                       class="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500">
                                <div class="flex-1">
                                    <div class="font-medium text-gray-900">${page.title}</div>
                                    <div class="text-xs text-gray-500 mt-0.5">${page.slug}</div>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                    
                    <div class="mt-4 pt-4 border-t border-gray-200">
                        <div class="flex items-center justify-between text-sm mb-4">
                            <span class="text-gray-600">
                                Активовано: <span id="active-count" class="font-bold text-orange-600">${enabledPages.length}</span> з ${allPages.length}
                            </span>
                            <button 
                                onclick="selectAllPages(false)"
                                class="text-gray-500 hover:text-gray-700"
                            >
                                Очистити
                            </button>
                        </div>
                        
                        <!-- Save Button -->
                        <button 
                            onclick="saveChatSettings()"
                            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
                            </svg>
                            <span>💾 Зберегти налаштування чату</span>
                        </button>
                        
                        <!-- Success/Error Message -->
                        <div id="save-message" class="mt-3 hidden"></div>
                    </div>
                </div>
            </div>
        `;
    }

    // Save all chat settings at once
    window.saveChatSettings = async function() {
        const saveBtn = event.target;
        const messageDiv = document.getElementById('save-message');
        
        try {
            // Disable button during save
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="animate-pulse">⏳ Збереження...</span>';
            
            // Collect all settings
            const enabled = document.getElementById('chat-enabled-toggle')?.checked || false;
            const checkboxes = document.querySelectorAll('.page-checkbox:checked');
            const enabledPages = Array.from(checkboxes).map(cb => cb.value);
            
            // Collect AI settings
            const aiEnabled = document.getElementById('ai-enabled-toggle')?.checked || false;
            const aiSystemPrompt = document.getElementById('ai-system-prompt')?.value || 'Ти корисний асистент інтернет-магазину. Відповідай дружньо українською мовою.';
            
            // Save to Firestore
            const settingsRef = window.doc(window.db, 'settings', 'chat_config');
            await window.setDoc(settingsRef, {
                enabled: enabled,
                enabledPages: enabledPages,
                welcomeMessage: 'Привіт! 👋 Чим можу допомогти?',
                aiEnabled: aiEnabled,
                aiSystemPrompt: aiSystemPrompt,
                lastUpdated: window.Timestamp.now()
            }, { merge: true });
            
            // Show success message
            messageDiv.className = 'mt-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center gap-2';
            messageDiv.innerHTML = `
                <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <div>
                    <strong>✅ Успішно збережено!</strong><br>
                    <span class="text-sm">Чат ${enabled ? 'увімкнено' : 'вимкнено'} на ${enabledPages.length} сторінках</span><br>
                    <span class="text-sm">🤖 ШІ-асистент: ${aiEnabled ? '✅ Активний' : '❌ Вимкнений'}</span>
                </div>
            `;
            
            if (CONFIG.DEBUG) console.log('💬 Settings saved:', { enabled, enabledPages });
            
            // Hide message after 5 seconds
            setTimeout(() => {
                messageDiv.classList.add('hidden');
            }, 5000);
            
        } catch (error) {
            console.error('💬 Error saving settings:', error);
            
            // Show error message
            messageDiv.className = 'mt-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-2';
            messageDiv.innerHTML = `
                <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                <div>
                    <strong>❌ Помилка збереження!</strong><br>
                    <span class="text-sm">${error.message}</span><br>
                    <span class="text-xs text-red-600">Перевірте Firestore Rules для settings/chat_config</span>
                </div>
            `;
        } finally {
            // Re-enable button
            saveBtn.disabled = false;
            saveBtn.innerHTML = `
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
                </svg>
                <span>💾 Зберегти налаштування чату</span>
            `;
        }
    };
    
    // Keep for backwards compatibility (now just triggers save)
    window.toggleChatEnabled = async function(enabled) {
        if (CONFIG.DEBUG) console.log('💬 Chat enabled toggle:', enabled);
    };

    // Handle individual page toggle
    window.handlePageToggle = async function(pageSlug, isEnabled) {
        try {
            const settingsRef = window.doc(window.db, 'settings', 'chat_config');
            const docSnap = await window.getDoc(settingsRef);
            const settings = docSnap.data();
            
            let enabledPages = settings.enabledPages || [];
            
            if (isEnabled && !enabledPages.includes(pageSlug)) {
                enabledPages.push(pageSlug);
            } else if (!isEnabled) {
                enabledPages = enabledPages.filter(p => p !== pageSlug);
            }

            await window.updateDoc(settingsRef, { enabledPages });
            
            // Update counter
            updateActiveCount(enabledPages.length);
            
            if (CONFIG.DEBUG) console.log('💬 Enabled pages updated:', enabledPages);

        } catch (error) {
            console.error('💬 Error updating enabled pages:', error);
        }
    };

    // Select/Deselect all pages
    window.selectAllPages = async function(selectAll) {
        try {
            const checkboxes = document.querySelectorAll('.page-checkbox');
            const settingsRef = window.doc(window.db, 'settings', 'chat_config');
            
            let enabledPages = [];
            
            if (selectAll) {
                // Get all page slugs
                checkboxes.forEach(checkbox => {
                    checkbox.checked = true;
                    enabledPages.push(checkbox.value);
                });
            } else {
                // Uncheck all
                checkboxes.forEach(checkbox => {
                    checkbox.checked = false;
                });
                enabledPages = [];
            }

            await window.updateDoc(settingsRef, { enabledPages });
            updateActiveCount(enabledPages.length);
            
            if (CONFIG.DEBUG) console.log('💬 All pages', selectAll ? 'selected' : 'deselected');

        } catch (error) {
            console.error('💬 Error selecting all pages:', error);
        }
    };

    // Update active count display
    function updateActiveCount(count) {
        const counter = document.getElementById('active-count');
        if (counter) {
            counter.textContent = count;
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🎮 EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════════
    
    function setupEventListeners() {
        // Send message on Enter
        const input = document.getElementById('admin-message-input');
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendAdminMessage();
                }
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🔧 UTILITIES
    // ═══════════════════════════════════════════════════════════════════
    
    async function markChatAsRead(chatId) {
        try {
            const chatRef = window.doc(window.db, 'chats', chatId);
            await window.updateDoc(chatRef, {
                unreadCount: 0
            });
        } catch (error) {
            console.error('💬 Error marking chat as read:', error);
        }
    }

    function updateUnreadBadge(count) {
        const badge = document.getElementById('chat-unread-badge');
        if (!badge) return;

        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    function formatTimestamp(timestamp) {
        if (!timestamp) return '';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Щойно';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' хв тому';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' год тому';
        
        return date.toLocaleDateString('uk-UA');
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/\n/g, '<br>');
    }

    // Convert URLs in text to clickable links
    function linkify(text) {
        if (!text) return '';
        const urlPattern = /(https?:\/\/[^\s<]+[^\s<.,;:!?"'\]\)])/gi;
        return text.replace(urlPattern, '<a href="$1" target="_blank" class="underline hover:opacity-80">$1</a>');
    }

})();
