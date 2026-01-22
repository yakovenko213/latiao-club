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
     * 🏢 AGGRESSIVE Branch Selection (Complete Rewrite)
     * Requirements:
     * 1. Wait for 5+ options
     * 2. Exact regex matching with word boundaries
     * 3. Multi-step priority scoring
     * 4. Force event simulation
     * 5. Visual validation with green glow
     */
    async function selectBranchSmart(branchNumber, branchType = null) {
        console.log(`🔥 AGGRESSIVE branch selection: "${branchNumber}" (type: ${branchType || 'auto'})`);

        // Step 1: Find the select element
        const branchSelect = await findBranchSelect();
        
        if (!branchSelect) {
            console.error('❌ Branch select element not found');
            return false;
        }

        console.log('✅ Found branch select:', branchSelect.id || branchSelect.name || 'unnamed');

        // Step 2: Wait for OPTIONS to load (5+ options minimum)
        const optionsLoaded = await waitForMinimumOptions(branchSelect, 5);
        
        if (!optionsLoaded) {
            console.warn('⚠️ Timeout: Branch options did not load');
            return false;
        }

        // Step 3: Find the EXACT match using regex and priority scoring
        const matchedOption = findExactBranchMatch(branchSelect, branchNumber, branchType);
        
        if (!matchedOption) {
            console.warn(`⚠️ No exact match for branch [${branchNumber}]`);
            console.log('Available options:', Array.from(branchSelect.options).map(o => o.textContent));
            showMessage(`Не вдалося знайти відділення №${branchNumber}. Будь ласка, оберіть зі списку.`, 'warning');
            return false;
        }

        // Step 4: Select the option with FORCE event simulation
        forceSelectOption(branchSelect, matchedOption, branchNumber);

        // Step 5: Visual validation (green glow)
        applyGreenGlow(branchSelect);

        // Step 6: Scroll to field
        scrollToElement(branchSelect);

        console.log(`✅ SUCCESS: Selected "${matchedOption.textContent.trim()}"`);
        return true;
    }

    /**
     * ⏳ Wait for Minimum Options to Load
     * Polls every 200ms until 5+ options are available or timeout
     */
    function waitForMinimumOptions(selectElement, minOptions = 5, maxWaitMs = 5000) {
        return new Promise((resolve) => {
            const CHECK_INTERVAL = 200;
            let elapsedTime = 0;
            let attemptCount = 0;

            console.log(`⏳ Waiting for ${minOptions}+ options to load...`);

            const checkOptions = () => {
                attemptCount++;
                const currentCount = selectElement.options.length;

                if (attemptCount % 5 === 0) {
                    console.log(`🔄 Attempt ${attemptCount}: ${currentCount} options loaded`);
                }

                // Success: enough options
                if (currentCount > minOptions) {
                    console.log(`✅ Options loaded: ${currentCount} options`);
                    clearInterval(intervalId);
                    observer.disconnect();
                    resolve(true);
                    return;
                }

                // Timeout
                if (elapsedTime >= maxWaitMs) {
                    console.warn(`⏰ Timeout: Only ${currentCount} options after ${maxWaitMs}ms`);
                    clearInterval(intervalId);
                    observer.disconnect();
                    resolve(false);
                }

                elapsedTime += CHECK_INTERVAL;
            };

            // Initial check
            if (selectElement.options.length > minOptions) {
                console.log(`✅ Options already loaded: ${selectElement.options.length} options`);
                resolve(true);
                return;
            }

            // MutationObserver for dynamic loading
            const observer = new MutationObserver(() => {
                if (selectElement.options.length > minOptions) {
                    console.log(`✅ Options loaded via MutationObserver: ${selectElement.options.length} options`);
                    clearInterval(intervalId);
                    observer.disconnect();
                    resolve(true);
                }
            });

            observer.observe(selectElement, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['disabled']
            });

            // Fallback: polling
            const intervalId = setInterval(checkOptions, CHECK_INTERVAL);
        });
    }

    /**
     * 🎯 Find Exact Branch Match (Priority Scoring)
     * Priority 1 (Score 100): Type keyword + exact number
     * Priority 2 (Score 80): Exact number (word boundary)
     * Priority 3 (Score 0): No match
     */
    function findExactBranchMatch(selectElement, branchNumber, branchType) {
        const options = Array.from(selectElement.options);
        
        // Skip placeholder
        const validOptions = options.filter(opt => 
            opt.value && opt.value !== '' && !opt.textContent.toLowerCase().includes('оберіть')
        );

        console.log(`🎯 Searching for branch "${branchNumber}" in ${validOptions.length} valid options`);

        // Create word boundary regex for EXACT number match
        // \b ensures "5" matches "№5" or "branch 5" but NOT "№50" or "№15"
        const exactNumberRegex = new RegExp(`\\b${branchNumber}\\b`, 'i');

        // Type keywords for priority matching
        const typeKeywords = {
            'poshtomat': ['поштомат', 'poshtomat', 'банкомат', 'постомат'],
            'warehouse': ['відділення', 'warehouse', 'склад', 'пункт', 'відд']
        };

        let bestMatch = null;
        let bestScore = 0;

        for (const option of validOptions) {
            const text = option.textContent.toLowerCase();
            let score = 0;

            // Check if exact number exists (word boundary)
            const hasExactNumber = exactNumberRegex.test(text);
            
            if (!hasExactNumber) {
                continue; // Skip if number doesn't match exactly
            }

            // Calculate score
            if (branchType && typeKeywords[branchType]) {
                // Priority 1: Type + Number
                const hasTypeKeyword = typeKeywords[branchType].some(keyword => text.includes(keyword));
                
                if (hasTypeKeyword && hasExactNumber) {
                    score = 100;
                    console.log(`  🏆 Score 100: "${option.textContent.trim()}" (type + exact number)`);
                }
            }
            
            if (score === 0 && hasExactNumber) {
                // Priority 2: Exact number only
                score = 80;
                console.log(`  ⭐ Score 80: "${option.textContent.trim()}" (exact number)`);
            }

            // Update best match
            if (score > bestScore) {
                bestScore = score;
                bestMatch = option;
            }

            // If we found a perfect match (100), stop searching
            if (score === 100) {
                break;
            }
        }

        if (bestMatch) {
            console.log(`🎯 Best match (score ${bestScore}): "${bestMatch.textContent.trim()}"`);
        } else {
            console.warn(`❌ No match found for branch "${branchNumber}"`);
        }

        return bestMatch;
    }

    /**
     * 💪 Force Select Option (Aggressive Event Simulation)
     * Ensures the value change is detected by ANY framework
     */
    function forceSelectOption(selectElement, option, branchNumber) {
        console.log(`💪 Force selecting: value="${option.value}", text="${option.textContent.trim()}"`);

        // Set the value
        selectElement.value = option.value;

        // Dispatch ALL possible events
        const events = ['change', 'input', 'select', 'blur'];
        events.forEach(eventType => {
            selectElement.dispatchEvent(new Event(eventType, { 
                bubbles: true, 
                cancelable: true 
            }));
        });

        // jQuery/Select2 support
        if (typeof jQuery !== 'undefined') {
            try {
                jQuery(selectElement).val(option.value).trigger('change');
                console.log('  ✅ jQuery trigger fired');
            } catch (e) {
                console.log('  ℹ️ jQuery not used');
            }
        }

        // React/Vue support (trigger native setter)
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLSelectElement.prototype,
            'value'
        ).set;
        nativeInputValueSetter.call(selectElement, option.value);
        selectElement.dispatchEvent(new Event('input', { bubbles: true }));

        console.log('  ✅ All events dispatched');
    }

    /**
     * 💚 Apply Green Glow Effect (Visual Validation)
     * Shows user that the selection was successful
     */
    function applyGreenGlow(element) {
        // Add temporary green glow class
        element.style.border = '3px solid #10b981';
        element.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.6)';
        element.style.transition = 'all 0.3s ease';

        // Add pulsing animation
        let pulseCount = 0;
        const pulseInterval = setInterval(() => {
            if (pulseCount % 2 === 0) {
                element.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.8)';
            } else {
                element.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.4)';
            }
            pulseCount++;

            if (pulseCount >= 6) {
                clearInterval(pulseInterval);
                // Fade out
                setTimeout(() => {
                    element.style.border = '';
                    element.style.boxShadow = '';
                }, 500);
            }
        }, 300);

        console.log('💚 Green glow applied');
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

    // =========================================================================
    // ⚠️ LEGACY FUNCTIONS BELOW (NOT USED BY NEW AGGRESSIVE SELECTION LOGIC)
    // =========================================================================
    // The following functions are REPLACED by the new aggressive selection 
    // implementation in selectBranchSmart() above. They are kept temporarily
    // for reference but are NOT called by the current code.
    //
    // OLD FUNCTIONS (lines 1165-1428):
    // - waitForBranchOptions()   → REPLACED by waitForMinimumOptions()
    // - matchAndSelectOption()   → REPLACED by findExactBranchMatch()
    // - findBestMatch()          → REPLACED by findExactBranchMatch() with regex
    // - normalizeText()          → REPLACED by inline text processing
    // - selectOption()           → REPLACED by forceSelectOption()
    //
    // NEW FUNCTIONS (lines 913-1155):
    // ✅ waitForMinimumOptions(): Explicit wait for 5+ options
    // ✅ findExactBranchMatch():  Word boundary regex (\\b5\\b) matching
    // ✅ forceSelectOption():     All-framework event simulation
    // ✅ applyGreenGlow():        Visual validation animation
    // =========================================================================

    /**
     * ⏳ Wait for Branch Options to Load (MutationObserver + Retry Logic)
     * Retries until a STRONG match (score 80+) is found, or timeout
     */
    function waitForBranchOptions(selectElement, targetBranchNumber, branchType) {
        return new Promise((resolve) => {
            const MAX_WAIT_TIME = 5000; // 5 seconds max (as per requirements)
            const CHECK_INTERVAL = 200; // Check every 200ms
            let elapsedTime = 0;
            let attemptCount = 0;
            let bestScoreSoFar = 0;

            if (CONFIG.DEBUG) console.log('⏳ Waiting for branch options to load...');

            // Helper function to check and select
            const trySelect = () => {
                attemptCount++;
                
                if (CONFIG.DEBUG && attemptCount % 5 === 0) {
                    console.log(`🔄 Attempt ${attemptCount}: Checking for options... (${selectElement.options.length} options)`);
                }

                if (selectElement.options.length > 1) {
                    const validOptions = Array.from(selectElement.options).slice(1);
                    const bestMatch = findBestMatch(validOptions, targetBranchNumber, branchType);
                    
                    if (bestMatch) {
                        bestScoreSoFar = Math.max(bestScoreSoFar, bestMatch.score);
                        
                        // Accept match if score is 80+ (strong match)
                        if (bestMatch.score >= 80) {
                            selectOption(selectElement, bestMatch.option, targetBranchNumber);
                            if (CONFIG.DEBUG) {
                                console.log(`✅ Strong match found (score ${bestMatch.score}): "${bestMatch.option.textContent}"`);
                            }
                            return true;
                        }
                        
                        if (CONFIG.DEBUG && attemptCount % 10 === 0) {
                            console.log(`⏳ Best score so far: ${bestMatch.score} (waiting for 80+)`);
                        }
                    }
                }
                
                return false;
            };

            // Try immediately if options already exist
            if (trySelect()) {
                resolve(true);
                return;
            }

            // Setup MutationObserver
            const observer = new MutationObserver((mutations) => {
                if (trySelect()) {
                    observer.disconnect();
                    clearInterval(intervalId);
                    resolve(true);
                }
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

                if (trySelect()) {
                    observer.disconnect();
                    clearInterval(intervalId);
                    resolve(true);
                    return;
                }

                if (elapsedTime >= MAX_WAIT_TIME) {
                    observer.disconnect();
                    clearInterval(intervalId);
                    
                    // After timeout, accept any match with score 50+
                    if (bestScoreSoFar >= 50) {
                        if (CONFIG.DEBUG) {
                            console.log(`⏰ Timeout reached. Accepting best score: ${bestScoreSoFar}`);
                        }
                        const success = matchAndSelectOption(selectElement, targetBranchNumber, branchType);
                        resolve(success);
                    } else {
                        if (CONFIG.DEBUG) {
                            console.warn(`⚠️ Timeout: No good match found (best score: ${bestScoreSoFar})`);
                            console.log('Available options:', Array.from(selectElement.options).map(o => o.textContent));
                        }
                        showMessage('Я знайшов кілька схожих відділень, будь ласка, оберіть потрібне зі списку самостійно.', 'warning');
                        resolve(false);
                    }
                }
            }, CHECK_INTERVAL);
        });
    }

    /**
     * 🎯 Match and Select Option (IMPROVED: Scoring System)
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

        // Find best match using scoring system
        const bestMatch = findBestMatch(validOptions, targetBranchNumber, branchType);
        
        if (!bestMatch) {
            if (CONFIG.DEBUG) {
                console.warn(`⚠️ Branch ${targetBranchNumber} not found. Available options:`);
                validOptions.forEach((opt, idx) => {
                    console.log(`  ${idx + 1}. ${opt.textContent}`);
                });
            }
            return false;
        }
        
        if (bestMatch.score < 50) {
            if (CONFIG.DEBUG) {
                console.warn(`⚠️ Best match score too low (${bestMatch.score}): "${bestMatch.option.textContent}"`);
                console.log('💬 User should select manually');
            }
            showMessage('Я знайшов кілька схожих відділень, будь ласка, оберіть потрібне зі списку самостійно.', 'warning');
            return false;
        }
        
        selectOption(selectElement, bestMatch.option, targetBranchNumber);
        if (CONFIG.DEBUG) {
            console.log(`✅ Selected (score ${bestMatch.score}): "${bestMatch.option.textContent}"`);
        }
        return true;
    }

    /**
     * 🏆 Find Best Match with Scoring System
     * Score 100: Exact number + correct type (поштомат/відділення)
     * Score 80: Exact number match (word boundary)
     * Score 50: Partial match (number found in text)
     */
    function findBestMatch(options, targetBranchNumber, branchType) {
        let bestMatch = null;
        let bestScore = 0;

        const typeKeywords = {
            'poshtomat': ['поштомат', 'poshtomat', 'банкомат'],
            'warehouse': ['відділення', 'warehouse', 'склад', 'пункт']
        };

        for (const option of options) {
            const rawText = option.textContent;
            const normalizedText = normalizeText(rawText);
            let score = 0;

            // Extract option number using regex
            const optionNumbers = normalizedText.match(/\d+/g);
            if (!optionNumbers) continue;

            // Check if exact number exists
            const hasExactNumber = optionNumbers.includes(targetBranchNumber);
            if (!hasExactNumber) continue;

            // Check if it's a word boundary match (not part of larger number)
            const wordBoundaryRegex = new RegExp(`\\b${targetBranchNumber}\\b`);
            const isWordBoundary = wordBoundaryRegex.test(normalizedText);

            // Check type match
            let hasTypeMatch = false;
            if (branchType && typeKeywords[branchType]) {
                hasTypeMatch = typeKeywords[branchType].some(keyword => 
                    normalizedText.includes(keyword)
                );
            }

            // Calculate score
            if (isWordBoundary && hasTypeMatch) {
                // Perfect match: exact number + correct type
                score = 100;
            } else if (isWordBoundary) {
                // Good match: exact number as standalone word
                score = 80;
            } else if (hasExactNumber) {
                // Weak match: number found but might be part of larger number
                score = 50;
            }

            // Update best match
            if (score > bestScore) {
                bestScore = score;
                bestMatch = { option, score };
            }

            if (CONFIG.DEBUG && score >= 50) {
                console.log(`  📊 Score ${score}: "${rawText}"`);
            }
        }

        return bestMatch;
    }

    /**
     * 🧹 Normalize Text for Comparison
     * Removes special characters, extra spaces, and converts to lowercase
     */
    function normalizeText(text) {
        return text
            .toLowerCase()
            .replace(/[№#]/g, '') // Remove № and #
            .replace(/\bвул\./gi, '') // Remove "вул."
            .replace(/\s+/g, ' ') // Collapse multiple spaces
            .trim();
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
     * Defaults to TRUE (enabled) if document doesn't exist or Firebase fails
     */
    async function initAiAssistant() {
        console.log('🔍 Checking AI Assistant status...');
        
        try {
            // Step 1: Wait for Firebase DB to be available
            if (typeof db === 'undefined' || typeof window.getDoc === 'undefined' || typeof window.doc === 'undefined') {
                console.log('⏳ Waiting for Firebase initialization...');
                
                let attempts = 0;
                const maxAttempts = 100; // 10 seconds max
                
                await new Promise((resolve, reject) => {
                    const checkFirebase = setInterval(() => {
                        attempts++;
                        
                        if (typeof db !== 'undefined' && typeof window.getDoc !== 'undefined' && typeof window.doc !== 'undefined') {
                            clearInterval(checkFirebase);
                            console.log('✅ Firebase initialized after', attempts * 100, 'ms');
                            resolve();
                        }
                        
                        if (attempts >= maxAttempts) {
                            clearInterval(checkFirebase);
                            console.warn('⚠️ Firebase timeout - enabling AI Assistant by default');
                            resolve(); // Continue anyway
                        }
                    }, 100);
                });
            }

            // Step 2: Check if Firebase methods are available
            if (typeof window.getDoc === 'undefined' || typeof window.doc === 'undefined') {
                console.warn('⚠️ Firestore methods not available - enabling AI Assistant by default');
                init();
                return;
            }

            // Step 3: Read Firestore setting
            console.log('📖 Reading settings/checkout_config from Firestore...');
            const { getDoc, doc } = window;
            const configDoc = await getDoc(doc(db, 'settings', 'checkout_config'));
            
            if (!configDoc.exists()) {
                console.log('⚠️ Document settings/checkout_config does not exist');
                console.log('🪄 AI Assistant is ENABLED by default (no config found)');
                init();
                return;
            }
            
            const data = configDoc.data();
            const aiEnabled = data.aiEnabled === true;
            
            console.log('📊 Firestore config loaded:', { aiEnabled, data });

            if (aiEnabled) {
                console.log('🪄 AI Assistant is ENABLED in Firebase settings');
                console.log('🎬 Initializing widget...');
                init();
            } else {
                console.log('❌ AI Assistant is DISABLED in Firebase settings');
                console.log('💡 Enable it in Admin Panel → Settings → AI Assistant toggle');
            }
            
        } catch (error) {
            console.error('❌ Error checking AI Assistant settings:', error);
            console.error('📍 Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            // Default to ENABLED on error
            console.log('⚠️ Fallback: Enabling AI Assistant despite error');
            init();
        }
    }
    
    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAiAssistant);
    } else {
        initAiAssistant();
    }

})();
