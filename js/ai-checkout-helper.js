/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🧠 AI CHECKOUT ASSISTANT - UI-AWARE VERSION
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Powered by: Gemini 2.0 Flash
 * Strategy: Smart DOM analysis instead of hardcoded IDs
 * Architecture: Self-contained (CSS + HTML + Logic in one file)
 * 
 * @version 4.0.0
 * @created 2026-01-22
 */

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════
    // 🔧 CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════
    
    const CONFIG = {
        GEMINI_API_KEY: 'AIzaSyA11Wu1XUxEXXeCz3t_NfOr0ygoEblvbhY',
        GEMINI_MODEL: 'gemini-2.0-flash-exp',
        GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
        DEBUG: true
    };

    // ═══════════════════════════════════════════════════════════════════
    // 🎨 GLASSMORPHISM STYLES
    // ═══════════════════════════════════════════════════════════════════
    
    const styles = `
        #ai-checkout-toggle {
            position: fixed;
            bottom: 30px;
            left: 30px;
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, rgba(147, 51, 234, 0.9) 0%, rgba(79, 70, 229, 0.9) 100%);
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            box-shadow: 0 8px 32px rgba(147, 51, 234, 0.4);
            z-index: 9998;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            animation: ai-pulse 3s infinite;
        }

        #ai-checkout-toggle:hover {
            transform: scale(1.1) rotate(10deg);
            box-shadow: 0 12px 48px rgba(147, 51, 234, 0.6);
        }

        @keyframes ai-pulse {
            0%, 100% {
                box-shadow: 0 8px 32px rgba(147, 51, 234, 0.4);
            }
            50% {
                box-shadow: 0 8px 48px rgba(147, 51, 234, 0.7);
            }
        }

        #ai-chat-window {
            position: fixed;
            bottom: 110px;
            left: 30px;
            width: 420px;
            max-width: calc(100vw - 60px);
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 24px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            z-index: 9999;
            display: none;
            flex-direction: column;
            overflow: hidden;
            animation: slideUpFade 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        #ai-chat-window.show {
            display: flex;
        }

        @keyframes slideUpFade {
            from {
                opacity: 0;
                transform: translateY(30px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .ai-chat-header {
            background: linear-gradient(135deg, rgba(147, 51, 234, 0.95) 0%, rgba(79, 70, 229, 0.95) 100%);
            backdrop-filter: blur(10px);
            color: white;
            padding: 20px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        }

        .ai-chat-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .ai-chat-badge {
            background: rgba(255, 255, 255, 0.25);
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .ai-chat-close {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }

        .ai-chat-close:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: rotate(90deg);
        }

        .ai-chat-body {
            padding: 24px;
            flex: 1;
            overflow-y: auto;
            max-height: 450px;
        }

        .ai-example-box {
            background: linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%);
            border: 2px solid rgba(147, 51, 234, 0.2);
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 20px;
            font-size: 14px;
            line-height: 1.6;
        }

        .ai-example-box strong {
            display: block;
            margin-bottom: 8px;
            color: #6b21a8;
            font-size: 15px;
        }

        .ai-example-box em {
            color: #7c3aed;
            font-style: normal;
            font-weight: 600;
        }

        .ai-chat-textarea {
            width: 100%;
            min-height: 140px;
            padding: 16px;
            border: 2px solid rgba(147, 51, 234, 0.2);
            border-radius: 16px;
            font-size: 15px;
            resize: vertical;
            transition: all 0.3s;
            font-family: inherit;
            line-height: 1.6;
            background: rgba(255, 255, 255, 0.8);
        }

        .ai-chat-textarea:focus {
            outline: none;
            border-color: #9333ea;
            box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.15);
            background: white;
        }

        .ai-chat-footer {
            padding: 20px 24px;
            border-top: 2px solid rgba(0, 0, 0, 0.05);
            background: rgba(249, 250, 251, 0.8);
            backdrop-filter: blur(10px);
        }

        .ai-chat-submit {
            width: 100%;
            background: linear-gradient(135deg, #9333ea 0%, #4f46e5 100%);
            color: white;
            border: none;
            padding: 16px 24px;
            border-radius: 16px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            box-shadow: 0 4px 16px rgba(147, 51, 234, 0.4);
        }

        .ai-chat-submit:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(147, 51, 234, 0.6);
        }

        .ai-chat-submit:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .ai-spinner {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .ai-message {
            padding: 14px 18px;
            border-radius: 14px;
            margin-bottom: 12px;
            animation: messageSlide 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            font-size: 14px;
            line-height: 1.6;
            border: 2px solid transparent;
        }

        .ai-message.success {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border-color: #6ee7b7;
            color: #065f46;
        }

        .ai-message.error {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            border-color: #fca5a5;
            color: #991b1b;
        }

        .ai-message.info {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            border-color: #93c5fd;
            color: #1e40af;
        }

        @keyframes messageSlide {
            from {
                opacity: 0;
                transform: translateX(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .field-highlight {
            animation: highlightPulse 2s !important;
        }

        @keyframes highlightPulse {
            0%, 100% {
                border-color: inherit;
                box-shadow: none;
            }
            15%, 45%, 75% {
                border-color: #10b981 !important;
                box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.4) !important;
            }
            30%, 60% {
                border-color: #10b981 !important;
                box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.2) !important;
            }
        }

        .ai-thinking {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            background: linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%);
            border-radius: 14px;
            margin-bottom: 12px;
        }

        .ai-thinking-dots {
            display: flex;
            gap: 6px;
        }

        .ai-thinking-dot {
            width: 8px;
            height: 8px;
            background: #9333ea;
            border-radius: 50%;
            animation: dotBounce 1.4s infinite ease-in-out;
        }

        .ai-thinking-dot:nth-child(2) {
            animation-delay: 0.2s;
        }

        .ai-thinking-dot:nth-child(3) {
            animation-delay: 0.4s;
        }

        @keyframes dotBounce {
            0%, 80%, 100% {
                transform: scale(0.8);
                opacity: 0.5;
            }
            40% {
                transform: scale(1.2);
                opacity: 1;
            }
        }

        @media (max-width: 768px) {
            #ai-checkout-toggle {
                bottom: 20px;
                left: 20px;
                width: 56px;
                height: 56px;
                font-size: 24px;
            }

            #ai-chat-window {
                bottom: 90px;
                left: 20px;
                right: 20px;
                width: auto;
            }
        }
    `;

    // ═══════════════════════════════════════════════════════════════════
    // 🎯 GEMINI 2.0 FLASH SYSTEM INSTRUCTION
    // ═══════════════════════════════════════════════════════════════════
    
    const SYSTEM_INSTRUCTION = `You are an expert data extraction assistant for Ukrainian e-commerce checkout forms.

Extract checkout information from the user message and return a JSON object with these exact keys:
- firstName: String (ім'я)
- lastName: String (прізвище)
- phone: String (телефон, convert to +380... format)
- city: String (місто, use Ukrainian name)
- deliveryService: String (MUST be "NP" for Нова Пошта or "UKR" for Укрпошта)
- branchNumber: String (номер відділення, extract ONLY the number)
- branchType: String ("warehouse" for відділення, "poshtomat" for поштомат, null if not specified)
- paymentMethod: String (MUST be "cash" for післяплата/наложка/готівка or "card" for онлайн/картка)

CRITICAL RULES:
1. Convert slang: "наложка" → "cash", "нова пошта"/"НП" → "NP", "укрпошта" → "UKR"
2. Format phone as +380XXXXXXXXX (add +380 prefix if missing)
3. Extract ONLY THE NUMBER from branch info:
   - "відділення 5" → branchNumber: "5", branchType: "warehouse"
   - "поштомат 123" → branchNumber: "123", branchType: "poshtomat"
   - "на п'яте" → branchNumber: "5", branchType: "warehouse"
4. If info is missing, set field to null
5. Return ONLY valid JSON, no explanations, no markdown

Example input 1:
"Іван Петренко, 0671234567, Київ, відділення 12, наложка"

Example output 1:
{
  "firstName": "Іван",
  "lastName": "Петренко",
  "phone": "+380671234567",
  "city": "Київ",
  "deliveryService": "NP",
  "branchNumber": "12",
  "branchType": "warehouse",
  "paymentMethod": "cash"
}

Example input 2:
"Марія, 0501234567, Львів, поштомат 555, картка"

Example output 2:
{
  "firstName": "Марія",
  "lastName": null,
  "phone": "+380501234567",
  "city": "Львів",
  "deliveryService": "NP",
  "branchNumber": "555",
  "branchType": "poshtomat",
  "paymentMethod": "card"
}`;

    // ═══════════════════════════════════════════════════════════════════
    // 🏗️ INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════
    
    function init() {
        injectStyles();
        createUI();
        attachEventListeners();
        if (CONFIG.DEBUG) console.log('✅ AI Checkout Assistant v4.0 (UI-Aware) initialized');
    }

    function injectStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    function createUI() {
        // Floating Toggle Button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'ai-checkout-toggle';
        toggleBtn.innerHTML = '🧠';
        toggleBtn.title = 'AI Checkout Assistant';
        document.body.appendChild(toggleBtn);

        // Chat Window
        const chatWindow = document.createElement('div');
        chatWindow.id = 'ai-chat-window';
        chatWindow.innerHTML = `
            <div class="ai-chat-header">
                <h3>
                    <span>🧠</span>
                    <span>AI Assistant</span>
                    <span class="ai-chat-badge">Gemini 2.0</span>
                </h3>
                <button class="ai-chat-close">✕</button>
            </div>
            <div class="ai-chat-body">
                <div class="ai-example-box">
                    <strong>💡 Просто напишіть свої дані:</strong>
                    Ім'я, телефон, місто, відділення або поштомат, спосіб оплати<br><br>
                    <em>Наприклад:</em> Марія Коваленко, 0501234567, Львів, відділення 3, наложка<br>
                    <em>Або:</em> Іван, 0671234567, Київ, поштомат 555, онлайн
                </div>
                <textarea 
                    class="ai-chat-textarea" 
                    id="ai-input-text"
                    placeholder="Іван Петренко, 0671234567, Київ, відділення 15, онлайн оплата"></textarea>
                <div id="ai-messages"></div>
            </div>
            <div class="ai-chat-footer">
                <button class="ai-chat-submit" id="ai-submit-btn">
                    <span>✨</span>
                    <span>Заповнити дані</span>
                </button>
            </div>
        `;
        document.body.appendChild(chatWindow);
    }

    function attachEventListeners() {
        // Toggle chat
        document.getElementById('ai-checkout-toggle').addEventListener('click', () => {
            const chatWindow = document.getElementById('ai-chat-window');
            chatWindow.classList.toggle('show');
            if (chatWindow.classList.contains('show')) {
                document.getElementById('ai-input-text').focus();
            }
        });

        // Close chat
        document.querySelector('.ai-chat-close').addEventListener('click', () => {
            document.getElementById('ai-chat-window').classList.remove('show');
        });

        // Submit
        document.getElementById('ai-submit-btn').addEventListener('click', handleSubmit);

        // Ctrl+Enter to submit
        document.getElementById('ai-input-text').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                handleSubmit();
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🤖 GEMINI 2.0 FLASH INTEGRATION
    // ═══════════════════════════════════════════════════════════════════
    
    async function handleSubmit() {
        const inputText = document.getElementById('ai-input-text').value.trim();
        const submitBtn = document.getElementById('ai-submit-btn');
        const messagesContainer = document.getElementById('ai-messages');

        if (!inputText) {
            showMessage('⚠️ Будь ласка, введіть ваші дані', 'error');
            return;
        }

        // Show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <div class="ai-spinner"></div>
            <span>Аналіз...</span>
        `;
        messagesContainer.innerHTML = '';

        // Show thinking animation
        showThinkingAnimation();

        try {
            if (CONFIG.DEBUG) console.log('🧠 Calling Gemini 2.0 Flash...');

            const extractedData = await callGemini(inputText);

            if (CONFIG.DEBUG) {
                console.log('═══════════════════════════════════════════════');
                console.log('📦 GEMINI EXTRACTED DATA:');
                console.table(extractedData);
                console.log('═══════════════════════════════════════════════');
            }

            // Remove thinking animation
            removeThinkingAnimation();

            // Fill form using UI-Aware approach
            await fillCheckoutFormSmart(extractedData);

            showMessage('✨ Готово! Я заповнив дані. Будь ласка, перевірте спосіб доставки та оплати перед підтвердженням.', 'success');

            // Auto-close after 4 seconds
            setTimeout(() => {
                document.getElementById('ai-chat-window').classList.remove('show');
            }, 4000);

        } catch (error) {
            console.error('❌ Error:', error);
            removeThinkingAnimation();
            showMessage(`❌ Помилка: ${error.message}`, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <span>✨</span>
                <span>Заповнити дані</span>
            `;
        }
    }

    async function callGemini(userInput) {
        const response = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${SYSTEM_INSTRUCTION}\n\nUser input:\n${userInput}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 1000
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Gemini API error');
        }

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text.trim();

        // Extract JSON from response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('AI не повернув валідний JSON');

        return JSON.parse(jsonMatch[0]);
    }

    function showThinkingAnimation() {
        const messagesContainer = document.getElementById('ai-messages');
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'ai-thinking';
        thinkingDiv.id = 'ai-thinking-indicator';
        thinkingDiv.innerHTML = `
            <div class="ai-thinking-dots">
                <div class="ai-thinking-dot"></div>
                <div class="ai-thinking-dot"></div>
                <div class="ai-thinking-dot"></div>
            </div>
            <span style="color: #9333ea; font-weight: 600;">AI аналізує ваші дані...</span>
        `;
        messagesContainer.appendChild(thinkingDiv);
    }

    function removeThinkingAnimation() {
        const thinking = document.getElementById('ai-thinking-indicator');
        if (thinking) thinking.remove();
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🎯 UI-AWARE SMART FORM FILLING
    // ═══════════════════════════════════════════════════════════════════
    
    async function fillCheckoutFormSmart(data) {
        if (CONFIG.DEBUG) {
            console.log('═══════════════════════════════════════════════');
            console.log('🎯 STARTING UI-AWARE FORM FILLING');
            console.log('═══════════════════════════════════════════════');
        }

        // 1. Fill Name Fields
        if (data.firstName || data.lastName) {
            const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
            await fillCheckoutField('name', fullName, ['name', 'fullname', 'full-name', "ім'я", 'повне']);
        }

        // 2. Fill Phone
        if (data.phone) {
            await fillCheckoutField('phone', data.phone, ['phone', 'tel', 'mobile', 'телефон', 'мобільний']);
        }

        // 3. Select Delivery Service
        if (data.deliveryService) {
            await selectDeliveryService(data.deliveryService);
            await new Promise(resolve => setTimeout(resolve, 600)); // Wait for UI update
        }

        // 4. Fill City (triggers Nova Poshta autocomplete)
        if (data.city && data.deliveryService === 'NP') {
            await fillCityWithAutocomplete(data.city);
        } else if (data.city && data.deliveryService === 'UKR') {
            await fillCheckoutField('city', data.city, ['city', 'місто', 'ukr-city']);
        }

        // 5. Wait for branch dropdown to populate and select
        if (data.branchNumber && data.deliveryService === 'NP') {
            await selectBranchSmart(data.branchNumber, data.branchType);
        }

        // 6. Select Payment Method
        if (data.paymentMethod) {
            await selectPaymentMethod(data.paymentMethod);
        }

        if (CONFIG.DEBUG) {
            console.log('═══════════════════════════════════════════════');
            console.log('✅ UI-AWARE FORM FILLING COMPLETED');
            console.log('═══════════════════════════════════════════════');
        }
    }

    /**
     * 🎯 SMART FIELD FINDER
     * Searches for input fields using multiple strategies
     */
    async function fillCheckoutField(fieldType, value, keywords) {
        if (CONFIG.DEBUG) console.log(`🔍 Looking for ${fieldType} field with keywords: [${keywords.join(', ')}]`);

        // Strategy 1: Search by ID
        for (const keyword of keywords) {
            const byId = document.querySelector(`[id*="${keyword}" i]`);
            if (byId && (byId.tagName === 'INPUT' || byId.tagName === 'TEXTAREA')) {
                return setFieldValue(byId, value, fieldType);
            }
        }

        // Strategy 2: Search by name attribute
        for (const keyword of keywords) {
            const byName = document.querySelector(`[name*="${keyword}" i]`);
            if (byName && (byName.tagName === 'INPUT' || byName.tagName === 'TEXTAREA')) {
                return setFieldValue(byName, value, fieldType);
            }
        }

        // Strategy 3: Search by label text
        const allLabels = document.querySelectorAll('label');
        for (const label of allLabels) {
            const labelText = label.textContent.toLowerCase();
            for (const keyword of keywords) {
                if (labelText.includes(keyword.toLowerCase())) {
                    // Try 'for' attribute
                    const forAttr = label.getAttribute('for');
                    if (forAttr) {
                        const input = document.getElementById(forAttr);
                        if (input) return setFieldValue(input, value, fieldType);
                    }

                    // Try next sibling
                    const nextInput = label.nextElementSibling;
                    if (nextInput && (nextInput.tagName === 'INPUT' || nextInput.tagName === 'TEXTAREA')) {
                        return setFieldValue(nextInput, value, fieldType);
                    }

                    // Try input inside label
                    const inputInside = label.querySelector('input, textarea');
                    if (inputInside) return setFieldValue(inputInside, value, fieldType);
                }
            }
        }

        // Strategy 4: Search by placeholder
        for (const keyword of keywords) {
            const byPlaceholder = document.querySelector(`input[placeholder*="${keyword}" i], textarea[placeholder*="${keyword}" i]`);
            if (byPlaceholder) {
                return setFieldValue(byPlaceholder, value, fieldType);
            }
        }

        if (CONFIG.DEBUG) console.warn(`⚠️ Could not find ${fieldType} field`);
        return false;
    }

    /**
     * 🔥 CRITICAL: Proper Event Dispatching
     * Triggers all necessary events so Nova Poshta and other scripts recognize the change
     */
    function setFieldValue(element, value, fieldType) {
        element.value = value;
        element.classList.add('field-highlight');

        // 🔥 THE MAGIC: Dispatch events with bubbles: true
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

        if (CONFIG.DEBUG) {
            const identifier = element.id || element.name || element.placeholder;
            console.log(`✅ Set ${fieldType} = "${value}" (found: ${identifier})`);
        }

        setTimeout(() => element.classList.remove('field-highlight'), 2000);
        return true;
    }

    /**
     * 🚚 Select Delivery Service (NP or UKR)
     */
    async function selectDeliveryService(service) {
        if (CONFIG.DEBUG) console.log(`🚚 Selecting delivery: ${service}`);

        let keywords = [];
        if (service === 'NP') {
            keywords = ['nova', 'нова', 'пошта', 'np'];
        } else if (service === 'UKR') {
            keywords = ['ukr', 'укр', 'укрпошта'];
        }

        // Try data attribute first
        for (const keyword of keywords) {
            const byData = document.querySelector(`[data-delivery*="${keyword}" i]`);
            if (byData) {
                byData.click();
                byData.dispatchEvent(new Event('change', { bubbles: true }));
                if (CONFIG.DEBUG) console.log(`✅ Selected delivery: ${service}`);
                return true;
            }
        }

        // Try by text content
        const allClickables = document.querySelectorAll('button, div[onclick], div[role="button"], .card, .option, label');
        for (const el of allClickables) {
            const text = el.textContent.toLowerCase();
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    el.click();
                    if (CONFIG.DEBUG) console.log(`✅ Selected delivery: ${service} (by text)`);
                    return true;
                }
            }
        }

        if (CONFIG.DEBUG) console.warn(`⚠️ Could not find delivery option: ${service}`);
        return false;
    }

    /**
     * 📍 Fill City with Autocomplete Support
     */
    async function fillCityWithAutocomplete(cityName) {
        if (CONFIG.DEBUG) console.log(`📍 Filling city: ${cityName}`);

        // Find city input
        const cityInput = document.querySelector('[id*="city" i], [name*="city" i], [placeholder*="місто" i]');
        
        if (!cityInput) {
            if (CONFIG.DEBUG) console.warn('⚠️ City input not found');
            return false;
        }

        // Set value and trigger autocomplete
        cityInput.value = cityName;
        cityInput.classList.add('field-highlight');

        // Trigger multiple events to ensure autocomplete works
        cityInput.dispatchEvent(new Event('input', { bubbles: true }));
        cityInput.dispatchEvent(new Event('change', { bubbles: true }));
        cityInput.dispatchEvent(new Event('keyup', { bubbles: true }));
        cityInput.dispatchEvent(new KeyboardEvent('keydown', { key: cityName[0], bubbles: true }));

        if (CONFIG.DEBUG) console.log(`✅ Set city: ${cityName}, waiting for autocomplete...`);

        // Wait for autocomplete suggestions
        await new Promise(resolve => setTimeout(resolve, 800));

        // Try to click first suggestion
        const suggestionSelectors = [
            '#np-city-list li',
            '.city-suggestions li',
            '[id*="city"] li',
            '.autocomplete li',
            '[role="listbox"] [role="option"]'
        ];

        for (const selector of suggestionSelectors) {
            const firstSuggestion = document.querySelector(selector);
            if (firstSuggestion) {
                firstSuggestion.click();
                if (CONFIG.DEBUG) console.log('✅ Clicked first city suggestion');
                return true;
            }
        }

        if (CONFIG.DEBUG) console.warn('⚠️ No autocomplete suggestions found');
        return false;
    }

    /**
     * 🏢 Smart Branch Selection with MutationObserver
     * Waits for dropdown options to load before selecting
     */
    async function selectBranchSmart(branchNumber, branchType = null) {
        if (CONFIG.DEBUG) console.log(`🏢 Smart selecting branch: ${branchNumber} (type: ${branchType || 'auto'})`);

        // Find branch/warehouse select
        const branchSelect = await findBranchSelect();
        
        if (!branchSelect) {
            if (CONFIG.DEBUG) console.warn('⚠️ Branch select not found');
            return false;
        }

        // Wait for options to load using MutationObserver
        const success = await waitForBranchOptions(branchSelect, branchNumber, branchType);
        
        if (success) {
            // Scroll to field and highlight
            scrollToElement(branchSelect);
            branchSelect.classList.add('field-highlight');
            setTimeout(() => branchSelect.classList.remove('field-highlight'), 2000);
        }
        
        return success;
    }

    /**
     * 🔍 Find Branch Select Element
     */
    async function findBranchSelect() {
        // Initial wait for delivery method to render branch section
        await new Promise(resolve => setTimeout(resolve, 800));

        const selectors = [
            '[id*="warehouse" i]',
            '[id*="branch" i]',
            '[id*="відділення" i]',
            '[name*="warehouse" i]',
            '[name*="branch" i]',
            'select[name*="warehouse"]',
            'select#np-warehouse-select'
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el && el.tagName === 'SELECT') {
                if (CONFIG.DEBUG) console.log(`✅ Found branch select: ${selector}`);
                return el;
            }
        }

        // Try any select that appeared after clicking delivery
        const allSelects = document.querySelectorAll('select');
        for (const select of allSelects) {
            if (select.options.length === 1 && select.options[0].textContent.toLowerCase().includes('оберіть')) {
                if (CONFIG.DEBUG) console.log('✅ Found branch select: generic select with placeholder');
                return select;
            }
        }

        return null;
    }

    /**
     * ⏳ Wait for Branch Options to Load (MutationObserver + Fallback)
     */
    function waitForBranchOptions(selectElement, targetBranchNumber, branchType) {
        return new Promise((resolve) => {
            const MAX_WAIT_TIME = 8000; // 8 seconds max
            const CHECK_INTERVAL = 200; // Check every 200ms
            let elapsedTime = 0;
            let attemptCount = 0;

            if (CONFIG.DEBUG) console.log('⏳ Waiting for branch options to load...');

            // Try to select immediately if options already exist
            if (selectElement.options.length > 1) {
                const success = matchAndSelectOption(selectElement, targetBranchNumber, branchType);
                if (success) {
                    if (CONFIG.DEBUG) console.log('✅ Options already loaded, selected immediately');
                    resolve(true);
                    return;
                }
            }

            // Setup MutationObserver
            const observer = new MutationObserver((mutations) => {
                if (CONFIG.DEBUG && attemptCount % 5 === 0) {
                    console.log(`🔄 Attempt ${attemptCount}: Checking for options... (${selectElement.options.length} options)`);
                }

                if (selectElement.options.length > 1) {
                    const success = matchAndSelectOption(selectElement, targetBranchNumber, branchType);
                    if (success) {
                        observer.disconnect();
                        clearInterval(intervalId);
                        if (CONFIG.DEBUG) console.log('✅ Branch options loaded and selected via MutationObserver');
                        resolve(true);
                    }
                }

                attemptCount++;
            });

            // Observe the select element and its parent for changes
            observer.observe(selectElement, { 
                childList: true, 
                subtree: true, 
                attributes: true,
                attributeFilter: ['disabled']
            });

            // Observe parent container (for React/Vue re-renders)
            if (selectElement.parentElement) {
                observer.observe(selectElement.parentElement, { 
                    childList: true, 
                    subtree: true 
                });
            }

            // Fallback: setInterval check (in case MutationObserver doesn't fire)
            const intervalId = setInterval(() => {
                elapsedTime += CHECK_INTERVAL;
                attemptCount++;

                if (CONFIG.DEBUG && attemptCount % 10 === 0) {
                    console.log(`⏳ Still waiting... ${elapsedTime}ms elapsed (${selectElement.options.length} options)`);
                }

                if (selectElement.options.length > 1) {
                    const success = matchAndSelectOption(selectElement, targetBranchNumber, branchType);
                    if (success) {
                        observer.disconnect();
                        clearInterval(intervalId);
                        if (CONFIG.DEBUG) console.log('✅ Branch options loaded and selected via setInterval');
                        resolve(true);
                    }
                }

                if (elapsedTime >= MAX_WAIT_TIME) {
                    observer.disconnect();
                    clearInterval(intervalId);
                    if (CONFIG.DEBUG) {
                        console.warn(`⚠️ Timeout: Branch options did not load within ${MAX_WAIT_TIME}ms`);
                        console.log('Available options:', Array.from(selectElement.options).map(o => o.textContent));
                    }
                    resolve(false);
                }
            }, CHECK_INTERVAL);
        });
    }

    /**
     * 🎯 Match and Select Option (Smart Matching Logic)
     */
    function matchAndSelectOption(selectElement, targetBranchNumber, branchType) {
        const options = Array.from(selectElement.options);
        
        if (CONFIG.DEBUG) {
            console.log(`🎯 Matching branch "${targetBranchNumber}" (type: ${branchType}) in ${options.length} options`);
        }

        // Skip placeholder (first option usually)
        const validOptions = options.slice(1);

        if (validOptions.length === 0) {
            if (CONFIG.DEBUG) console.warn('⚠️ No valid options found (only placeholder)');
            return false;
        }

        // Strategy 1: Exact match with type
        if (branchType) {
            const typeKeywords = {
                'poshtomat': ['поштомат', 'poshtomat', 'банкомат'],
                'warehouse': ['відділення', 'warehouse', 'склад', 'пункт']
            };

            const keywords = typeKeywords[branchType] || [];
            
            for (const option of validOptions) {
                const text = option.textContent.toLowerCase();
                const hasType = keywords.some(keyword => text.includes(keyword));
                const hasNumber = text.includes(`№${targetBranchNumber}`) || 
                                  text.includes(`#${targetBranchNumber}`) ||
                                  text.match(new RegExp(`\\b${targetBranchNumber}\\b`));
                
                if (hasType && hasNumber) {
                    selectOption(selectElement, option, targetBranchNumber);
                    if (CONFIG.DEBUG) console.log(`✅ Matched by type + number: "${option.textContent}"`);
                    return true;
                }
            }
        }

        // Strategy 2: Match by number only (common patterns)
        for (const option of validOptions) {
            const text = option.textContent.toLowerCase();
            
            // Pattern 1: "№12", "#12"
            if (text.includes(`№${targetBranchNumber}`) || text.includes(`#${targetBranchNumber}`)) {
                selectOption(selectElement, option, targetBranchNumber);
                if (CONFIG.DEBUG) console.log(`✅ Matched by №: "${option.textContent}"`);
                return true;
            }
            
            // Pattern 2: "Відділення 12", "Branch 12"
            const pattern2 = new RegExp(`(відділення|warehouse|branch|поштомат|пункт)\\s*${targetBranchNumber}\\b`, 'i');
            if (pattern2.test(text)) {
                selectOption(selectElement, option, targetBranchNumber);
                if (CONFIG.DEBUG) console.log(`✅ Matched by pattern: "${option.textContent}"`);
                return true;
            }
            
            // Pattern 3: Word boundary (standalone number)
            const pattern3 = new RegExp(`\\b${targetBranchNumber}\\b`);
            if (pattern3.test(text)) {
                selectOption(selectElement, option, targetBranchNumber);
                if (CONFIG.DEBUG) console.log(`✅ Matched by word boundary: "${option.textContent}"`);
                return true;
            }
        }

        // Strategy 3: Fuzzy match (number anywhere in text, but with verification)
        for (const option of validOptions) {
            const text = option.textContent;
            // Extract all numbers from option text
            const numbersInOption = text.match(/\d+/g);
            
            if (numbersInOption && numbersInOption.includes(targetBranchNumber)) {
                selectOption(selectElement, option, targetBranchNumber);
                if (CONFIG.DEBUG) console.log(`✅ Matched by fuzzy: "${option.textContent}"`);
                return true;
            }
        }

        if (CONFIG.DEBUG) {
            console.warn(`⚠️ Branch ${targetBranchNumber} not found. Available options:`);
            validOptions.forEach((opt, idx) => {
                console.log(`  ${idx + 1}. ${opt.textContent}`);
            });
        }
        
        return false;
    }

    /**
     * ✨ Select Option and Trigger Events
     */
    function selectOption(selectElement, option, branchNumber) {
        selectElement.value = option.value;
        
        // Trigger standard events
        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        selectElement.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Trigger jQuery events (if Select2 or other jQuery-based dropdown)
        if (typeof jQuery !== 'undefined' && jQuery(selectElement).data('select2')) {
            jQuery(selectElement).trigger('change');
            if (CONFIG.DEBUG) console.log('🔧 Triggered Select2 change event');
        }
        
        // Trigger native select event
        selectElement.dispatchEvent(new Event('select', { bubbles: true }));
        
        if (CONFIG.DEBUG) {
            console.log(`✅ Selected: value="${option.value}", text="${option.textContent}"`);
        }
    }

    /**
     * 📜 Scroll to Element and Highlight
     */
    function scrollToElement(element) {
        element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        if (CONFIG.DEBUG) console.log('📜 Scrolled to branch select');
    }

    /**
     * 🏢 Legacy Branch Selection (Fallback - kept for compatibility)
     */
    async function selectBranch(branchNumber) {
        // Redirect to smart selection
        return await selectBranchSmart(branchNumber, null);
    }

    /**
     * 💳 Select Payment Method
     */
    async function selectPaymentMethod(method) {
        if (CONFIG.DEBUG) console.log(`💳 Selecting payment: ${method}`);

        let keywords = [];
        if (method === 'card') {
            keywords = ['online', 'онлайн', 'card', 'картка', 'оплата онлайн'];
        } else if (method === 'cash') {
            keywords = ['cash', 'cod', 'післяплата', 'готівка', 'наложка', 'при отриманні'];
        }

        // Try data attribute first
        for (const keyword of keywords) {
            const byData = document.querySelector(`[data-payment*="${keyword}" i]`);
            if (byData) {
                byData.click();
                byData.dispatchEvent(new Event('change', { bubbles: true }));
                if (CONFIG.DEBUG) console.log(`✅ Selected payment: ${method}`);
                return true;
            }
        }

        // Try by text content
        const allClickables = document.querySelectorAll('button, div[onclick], div[role="button"], .card, .option, label');
        for (const el of allClickables) {
            const text = el.textContent.toLowerCase();
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    el.click();
                    if (CONFIG.DEBUG) console.log(`✅ Selected payment: ${method} (by text)`);
                    return true;
                }
            }
        }

        if (CONFIG.DEBUG) console.warn(`⚠️ Could not find payment option: ${method}`);
        return false;
    }

    /**
     * 💬 Show Message
     */
    function showMessage(text, type = 'info') {
        const messagesContainer = document.getElementById('ai-messages');
        const message = document.createElement('div');
        message.className = `ai-message ${type}`;
        message.textContent = text;
        messagesContainer.appendChild(message);
        
        if (CONFIG.DEBUG) console.log(`💬 Message (${type}): ${text}`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🚀 AUTO-INITIALIZATION (WITH FIRESTORE CHECK)
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Check if AI Assistant is enabled in Firestore settings
     * Defaults to false if document doesn't exist
     */
    async function initAiAssistant() {
        try {
            // Wait for Firebase to be available
            if (typeof db === 'undefined') {
                console.log('⏳ Waiting for Firebase initialization...');
                await new Promise(resolve => {
                    const checkFirebase = setInterval(() => {
                        if (typeof db !== 'undefined') {
                            clearInterval(checkFirebase);
                            resolve();
                        }
                    }, 100);
                });
            }

            // Check Firestore setting
            const { getDoc, doc } = window;
            const configDoc = await getDoc(doc(db, 'settings', 'checkout_config'));
            const aiEnabled = configDoc.exists() && configDoc.data().aiEnabled === true;

            if (aiEnabled) {
                console.log('🪄 AI Assistant is Enabled.');
                init();
            } else {
                console.log('🚫 AI Assistant is Disabled in settings.');
            }
        } catch (error) {
            console.error('❌ Error checking AI Assistant settings:', error);
            console.log('🚫 AI Assistant will not initialize due to error.');
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAiAssistant);
    } else {
        initAiAssistant();
    }

})();
