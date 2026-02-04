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
    CHAT_ICON: 'images/chat-icon.png',
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
        /* ═══════════════════════════════════════════════════════════════
           CHAT WIDGET - PREMIUM DESIGN v4.0 - MOBILE OPTIMIZED
           ═══════════════════════════════════════════════════════════════ */

        #chat-widget-container {
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            z-index: 9999 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
        }

        /* ═══════════════════════════════════════════════════════════════
           FLOATING ACTION BUTTON (FAB) - HIGH VISIBILITY
           ═══════════════════════════════════════════════════════════════ */

        #chat-toggle-btn {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            /* High contrast white background */
            background: #FFFFFF !important;
            /* Vibrant orange border for brand identity */
            border: 3px solid #FF6B35 !important;
            /* Strong floating shadow for depth */
            box-shadow: 
                0 8px 24px rgba(0, 0, 0, 0.25),
                0 4px 8px rgba(255, 107, 53, 0.3),
                0 0 0 4px rgba(255, 255, 255, 0.9) !important;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            /* Padding so image doesn't touch borders */
            padding: 4px;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            position: relative;
            /* Ensure always visible */
            opacity: 1 !important;
            visibility: visible !important;
            /* Entry + attention pulse animation */
            animation: 
                fabEnter 0.5s ease-out,
                fabAttentionPulse 8s ease-in-out 3s infinite;
            /* Touch-friendly */
            min-width: 44px;
            min-height: 44px;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        }

        /* Subtle attention-grabbing pulse every 8 seconds */
        @keyframes fabAttentionPulse {
            0%, 90%, 100% {
                transform: scale(1);
                box-shadow: 
                    0 8px 24px rgba(0, 0, 0, 0.25),
                    0 4px 8px rgba(255, 107, 53, 0.3),
                    0 0 0 4px rgba(255, 255, 255, 0.9);
            }
            93% {
                transform: scale(1.08);
                box-shadow: 
                    0 12px 32px rgba(0, 0, 0, 0.3),
                    0 6px 16px rgba(255, 107, 53, 0.5),
                    0 0 0 6px rgba(255, 107, 53, 0.3);
            }
            96% {
                transform: scale(1.05);
                box-shadow: 
                    0 10px 28px rgba(0, 0, 0, 0.28),
                    0 5px 12px rgba(255, 107, 53, 0.4),
                    0 0 0 5px rgba(255, 107, 53, 0.2);
            }
        }

        /* Touch/Active state for mobile */
        #chat-toggle-btn:active {
            transform: scale(0.92);
            box-shadow: 
                0 4px 12px rgba(0, 0, 0, 0.2),
                0 2px 4px rgba(255, 107, 53, 0.3),
                0 0 0 3px rgba(255, 255, 255, 0.9) !important;
            animation: none; /* Stop pulse on interaction */
        }

        @keyframes fabEnter {
            0% { 
                transform: scale(0); 
                opacity: 0; 
            }
            100% { 
                transform: scale(1); 
                opacity: 1; 
            }
        }

        /* Desktop hover - only on non-touch devices */
        @media (hover: hover) and (pointer: fine) {
            #chat-toggle-btn:hover {
                transform: scale(1.08);
                box-shadow: 
                    0 12px 32px rgba(0, 0, 0, 0.3),
                    0 6px 16px rgba(255, 107, 53, 0.4),
                    0 0 0 5px rgba(255, 107, 53, 0.2) !important;
                animation: none; /* Stop pulse on hover */
            }
            
            #chat-toggle-btn:hover img {
                transform: scale(1.05);
            }
        }

        #chat-toggle-btn img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: 50%;
            transition: transform 0.2s ease;
            /* High quality rendering */
            image-rendering: auto;
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
        }

        /* ═══ NOTIFICATION BADGE ═══ */
        #chat-toggle-btn.has-unread::after {
            content: '';
            position: absolute;
            top: -2px;
            right: -2px;
            width: 20px;
            height: 20px;
            background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
            border-radius: 50%;
            border: 3px solid #FFFFFF;
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4),
                        0 0 0 0 rgba(239, 68, 68, 0.7);
            animation: badgePulse 2s infinite,
                       badgeBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes badgePulse {
            0%, 100% {
                box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4),
                            0 0 0 0 rgba(239, 68, 68, 0.7);
            }
            50% {
                box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4),
                            0 0 0 8px rgba(239, 68, 68, 0);
            }
        }

        @keyframes badgeBounce {
            0% { transform: scale(0); }
            50% { transform: scale(1.3); }
            100% { transform: scale(1); }
        }

        /* With unread count */
        #chat-toggle-btn.has-unread[data-unread]::after {
            content: attr(data-unread);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 700;
            color: white;
        }

        /* ═══════════════════════════════════════════════════════════════
           CHAT WINDOW - RESPONSIVE DESIGN
           ═══════════════════════════════════════════════════════════════ */

        #chat-window {
            position: fixed !important;
            bottom: 100px !important;
            right: 24px !important;
            width: 400px;
            height: 640px;
            max-height: calc(100vh - 140px);
            background: #FFFFFF;
            border-radius: 20px;
            box-shadow: 0 24px 48px rgba(0, 0, 0, 0.15),
                        0 12px 24px rgba(0, 0, 0, 0.12),
                        0 0 1px rgba(0, 0, 0, 0.1);
            display: none;
            flex-direction: column;
            overflow: hidden;
            transform: translateY(20px);
            opacity: 0;
            transition: transform 0.25s ease-out, opacity 0.25s ease-out;
            z-index: 9998 !important;
        }

        /* Mobile: Near full-screen centered */
        @media (max-width: 768px) {
            #chat-window {
                bottom: 5% !important;
                right: 2.5% !important;
                left: 2.5% !important;
                top: auto !important;
                width: 95% !important;
                height: 85vh !important;
                max-height: 85vh !important;
                border-radius: 16px !important;
            }
        }

        /* Very small screens: Full screen */
        @media (max-width: 480px) {
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
            transform: translateY(0);
            opacity: 1;
        }

        /* Body scroll lock when chat is open on mobile */
        body.chat-open {
            overflow: hidden !important;
            position: fixed !important;
            width: 100% !important;
            height: 100% !important;
        }

        /* ═══════════════════════════════════════════════════════════════
           HEADER - GRADIENT WITH BRAND IDENTITY
           ═══════════════════════════════════════════════════════════════ */

        .chat-header {
            background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FFA55C 100%);
            color: white;
            padding: 20px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 12px rgba(255, 107, 53, 0.2),
                        inset 0 -1px 0 rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
        }

        .chat-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, 
                transparent, 
                rgba(255, 255, 255, 0.3), 
                transparent);
            animation: shimmer 3s infinite;
        }

        @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
        }

        .chat-header h3 {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 12px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            position: relative;
            z-index: 1;
        }

        .chat-header h3 span:first-child {
            font-size: 24px;
            animation: iconBounce 2s ease-in-out infinite;
        }

        @keyframes iconBounce {
            0%, 100% { transform: translateY(0) rotate(0); }
            50% { transform: translateY(-4px) rotate(-10deg); }
        }

        .chat-status {
            font-size: 13px;
            opacity: 0.95;
            margin-top: 4px;
            display: flex;
            align-items: center;
            gap: 6px;
            position: relative;
            z-index: 1;
        }

        .chat-status::before {
            content: '';
            display: inline-block;
            width: 8px;
            height: 8px;
            background: #10B981;
            border-radius: 50%;
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            animation: statusPulse 2s infinite;
        }

        @keyframes statusPulse {
            0%, 100% {
                box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            }
            50% {
                box-shadow: 0 0 0 4px rgba(16, 185, 129, 0);
            }
        }

        .chat-close {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            /* Touch-friendly: 44x44px minimum hit area */
            width: 44px;
            height: 44px;
            min-width: 44px;
            min-height: 44px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 22px;
            font-weight: 400;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s ease, background 0.2s ease;
            position: relative;
            z-index: 1;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        }

        /* Desktop hover */
        @media (hover: hover) and (pointer: fine) {
            .chat-close:hover {
                background: rgba(255, 255, 255, 0.35);
                transform: scale(1.1);
            }
        }

        /* Touch/Active state */
        .chat-close:active {
            transform: scale(0.9);
            background: rgba(255, 255, 255, 0.4);
        }

        /* ═══════════════════════════════════════════════════════════════
           MESSAGES AREA - SCROLLABLE CONTENT
           ═══════════════════════════════════════════════════════════════ */

        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 24px 20px;
            background: linear-gradient(to bottom, #F9FAFB 0%, #F3F4F6 100%);
            scroll-behavior: smooth;
        }

        .chat-messages::-webkit-scrollbar {
            width: 6px;
        }

        .chat-messages::-webkit-scrollbar-track {
            background: transparent;
        }

        .chat-messages::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 10px;
            transition: background 0.3s;
        }

        .chat-messages::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.2);
        }

        /* ═══ WELCOME MESSAGE - MINIMAL ═══ */
        .chat-welcome {
            background: #FFFFFF;
            padding: 24px;
            border-radius: 16px;
            text-align: center;
            border: 1px solid #F3F4F6;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            animation: welcomeEnter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes welcomeEnter {
            from {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .chat-welcome h4 {
            margin: 0 0 16px 0;
            color: #1F2937;
            font-size: 20px;
            font-weight: 700;
        }

        .chat-welcome h4 strong {
            color: #EA580C;
        }

        .chat-welcome p {
            margin: 0 0 16px 0;
            color: #4B5563;
            font-size: 14px;
            line-height: 1.7;
            text-align: left;
        }

        .chat-welcome p:last-child {
            margin-bottom: 0;
        }

        .chat-welcome strong {
            color: #EA580C;
            font-weight: 600;
        }

        .chat-welcome .cta {
            margin-top: 16px;
            padding: 12px 16px;
            background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%);
            border-radius: 10px;
            font-size: 13px;
            color: #9A3412;
            font-weight: 500;
        }

        /* ═══════════════════════════════════════════════════════════════
           MESSAGE BUBBLES - WITH AVATARS
           ═══════════════════════════════════════════════════════════════ */

        .chat-message {
            margin-bottom: 20px;
            display: flex;
            gap: 12px;
            animation: messageSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes messageSlideIn {
            from {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        /* CLIENT MESSAGES - RIGHT SIDE */
        .chat-message.client {
            flex-direction: row-reverse;
            justify-content: flex-start;
        }

        /* AI/ADMIN MESSAGES - LEFT SIDE */
        .chat-message.admin,
        .chat-message.ai {
            flex-direction: row;
        }

        /* ═══ AVATARS ═══ */
        .message-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            flex-shrink: 0;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border: 2px solid white;
            background: linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }

        .message-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .message-avatar.avatar-fallback {
            font-size: 20px;
        }

        .chat-message.ai .message-avatar {
            background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
            border-color: #EDE9FE;
        }

        .chat-message.admin .message-avatar {
            background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
            border-color: #DBEAFE;
        }

        .chat-message.client .message-avatar {
            background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
            border-color: #FED7AA;
        }

        /* ═══ MESSAGE CONTENT ═══ */
        .message-content {
            max-width: 70%;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .message-bubble {
            padding: 12px 16px;
            border-radius: 16px;
            font-size: 14px;
            line-height: 1.6;
            word-wrap: break-word;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            position: relative;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .message-bubble:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        /* Chat Links - Clickable URLs */
        .chat-link {
            color: inherit;
            text-decoration: underline;
            font-weight: 600;
            transition: opacity 0.2s;
            word-break: break-all;
        }

        .chat-link:hover {
            opacity: 0.8;
            text-decoration: underline;
        }

        /* Client messages - white links */
        .chat-message.client .chat-link {
            color: #FFFFFF;
            text-decoration-color: rgba(255, 255, 255, 0.6);
        }

        /* AI/Admin messages - brand color links */
        .chat-message.ai .chat-link,
        .chat-message.admin .chat-link {
            color: #FF6B35;
            text-decoration-color: rgba(255, 107, 53, 0.5);
        }

        /* Client bubble - Orange gradient */
        .chat-message.client .message-bubble {
            background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
            color: white;
            border-bottom-right-radius: 4px;
        }

        /* AI bubble - Purple gradient */
        .chat-message.ai .message-bubble {
            background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
            color: #1F2937;
            border: 1px solid #D1D5DB;
            border-bottom-left-radius: 4px;
        }

        .chat-message.ai .message-bubble::before {
            content: '🤖';
            position: absolute;
            top: -8px;
            left: 8px;
            font-size: 10px;
            background: #8B5CF6;
            padding: 2px 6px;
            border-radius: 8px;
            color: white;
        }

        /* Admin bubble - Blue gradient */
        .chat-message.admin .message-bubble {
            background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
            color: #1F2937;
            border: 1px solid #D1D5DB;
            border-bottom-left-radius: 4px;
        }

        .message-time {
            font-size: 11px;
            color: #9CA3AF;
            padding: 0 4px;
        }

        .chat-message.client .message-time {
            text-align: right;
        }

        /* ═══════════════════════════════════════════════════════════════
           TYPING INDICATOR - SPICY LATIAO THEME 🌶️
           ═══════════════════════════════════════════════════════════════ */

        .typing-indicator {
            display: flex;
            gap: 12px;
            align-items: flex-start;
            margin-bottom: 20px;
            animation: typingSlideIn 0.3s ease-out;
        }

        @keyframes typingSlideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .typing-indicator .message-avatar {
            background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
            border-color: #FED7AA;
        }

        .typing-indicator .typing-content {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .typing-indicator .message-bubble {
            background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%);
            border: 1px solid #FB923C;
            border-radius: 16px;
            border-bottom-left-radius: 4px;
            padding: 14px 18px;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 2px 8px rgba(251, 146, 60, 0.15);
        }

        .typing-dots {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .typing-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: linear-gradient(135deg, #FF6B35 0%, #EA580C 100%);
            animation: spicyBounce 1.2s infinite ease-in-out;
            box-shadow: 0 2px 4px rgba(234, 88, 12, 0.3);
        }

        .typing-dot:nth-child(1) { animation-delay: 0s; }
        .typing-dot:nth-child(2) { animation-delay: 0.15s; }
        .typing-dot:nth-child(3) { animation-delay: 0.3s; }

        @keyframes spicyBounce {
            0%, 60%, 100% {
                transform: translateY(0) scale(1);
                opacity: 0.5;
            }
            30% {
                transform: translateY(-8px) scale(1.15);
                opacity: 1;
                background: linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%);
            }
        }

        .typing-label {
            font-size: 12px;
            color: #9A3412;
            font-weight: 500;
            margin-left: 4px;
            opacity: 0.9;
        }

        .typing-indicator .typing-status {
            font-size: 11px;
            color: #C2410C;
            padding-left: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .typing-indicator .typing-status::before {
            content: '🌶️';
            font-size: 10px;
        }

        /* ═══════════════════════════════════════════════════════════════
           OPTIMISTIC UI - PENDING STATE
           ═══════════════════════════════════════════════════════════════ */

        .message-pending {
            opacity: 0.7;
        }

        .message-pending .message-bubble {
            position: relative;
        }

        .message-pending .message-bubble::after {
            content: '';
            position: absolute;
            right: -24px;
            top: 50%;
            transform: translateY(-50%);
            width: 14px;
            height: 14px;
            border: 2px solid #FF6B35;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            to { transform: translateY(-50%) rotate(360deg); }
        }

        /* ═══════════════════════════════════════════════════════════════
           INPUT AREA - MODERN DESIGN
           ═══════════════════════════════════════════════════════════════ */

        .chat-input-area {
            padding: 20px;
            background: white;
            border-top: 1px solid #E5E7EB;
            box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.03);
            display: flex;
            gap: 12px;
            align-items: flex-end;
        }

        .chat-input {
            flex: 1;
            padding: 12px 16px;
            border: 2px solid #E5E7EB;
            border-radius: 12px;
            font-size: 14px;
            resize: none;
            font-family: inherit;
            background: #F9FAFB;
            transition: all 0.3s;
            max-height: 120px;
            line-height: 1.5;
        }

        .chat-input:focus {
            outline: none;
            border-color: #FF6B35;
            background: white;
            box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.1),
                        0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .chat-input::placeholder {
            color: #9CA3AF;
        }

        .chat-send-btn {
            padding: 12px 20px;
            background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
        }

        .chat-send-btn::before {
            content: '➤';
            font-size: 16px;
            transition: transform 0.3s;
        }

        .chat-send-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(255, 107, 53, 0.4);
        }

        .chat-send-btn:hover:not(:disabled)::before {
            transform: translateX(4px);
        }

        .chat-send-btn:active:not(:disabled) {
            transform: translateY(0);
            box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
        }

        .chat-send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            box-shadow: none;
        }

        /* ═══════════════════════════════════════════════════════════════
           UTILITY ANIMATIONS
           ═══════════════════════════════════════════════════════════════ */

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
            20%, 40%, 60%, 80% { transform: translateX(8px); }
        }

        @keyframes fadeOut {
            from { 
                opacity: 1; 
                transform: scale(1); 
            }
            to { 
                opacity: 0; 
                transform: scale(0.9); 
            }
        }

        /* ═══════════════════════════════════════════════════════════════
           RESPONSIVE & MOBILE OPTIMIZATIONS
           ═══════════════════════════════════════════════════════════════ */

        /* Container safe area padding */
        #chat-widget-container {
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            z-index: 9999 !important;
        }

        @media (max-width: 768px) {
            #chat-widget-container {
                bottom: 20px !important;
                right: 20px !important;
            }

            /* Larger FAB on mobile for maximum visibility */
            #chat-toggle-btn {
                width: 65px;
                height: 65px;
                padding: 5px;
                border-width: 3px;
                /* Even stronger shadow on mobile */
                box-shadow: 
                    0 10px 28px rgba(0, 0, 0, 0.3),
                    0 5px 10px rgba(255, 107, 53, 0.35),
                    0 0 0 4px rgba(255, 255, 255, 1) !important;
            }

            .chat-header {
                padding: 16px 16px;
            }

            .chat-header h3 {
                font-size: 18px;
                gap: 8px;
            }

            .chat-messages {
                padding: 16px 12px;
            }

            .message-content {
                max-width: 85%;
            }

            .chat-input-area {
                padding: 12px;
                gap: 8px;
            }

            .chat-input {
                padding: 12px 14px;
                font-size: 16px; /* Prevents iOS zoom on focus */
            }

            .chat-send-btn {
                padding: 12px 16px;
                min-width: 44px;
                min-height: 44px;
            }

            .chat-send-btn span {
                display: none; /* Hide text on mobile */
            }

            .chat-send-btn::before {
                content: '➔';
                font-size: 18px;
            }
        }

        /* Safe area for devices with notch/home indicator */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
            @media (max-width: 768px) {
                .chat-input-area {
                    padding-bottom: calc(12px + env(safe-area-inset-bottom));
                }

                #chat-widget-container {
                    bottom: calc(20px + env(safe-area-inset-bottom)) !important;
                    right: calc(20px + env(safe-area-inset-right)) !important;
                }
            }
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
            return false;
        }
        
        const config = configDoc.data();
        
        // Step 2: Check global enabled flag
        if (!config.enabled) {
            console.error('❌ Chat is GLOBALLY DISABLED');
            return false;
        }
        
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
                    <div class="chat-status" id="chat-status">Зараз онлайн</div>
                </div>
                <button class="chat-close" aria-label="Закрити чат">✕</button>
            </div>
            
            <div class="chat-messages" id="chat-messages">
                <div class="chat-welcome">
                    <h4><strong>Latiao Snack</strong> 🌶️</h4>
                    <p>Вітаємо! Я ваш <strong>ШІ-помічник</strong>. Допоможу зорієнтуватися по сайту, розповім про умови доставки або відповім на ваші запитання щодо замовлень.</p>
                    <div class="cta">⚡ Напишіть ваше запитання нижче, і я миттєво вам допоможу!</div>
                </div>
            </div>
            
            <div class="chat-input-area">
                <textarea 
                    id="chat-input" 
                    class="chat-input" 
                    placeholder="Напишіть ваше повідомлення..."
                    rows="1"
                    maxlength="1000"></textarea>
                <button id="chat-send-btn" class="chat-send-btn" aria-label="Надіслати повідомлення">
                    Надіслати
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

    // Helper: Check if mobile device
    const isMobile = () => window.innerWidth <= 768;

    // Helper: Lock body scroll on mobile
    const lockBodyScroll = () => {
        if (isMobile()) {
            document.body.classList.add('chat-open');
            document.body.dataset.scrollY = window.scrollY;
        }
    };

    // Helper: Unlock body scroll
    const unlockBodyScroll = () => {
        document.body.classList.remove('chat-open');
        const scrollY = document.body.dataset.scrollY;
        if (scrollY) {
            window.scrollTo(0, parseInt(scrollY));
        }
    };

    // Toggle chat window
    toggleBtn.addEventListener('click', () => {
        console.log('🖱️ Toggle button clicked');
        const isShowing = chatWindow.classList.toggle('show');
        console.log('   Window now:', isShowing ? 'VISIBLE' : 'HIDDEN');
        
        if (isShowing) {
            lockBodyScroll();
            // Focus input after animation (slight delay for mobile keyboard)
            setTimeout(() => input.focus(), 300);
            toggleBtn.classList.remove('has-unread');
            // Scroll messages to bottom
            const messagesContainer = document.getElementById('chat-messages');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        } else {
            unlockBodyScroll();
        }
    });

    // Close chat
    closeBtn.addEventListener('click', () => {
        console.log('🖱️ Close button clicked');
        chatWindow.classList.remove('show');
        unlockBodyScroll();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && chatWindow.classList.contains('show')) {
            chatWindow.classList.remove('show');
            unlockBodyScroll();
        }
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
    
    // Auto-resize textarea as user types
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });
    
    console.log('✅ Event listeners attached');
}

// ═══════════════════════════════════════════════════════════════════
// 💬 SEND MESSAGE
// ═══════════════════════════════════════════════════════════════════

let currentChatId = null;

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const text = input.value.trim();
    
    // Prevent empty messages
    if (!text) {
        console.log('⚠️ Empty message, not sending');
        // Shake animation for empty input
        input.style.animation = 'shake 0.3s';
        setTimeout(() => { input.style.animation = ''; }, 300);
        return;
    }
    
    console.log('💬 Sending message:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    
    // 🚀 OPTIMISTIC UI: Clear input and show message IMMEDIATELY
    const messageText = text;
    input.value = '';
    input.style.height = 'auto'; // Reset textarea height
    
    // Disable send button temporarily
    sendBtn.disabled = true;
    
    // Add message to UI instantly with pending state
    const messageId = 'pending_' + Date.now();
    addMessageToUI('client', messageText, null, messageId, true);
    
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
                lastMessage: messageText,
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
            text: messageText,
            timestamp: Timestamp.now(),
            read: false,
            type: 'text'
        });

        // Update chat document
        const chatRef = doc(db, 'chats', currentChatId);
        const chatDoc = await getDoc(chatRef);
        const currentUnread = chatDoc.data()?.unreadCount || 0;
        
        await updateDoc(chatRef, {
            lastMessage: messageText,
            lastMessageTime: Timestamp.now(),
            activePage: window.location.pathname,
            unreadCount: currentUnread + 1
        });

        // Remove pending state from message
        const pendingMessage = document.getElementById(messageId);
        if (pendingMessage) {
            pendingMessage.classList.remove('message-pending');
            pendingMessage.removeAttribute('id');
        }
        
        // Show typing indicator while waiting for AI response
        showTypingIndicator();
        
        console.log('✅ Message sent successfully');
        
        // 🤖 Call AI Cloud Function for automatic response
        try {
            console.log('🤖 Requesting AI response...');
            const aiResponse = await fetch('https://us-central1-my-magazin-81c96.cloudfunctions.net/aiChatResponder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: currentChatId,
                    messageText: messageText
                })
            });
            const aiResult = await aiResponse.json();
            console.log('🤖 AI response result:', aiResult);
            
            if (aiResult.skipped) {
                console.log('🤖 AI skipped:', aiResult.reason);
            }
        } catch (aiError) {
            console.error('🤖 AI request failed:', aiError);
        } finally {
            hideTypingIndicator();
        }

    } catch (error) {
        console.error('❌ Error sending message:', error);
        
        // Remove failed message from UI
        const failedMessage = document.getElementById(messageId);
        if (failedMessage) {
            failedMessage.style.animation = 'shake 0.5s';
            setTimeout(() => failedMessage.remove(), 500);
        }
        
        // Restore message to input
        input.value = messageText;
        alert('Помилка при відправці повідомлення. Спробуйте ще раз.');
    } finally {
        // Re-enable send button
        sendBtn.disabled = false;
        input.focus();
    }
}

// ═══════════════════════════════════════════════════════════════════
// 🔗 LINKIFY - MAKE URLS CLICKABLE
// ═══════════════════════════════════════════════════════════════════

function linkify(text) {
    // Regex to detect URLs (http, https, www)
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
    
    // Replace URLs with clickable links
    return text.replace(urlRegex, (url) => {
        // Add https:// if URL starts with www
        let href = url;
        if (url.startsWith('www.')) {
            href = 'https://' + url;
        }
        
        // Create link with target="_blank" and security attributes
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="chat-link">${url}</a>`;
    });
}

// ═══════════════════════════════════════════════════════════════════
// 🆔 GET/CREATE USER ID
// ═══════════════════════════════════════════════════════════════════

function getUserId() {
    // Always generate a new session ID on page load
    // This ensures chat history is cleared for the client on refresh
    // but all messages are still saved in Firestore for admin panel
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    console.log('🆔 Generated new session ID:', sessionId);
    return sessionId;
}

// ═══════════════════════════════════════════════════════════════════
// 📨 ADD MESSAGE TO UI
// ═══════════════════════════════════════════════════════════════════

function addMessageToUI(sender, text, timestamp, messageId = null, isPending = false) {
    const messagesContainer = document.getElementById('chat-messages');
    
    // Remove welcome message if exists
    const welcome = messagesContainer.querySelector('.chat-welcome');
    if (welcome) {
        welcome.style.animation = 'fadeOut 0.3s';
        setTimeout(() => welcome.remove(), 300);
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    // Add ID and pending class for optimistic UI
    if (messageId) {
        messageDiv.id = messageId;
    }
    if (isPending) {
        messageDiv.classList.add('message-pending');
    }
    
    // 👤 Avatar
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    
    // Set avatar based on sender type
    if (sender === 'ai') {
        avatar.innerHTML = '🤖'; // Robot emoji for AI
    } else if (sender === 'admin') {
        avatar.innerHTML = '👨‍💼'; // Admin emoji
    } else if (sender === 'client') {
        // Client avatar with image and fallback
        const img = document.createElement('img');
        img.src = './images/client-avatar.png';
        img.alt = 'Клієнт';
        img.onerror = function() {
            // Fallback to emoji if image fails to load
            avatar.innerHTML = '👤';
            avatar.classList.add('avatar-fallback');
        };
        avatar.appendChild(img);
    }
    
    messageDiv.appendChild(avatar);
    
    // 💬 Message Content
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    // Use innerHTML with linkify to make URLs clickable
    bubble.innerHTML = linkify(text);
    
    content.appendChild(bubble);
    
    if (timestamp) {
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = new Date(timestamp.seconds * 1000).toLocaleTimeString('uk-UA', {
            hour: '2-digit',
            minute: '2-digit'
        });
        content.appendChild(timeDiv);
    }
    
    messageDiv.appendChild(content);
    messagesContainer.appendChild(messageDiv);
    
    // Smooth scroll to bottom
    scrollToBottom();
}

// ═══════════════════════════════════════════════════════════════════
// 📜 SMOOTH SCROLL TO BOTTOM
// ═══════════════════════════════════════════════════════════════════

function scrollToBottom(smooth = true) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    
    if (smooth) {
        messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: 'smooth'
        });
    } else {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// ═══════════════════════════════════════════════════════════════════
// ⌨️ TYPING INDICATOR
// ═══════════════════════════════════════════════════════════════════

let typingIndicatorElement = null;

function showTypingIndicator() {
    // Don't show multiple indicators
    if (typingIndicatorElement) return;
    
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    
    typingIndicatorElement = document.createElement('div');
    typingIndicatorElement.className = 'typing-indicator';
    typingIndicatorElement.id = 'typing-indicator';
    
    // 🤖 AI Avatar
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = '🤖';
    typingIndicatorElement.appendChild(avatar);
    
    // Content wrapper
    const content = document.createElement('div');
    content.className = 'typing-content';
    
    // Message bubble with dots and label
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    // Dots container
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'typing-dots';
    
    // Create three bouncing dots
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        dot.className = 'typing-dot';
        dotsContainer.appendChild(dot);
    }
    
    bubble.appendChild(dotsContainer);
    
    // Label
    const label = document.createElement('span');
    label.className = 'typing-label';
    label.textContent = 'ШІ-помічник готує відповідь...';
    bubble.appendChild(label);
    
    content.appendChild(bubble);
    
    // Status text
    const status = document.createElement('div');
    status.className = 'typing-status';
    status.textContent = 'Зазвичай відповідає за кілька секунд';
    content.appendChild(status);
    
    typingIndicatorElement.appendChild(content);
    messagesContainer.appendChild(typingIndicatorElement);
    
    // Smooth scroll to show indicator
    scrollToBottom();
    
    console.log('⌨️ Typing indicator shown');
}

function hideTypingIndicator() {
    if (typingIndicatorElement) {
        typingIndicatorElement.style.animation = 'fadeOut 0.2s';
        setTimeout(() => {
            if (typingIndicatorElement) {
                typingIndicatorElement.remove();
                typingIndicatorElement = null;
            }
        }, 200);
        console.log('⌨️ Typing indicator hidden');
    }
}

// Expose globally for chat-logic.js to use
window.showChatTypingIndicator = showTypingIndicator;
window.hideChatTypingIndicator = hideTypingIndicator;

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
                    // Hide typing indicator when actual message arrives
                    hideTypingIndicator();
                    
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
        const shouldLoad = await checkIfPageEnabled();
        
        if (!shouldLoad) {
            return;
        }
        
        // Step 4: Create UI
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