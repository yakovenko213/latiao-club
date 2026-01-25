/**
 * ═══════════════════════════════════════════════════════════════════════
 * 💬 ADMIN LIVE CHAT MANAGEMENT SYSTEM
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Manages customer chats with AI assistance
 * Real-time message sync with Firestore
 * 
 * @version 1.0.0
 * @created 2026-01-24
 */

// NOTE: This file assumes Firebase is already initialized in admin.html
// Uses global variables: db, auth, onSnapshot, collection, doc, etc.

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════
    // 🔧 CONFIG
    // ═══════════════════════════════════════════════════════════════════
    
    const CONFIG = {
        DEBUG: true,
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

    // ═══════════════════════════════════════════════════════════════════
    // 🎬 INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════
    
    window.initLiveChat = async function() {
        if (CONFIG.DEBUG) console.log('💬 Initializing Live Chat Management...');
        
        // Wait for Firebase to be available
        await waitForFirebase();
        
        loadChats();
        loadChatSettings();
        setupEventListeners();
    };

    // Wait for Firebase initialization
    async function waitForFirebase() {
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds max
        
        if (CONFIG.DEBUG) console.log('💬 Waiting for Firebase initialization...');
        
        while (typeof window.db === 'undefined' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
            
            if (attempts % 10 === 0 && CONFIG.DEBUG) {
                console.log('💬 Still waiting...', attempts * 100, 'ms', 
                    'window.db:', typeof window.db,
                    'window.collection:', typeof window.collection);
            }
        }
        
        if (typeof window.db === 'undefined') {
            console.error('💬 Firebase initialization timeout after', attempts * 100, 'ms');
            console.error('💬 Available globals:', Object.keys(window).filter(k => k.startsWith('firebase') || k === 'db').join(', '));
            throw new Error('Firebase not available');
        }
        
        if (CONFIG.DEBUG) console.log('✅ Firebase ready after', attempts * 100, 'ms');
    }

    // ═══════════════════════════════════════════════════════════════════
    // 📡 LOAD CHATS
    // ═══════════════════════════════════════════════════════════════════
    
    function loadChats() {
        if (typeof window.db === 'undefined') {
            console.error('💬 Firebase not initialized yet');
            return;
        }

        const chatsRef = window.collection(window.db, 'chats');
        const q = window.query(chatsRef, window.orderBy('lastMessageTime', 'desc'));

        if (chatsUnsubscribe) {
            chatsUnsubscribe();
        }

        chatsUnsubscribe = window.onSnapshot(q, (snapshot) => {
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

            if (CONFIG.DEBUG) console.log('💬 Loaded', chats.length, 'chats, unread:', totalUnread);
        });
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
        if (messagesUnsubscribe) {
            messagesUnsubscribe();
        }

        const messagesRef = window.collection(window.db, 'chats', chatId, 'messages');
        const q = window.query(messagesRef, window.orderBy('timestamp', 'asc'));

        messagesUnsubscribe = window.onSnapshot(q, (snapshot) => {
            const messagesContainer = document.getElementById('chat-messages-container');
            messagesContainer.innerHTML = '';

            snapshot.forEach((doc) => {
                const message = doc.data();
                appendMessage(message);
            });

            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
    }

    function appendMessage(message) {
        const messagesContainer = document.getElementById('chat-messages-container');
        const messageDiv = document.createElement('div');
        
        const isClient = message.sender === 'client';
        const isAI = message.sender === 'ai';
        
        messageDiv.className = `flex ${isClient ? 'justify-end' : 'justify-start'} mb-4`;
        
        const time = message.timestamp?.toDate?.() || new Date();
        const timeStr = time.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

        let senderLabel = '';
        let bubbleClass = '';
        
        if (isClient) {
            bubbleClass = 'bg-blue-500 text-white';
        } else if (isAI) {
            senderLabel = '<div class="text-xs text-purple-600 mb-1 flex items-center gap-1"><i data-lucide="bot" class="w-3 h-3"></i> AI Помічник</div>';
            bubbleClass = 'bg-purple-100 text-gray-900 border border-purple-200';
        } else {
            senderLabel = '<div class="text-xs text-gray-600 mb-1">Ви</div>';
            bubbleClass = 'bg-orange-500 text-white';
        }

        messageDiv.innerHTML = `
            <div class="max-w-[70%]">
                ${senderLabel}
                <div class="${bubbleClass} rounded-2xl px-4 py-2.5 ${isClient ? 'rounded-br-sm' : 'rounded-bl-sm'}">
                    <p class="text-sm leading-relaxed">${linkify(escapeHtml(message.text))}</p>
                </div>
                <div class="text-xs text-gray-400 mt-1 ${isClient ? 'text-right' : 'text-left'}">${timeStr}</div>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        window.lucide.createIcons();
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
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/\n/g, '<br>');
    }

})();
