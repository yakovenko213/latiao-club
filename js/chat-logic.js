/**
 * 🤖 AI Chat Logic - Gemini 2.0 Flash Integration
 * 
 * This module handles automatic AI responses in the Live Chat system.
 * 
 * Features:
 * - Listens to new messages in real-time
 * - Checks if AI is enabled in settings
 * - Calls Gemini 2.0 Flash API with custom system prompt
 * - Implements smart response delays (2-3 seconds)
 * - Prevents AI responses if admin replies within 10 seconds
 * - Saves AI responses with sender: "ai"
 * 
 * @version 1.0.0
 * @author Senior Full Stack Developer
 */

// ⚙️ Configuration
const CONFIG = {
    GEMINI_API_KEY: "AIzaSyA11Wu1XUxEXXeCz3t_NfOr0ygoEblvbhY", // 🔑 Replace with your actual Gemini API key
    GEMINI_API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
    AI_RESPONSE_DELAY: 2500, // 2.5 seconds (looks natural)
    ADMIN_GRACE_PERIOD: 10000, // 10 seconds for admin to respond
    DEBUG: true
};

// 🎯 Active listeners for each chat
const activeChatListeners = new Map();

// 🎯 Track last message timestamps to prevent duplicate AI responses
const lastProcessedMessages = new Map();

// 🎯 Track admin activity per chat
const adminActivityTimestamps = new Map();

/**
 * 🚀 Initialize AI Chat Logic
 * Waits for Firebase to be ready, then starts listening to all chats
 */
async function initAIChatLogic() {
    if (CONFIG.DEBUG) console.log('🤖 AI Chat Logic: Initializing...');

    // Wait for Firebase
    const firebaseReady = await waitForFirebase();
    if (!firebaseReady) {
        console.error('❌ AI Chat Logic: Firebase not available');
        return;
    }

    if (CONFIG.DEBUG) console.log('✅ AI Chat Logic: Firebase ready');

    // Start monitoring all chats
    startMonitoringChats();
}

/**
 * ⏳ Wait for Firebase to be initialized
 */
async function waitForFirebase() {
    const maxWait = 10000; // 10 seconds
    const startTime = Date.now();

    while (!window.db || !window.collection || !window.onSnapshot) {
        if (Date.now() - startTime > maxWait) {
            return false;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return true;
}

/**
 * 👀 Start monitoring all chats for new messages
 */
function startMonitoringChats() {
    if (CONFIG.DEBUG) console.log('👀 AI Chat Logic: Monitoring all chats...');

    // Listen to all chats collection
    const chatsRef = window.collection(window.db, 'chats');
    
    window.onSnapshot(chatsRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' || change.type === 'modified') {
                const chatId = change.doc.id;
                
                // Start listening to messages in this chat if not already
                if (!activeChatListeners.has(chatId)) {
                    listenToChat(chatId);
                }
            }
        });
    });
}

/**
 * 👂 Listen to messages in a specific chat
 */
function listenToChat(chatId) {
    if (CONFIG.DEBUG) console.log(`👂 AI Chat Logic: Listening to chat ${chatId}`);

    const messagesRef = window.collection(window.db, 'chats', chatId, 'messages');
    const messagesQuery = window.query(messagesRef, window.orderBy('timestamp', 'desc'), window.limit(1));

    const unsubscribe = window.onSnapshot(messagesQuery, async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
                const message = { id: change.doc.id, ...change.doc.data() };
                await handleNewMessage(chatId, message);
            }
        });
    });

    activeChatListeners.set(chatId, unsubscribe);
}

/**
 * 📨 Handle new message arrival
 */
async function handleNewMessage(chatId, message) {
    // Ignore AI's own messages
    if (message.sender === 'ai') {
        if (CONFIG.DEBUG) console.log(`🤖 AI Chat Logic: Ignoring AI message in ${chatId}`);
        return;
    }

    // Ignore admin messages
    if (message.sender === 'admin') {
        if (CONFIG.DEBUG) console.log(`👤 AI Chat Logic: Admin replied in ${chatId}, marking activity`);
        adminActivityTimestamps.set(chatId, Date.now());
        return;
    }

    // Check if we already processed this message
    const messageKey = `${chatId}_${message.id}`;
    if (lastProcessedMessages.has(messageKey)) {
        if (CONFIG.DEBUG) console.log(`⏭️ AI Chat Logic: Already processed ${messageKey}`);
        return;
    }

    if (CONFIG.DEBUG) console.log(`📨 AI Chat Logic: New user message in ${chatId}:`, message.text);

    // Mark as processed
    lastProcessedMessages.set(messageKey, Date.now());

    // Clean old entries (older than 5 minutes)
    cleanOldProcessedMessages();

    // Check AI settings
    const aiSettings = await getAISettings();
    if (!aiSettings || !aiSettings.enabled) {
        if (CONFIG.DEBUG) console.log('🚫 AI Chat Logic: AI is disabled in settings');
        return;
    }

    // Wait for potential admin response
    await new Promise(resolve => setTimeout(resolve, CONFIG.ADMIN_GRACE_PERIOD));

    // Check if admin responded during grace period
    const lastAdminActivity = adminActivityTimestamps.get(chatId);
    const timeSinceMessage = Date.now() - message.timestamp.toMillis();
    
    if (lastAdminActivity && (Date.now() - lastAdminActivity < CONFIG.ADMIN_GRACE_PERIOD)) {
        if (CONFIG.DEBUG) console.log(`👤 AI Chat Logic: Admin already handled ${chatId}, skipping AI`);
        return;
    }

    // Check if there are newer messages (admin might have replied)
    const hasNewerMessages = await checkForNewerMessages(chatId, message.timestamp);
    if (hasNewerMessages) {
        if (CONFIG.DEBUG) console.log(`⏭️ AI Chat Logic: Newer messages found in ${chatId}, skipping AI`);
        return;
    }

    // Generate AI response
    await generateAIResponse(chatId, message, aiSettings);
}

/**
 * 🔍 Check if there are newer messages after the given timestamp
 */
async function checkForNewerMessages(chatId, timestamp) {
    try {
        const messagesRef = window.collection(window.db, 'chats', chatId, 'messages');
        const newerQuery = window.query(
            messagesRef, 
            window.where('timestamp', '>', timestamp),
            window.limit(1)
        );
        
        const snapshot = await window.getDocs(newerQuery);
        return !snapshot.empty;
    } catch (error) {
        console.error('❌ Error checking newer messages:', error);
        return false;
    }
}

/**
 * ⚙️ Get AI settings from Firestore
 */
async function getAISettings() {
    try {
        const settingsRef = window.doc(window.db, 'settings', 'chat_config');
        const settingsDoc = await window.getDoc(settingsRef);
        
        if (!settingsDoc.exists()) {
            if (CONFIG.DEBUG) console.log('⚠️ AI Chat Logic: No chat_config found');
            return null;
        }

        const data = settingsDoc.data();
        return {
            enabled: data.aiEnabled || false,
            systemPrompt: data.aiSystemPrompt || 'Ти корисний асистент інтернет-магазину. Відповідай дружньо українською мовою.'
        };
    } catch (error) {
        console.error('❌ Error fetching AI settings:', error);
        return null;
    }
}

/**
 * 🤖 Generate AI response using Gemini 2.0 Flash
 */
async function generateAIResponse(chatId, userMessage, aiSettings) {
    if (CONFIG.DEBUG) console.log(`🤖 AI Chat Logic: Generating response for ${chatId}...`);

    try {
        // 🎬 Show typing indicator in chat widget
        if (typeof window.showChatTypingIndicator === 'function') {
            window.showChatTypingIndicator('ai');
        }
        
        // Simulate typing delay (2-3 seconds)
        const typingDelay = CONFIG.AI_RESPONSE_DELAY + Math.random() * 1000; // 2.5-3.5 sec
        await new Promise(resolve => setTimeout(resolve, typingDelay));

        // Get recent chat history for context
        const chatHistory = await getChatHistory(chatId, 5); // Last 5 messages

        // Call Gemini API
        const aiResponse = await callGeminiAPI(userMessage.text, chatHistory, aiSettings.systemPrompt);

        if (!aiResponse) {
            console.error('❌ AI Chat Logic: Failed to generate response');
            // Hide typing indicator on error
            if (typeof window.hideChatTypingIndicator === 'function') {
                window.hideChatTypingIndicator();
            }
            return;
        }

        // Save AI response to Firestore (typing indicator will be hidden by realtime listener)
        await saveAIResponse(chatId, aiResponse);

        if (CONFIG.DEBUG) console.log(`✅ AI Chat Logic: Response saved for ${chatId}`);

    } catch (error) {
        console.error('❌ Error generating AI response:', error);
        // Hide typing indicator on error
        if (typeof window.hideChatTypingIndicator === 'function') {
            window.hideChatTypingIndicator();
        }
    }
}

/**
 * 📜 Get recent chat history for context
 */
async function getChatHistory(chatId, limit = 5) {
    try {
        const messagesRef = window.collection(window.db, 'chats', chatId, 'messages');
        const historyQuery = window.query(
            messagesRef,
            window.orderBy('timestamp', 'desc'),
            window.limit(limit)
        );

        const snapshot = await window.getDocs(historyQuery);
        const messages = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            messages.push({
                role: data.sender === 'user' ? 'user' : 'model',
                parts: [{ text: data.text }]
            });
        });

        return messages.reverse(); // Oldest first
    } catch (error) {
        console.error('❌ Error fetching chat history:', error);
        return [];
    }
}

/**
 * 🌐 Call Gemini 2.0 Flash API
 */
async function callGeminiAPI(userMessage, chatHistory, systemPrompt) {
    try {
        // Build request body
        const requestBody = {
            system_instruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: [
                ...chatHistory,
                {
                    role: 'user',
                    parts: [{ text: userMessage }]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024
            }
        };

        // Make API request
        const response = await fetch(`${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Gemini API Error:', response.status, errorText);
            return null;
        }

        const data = await response.json();
        
        // Extract response text
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const text = data.candidates[0].content.parts[0].text;
            return text;
        }

        console.error('❌ Unexpected Gemini API response structure:', data);
        return null;

    } catch (error) {
        console.error('❌ Error calling Gemini API:', error);
        return null;
    }
}

/**
 * 💾 Save AI response to Firestore
 */
async function saveAIResponse(chatId, responseText) {
    try {
        const messagesRef = window.collection(window.db, 'chats', chatId, 'messages');
        
        await window.addDoc(messagesRef, {
            text: responseText,
            sender: 'ai',
            timestamp: window.Timestamp.now(),
            read: false
        });

        // Update chat's lastMessage
        const chatRef = window.doc(window.db, 'chats', chatId);
        await window.updateDoc(chatRef, {
            lastMessage: responseText,
            lastMessageTime: window.Timestamp.now()
        });

    } catch (error) {
        console.error('❌ Error saving AI response:', error);
        throw error;
    }
}

/**
 * 🧹 Clean old processed message entries
 */
function cleanOldProcessedMessages() {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    for (const [key, timestamp] of lastProcessedMessages.entries()) {
        if (timestamp < fiveMinutesAgo) {
            lastProcessedMessages.delete(key);
        }
    }
}

/**
 * 🛑 Cleanup function to stop all listeners
 */
window.stopAIChatLogic = function() {
    if (CONFIG.DEBUG) console.log('🛑 AI Chat Logic: Stopping all listeners...');
    
    for (const [chatId, unsubscribe] of activeChatListeners.entries()) {
        unsubscribe();
        if (CONFIG.DEBUG) console.log(`🛑 Stopped listening to chat ${chatId}`);
    }
    
    activeChatListeners.clear();
    lastProcessedMessages.clear();
    adminActivityTimestamps.clear();
};

// 🚀 Auto-initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAIChatLogic);
} else {
    initAIChatLogic();
}

if (CONFIG.DEBUG) console.log('🤖 AI Chat Logic script loaded');
