/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🪄 AI CHECKOUT SMART FILLER - ROBUST VERSION
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Intelligent checkout assistant that:
 * - Finds fields by ID, Name, or Label text (not just getElementById)
 * - Forces updates with proper event dispatching (input, change, blur)
 * - Handles Nova Poshta dropdowns correctly
 * - Provides extensive debug logging
 * 
 * @version 3.0.0 (Complete Rewrite)
 * @created 2026-01-22
 */

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════
    // 🔧 CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════
    
    const CONFIG = {
        // OpenAI API Configuration
        OPENAI_API_KEY: 'sk-proj-YOUR_API_KEY_HERE', // ⚠️ REPLACE WITH YOUR KEY
        OPENAI_MODEL: 'gpt-4o-mini',
        OPENAI_ENDPOINT: 'https://api.openai.com/v1/chat/completions',
        
        // Gemini API Configuration (Alternative)
        GEMINI_API_KEY: 'AIzaSyA11Wu1XUxEXXeCz3t_NfOr0ygoEblvbhY',
        GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        
        // AI Provider
        AI_PROVIDER: 'gemini', // 'openai' or 'gemini'
        
        // Debug Mode
        DEBUG: true
    };
    
    // ═══════════════════════════════════════════════════════════════════
    // 🔍 INTELLIGENT FIELD FINDER
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Smart field finder that searches by:
     * 1. Element ID
     * 2. Element name attribute
     * 3. Associated label text
     * 4. Placeholder text
     */
    function findField(labelNames) {
        if (CONFIG.DEBUG) console.log(`🔍 Searching for field: [${labelNames.join(', ')}]`);
        
        // Try by ID first
        for (const name of labelNames) {
            const byId = document.getElementById(name);
            if (byId) {
                if (CONFIG.DEBUG) console.log(`✅ Found by ID: ${name}`);
                return byId;
            }
        }
        
        // Try by name attribute
        for (const name of labelNames) {
            const byName = document.querySelector(`[name="${name}"]`);
            if (byName) {
                if (CONFIG.DEBUG) console.log(`✅ Found by name: ${name}`);
                return byName;
            }
        }
        
        // Try by label text (case-insensitive, partial match)
        const allLabels = document.querySelectorAll('label');
        for (const label of allLabels) {
            const labelText = label.textContent.toLowerCase().trim();
            
            for (const searchTerm of labelNames) {
                if (labelText.includes(searchTerm.toLowerCase())) {
                    // Find associated input
                    const forAttr = label.getAttribute('for');
                    if (forAttr) {
                        const input = document.getElementById(forAttr);
                        if (input) {
                            if (CONFIG.DEBUG) console.log(`✅ Found by label text: "${labelText}" -> ${forAttr}`);
                            return input;
                        }
                    }
                    
                    // Try next sibling
                    const nextInput = label.nextElementSibling;
                    if (nextInput && (nextInput.tagName === 'INPUT' || nextInput.tagName === 'TEXTAREA')) {
                        if (CONFIG.DEBUG) console.log(`✅ Found by label + next sibling: "${labelText}"`);
                        return nextInput;
                    }
                    
                    // Try within label
                    const inputInside = label.querySelector('input, textarea');
                    if (inputInside) {
                        if (CONFIG.DEBUG) console.log(`✅ Found input inside label: "${labelText}"`);
                        return inputInside;
                    }
                }
            }
        }
        
        // Try by placeholder
        for (const searchTerm of labelNames) {
            const byPlaceholder = document.querySelector(`input[placeholder*="${searchTerm}" i], textarea[placeholder*="${searchTerm}" i]`);
            if (byPlaceholder) {
                if (CONFIG.DEBUG) console.log(`✅ Found by placeholder: ${searchTerm}`);
                return byPlaceholder;
            }
        }
        
        if (CONFIG.DEBUG) console.warn(`⚠️ Could not find field for: [${labelNames.join(', ')}]`);
        return null;
    }
    
    /**
     * Find a clickable element (button, card) by text or data attribute
     */
    function findClickable(searchTerms, dataAttr = null) {
        if (CONFIG.DEBUG) console.log(`🔍 Searching for clickable: [${searchTerms.join(', ')}]`);
        
        // Try by data attribute first
        if (dataAttr) {
            for (const term of searchTerms) {
                const byData = document.querySelector(`[${dataAttr}="${term}"]`);
                if (byData) {
                    if (CONFIG.DEBUG) console.log(`✅ Found by data-${dataAttr}: ${term}`);
                    return byData;
                }
            }
        }
        
        // Try by text content
        const allClickables = document.querySelectorAll('button, a, div[onclick], div[role="button"], .card, .option');
        for (const el of allClickables) {
            const text = el.textContent.toLowerCase().trim();
            for (const term of searchTerms) {
                if (text.includes(term.toLowerCase())) {
                    if (CONFIG.DEBUG) console.log(`✅ Found by text: "${text}"`);
                    return el;
                }
            }
        }
        
        if (CONFIG.DEBUG) console.warn(`⚠️ Could not find clickable for: [${searchTerms.join(', ')}]`);
        return null;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🎨 STYLES INJECTION
    // ═══════════════════════════════════════════════════════════════════
    
    const styles = `
        #ai-checkout-button {
            position: fixed;
            bottom: ${CONFIG.BUTTON_POSITION.bottom};
            right: ${CONFIG.BUTTON_POSITION.right};
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 50px;
            padding: 16px 24px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
            z-index: 9998;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            animation: ai-pulse 2s infinite;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        #ai-checkout-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(102, 126, 234, 0.6);
        }

        #ai-checkout-button:active {
            transform: scale(0.95);
        }

        @keyframes ai-pulse {
            0%, 100% {
                box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
            }
            50% {
                box-shadow: 0 10px 40px rgba(102, 126, 234, 0.7);
            }
        }

        #ai-chat-window {
            position: fixed;
            bottom: 100px;
            right: 30px;
            width: 400px;
            max-width: calc(100vw - 40px);
            background: white;
            border-radius: 24px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
            z-index: 9999;
            display: none;
            flex-direction: column;
            overflow: hidden;
            animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        #ai-chat-window.show {
            display: flex;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .ai-chat-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .ai-chat-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
        }

        .ai-chat-close {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .ai-chat-close:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: rotate(90deg);
        }

        .ai-chat-body {
            padding: 24px;
            flex: 1;
            overflow-y: auto;
            max-height: 400px;
        }

        .ai-chat-example {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 14px;
            color: #6c757d;
        }

        .ai-chat-example strong {
            color: #495057;
            display: block;
            margin-bottom: 8px;
        }

        .ai-chat-textarea {
            width: 100%;
            min-height: 120px;
            padding: 16px;
            border: 2px solid #e9ecef;
            border-radius: 12px;
            font-size: 15px;
            resize: vertical;
            transition: all 0.3s;
            font-family: inherit;
        }

        .ai-chat-textarea:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .ai-chat-footer {
            padding: 20px;
            border-top: 1px solid #e9ecef;
        }

        .ai-chat-submit {
            width: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 14px 24px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .ai-chat-submit:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
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
            padding: 12px 16px;
            border-radius: 12px;
            margin-bottom: 12px;
            animation: fadeIn 0.3s;
        }

        .ai-message.success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }

        .ai-message.error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }

        .ai-message.info {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .field-highlight {
            animation: highlightField 1.5s;
        }

        @keyframes highlightField {
            0%, 100% {
                border-color: inherit;
            }
            50% {
                border-color: #28a745;
                box-shadow: 0 0 0 4px rgba(40, 167, 69, 0.2);
            }
        }

        @media (max-width: 768px) {
            #ai-checkout-button {
                bottom: 20px;
                right: 20px;
                padding: 14px 20px;
                font-size: 14px;
            }

            #ai-chat-window {
                bottom: 80px;
                right: 20px;
                width: calc(100vw - 40px);
            }
        }
    `;

    // ═══════════════════════════════════════════════════════════════════
    // 🎯 SYSTEM PROMPT FOR AI
    // ═══════════════════════════════════════════════════════════════════
    
    const SYSTEM_PROMPT = `You are a data extraction assistant for a Ukrainian e-commerce checkout form.

Extract the following information from the user's natural language input:
- firstName (ім'я)
- lastName (прізвище)
- phone (телефон, can be +380... format)
- city (місто)
- delivery (доставка: "nova" for Нова Пошта or "ukr" for Укрпошта)
- branch (номер відділення Нової Пошти, e.g., "Відділення №5")
- payment (оплата: "online" for онлайн or "cod" for післяплата)
- telegram (нікнейм Telegram, e.g., @username)

IMPORTANT RULES:
1. If delivery is mentioned as "Нова Пошта", "НП", or branch number mentioned → delivery: "nova"
2. If "Укрпошта" or "Укр пошта" → delivery: "ukr"
3. Extract branch number from phrases like "відділення 5", "на п'яте відділення", "branch 5"
4. Phone must be in +380... format (convert if needed)
5. If payment is "післяплата" or "при отриманні" → payment: "cod"
6. If payment is "онлайн", "картка", "card" → payment: "online"

Output ONLY a valid JSON object. No explanations, no markdown.

Example input:
"Іван Петренко, +380501234567, Київ, відділення 12, оплата онлайн, @ivan_petrenko"

Example output:
{
  "firstName": "Іван",
  "lastName": "Петренко",
  "phone": "+380501234567",
  "city": "Київ",
  "delivery": "nova",
  "branch": "12",
  "payment": "online",
  "telegram": "@ivan_petrenko"
}`;

    // ═══════════════════════════════════════════════════════════════════
    // 🏗️ INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════
    
    function init() {
        injectStyles();
        createUI();
        attachEventListeners();
        console.log('✅ AI Checkout Assistant initialized');
    }

    function injectStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    function createUI() {
        // Floating Button
        const button = document.createElement('button');
        button.id = 'ai-checkout-button';
        button.innerHTML = `
            <span>✨</span>
            <span>${CONFIG.BUTTON_TEXT}</span>
        `;
        document.body.appendChild(button);

        // Chat Window
        const chatWindow = document.createElement('div');
        chatWindow.id = 'ai-chat-window';
        chatWindow.innerHTML = `
            <div class="ai-chat-header">
                <h3>🪄 ШІ Асистент</h3>
                <button class="ai-chat-close">✕</button>
            </div>
            <div class="ai-chat-body">
                <div class="ai-chat-example">
                    <strong>💡 Приклад запиту:</strong>
                    "Іван Шевченко, +380671234567, Київ, відділення 15, оплата онлайн, @ivan_shevchenko"
                </div>
                <textarea 
                    class="ai-chat-textarea" 
                    id="ai-input-text"
                    placeholder="Напишіть ваші дані тут...&#10;&#10;Наприклад:&#10;Марія Коваленко, +380501234567, Львів, відділення 3, післяплата, @maria_k"
                ></textarea>
                <div id="ai-messages"></div>
            </div>
            <div class="ai-chat-footer">
                <button class="ai-chat-submit" id="ai-submit-btn">
                    <span>🚀</span>
                    <span>Заповнити дані</span>
                </button>
            </div>
        `;
        document.body.appendChild(chatWindow);
    }

    function attachEventListeners() {
        // Toggle chat window
        document.getElementById('ai-checkout-button').addEventListener('click', () => {
            const chatWindow = document.getElementById('ai-chat-window');
            chatWindow.classList.toggle('show');
            if (chatWindow.classList.contains('show')) {
                document.getElementById('ai-input-text').focus();
            }
        });

        // Close chat window
        document.querySelector('.ai-chat-close').addEventListener('click', () => {
            document.getElementById('ai-chat-window').classList.remove('show');
        });

        // Submit button
        document.getElementById('ai-submit-btn').addEventListener('click', handleSubmit);

        // Enter key to submit (Ctrl+Enter)
        document.getElementById('ai-input-text').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                handleSubmit();
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🤖 AI PROCESSING
    // ═══════════════════════════════════════════════════════════════════
    
    async function handleSubmit() {
        const inputText = document.getElementById('ai-input-text').value.trim();
        const submitBtn = document.getElementById('ai-submit-btn');
        const messagesContainer = document.getElementById('ai-messages');

        if (!inputText) {
            showMessage('Будь ласка, введіть ваші дані', 'error');
            return;
        }

        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <div class="ai-spinner"></div>
            <span>Обробка...</span>
        `;
        messagesContainer.innerHTML = '';

        try {
            showMessage('🧠 ШІ аналізує ваші дані...', 'info');

            let extractedData;

            if (CONFIG.AI_PROVIDER === 'openai') {
                extractedData = await callOpenAI(inputText);
            } else if (CONFIG.AI_PROVIDER === 'gemini') {
                extractedData = await callGemini(inputText);
            } else {
                throw new Error('Invalid AI provider configured');
            }

            console.log('📦 Extracted data:', extractedData);

            // Fill form fields
            await fillCheckoutForm(extractedData);

            showMessage('✅ Дані заповнено! Будь ласка, перевірте їх та натисніть "Підтвердити замовлення".', 'success');

            // Auto-close chat after 3 seconds
            setTimeout(() => {
                document.getElementById('ai-chat-window').classList.remove('show');
            }, 3000);

        } catch (error) {
            console.error('❌ AI Processing Error:', error);
            showMessage(`❌ Помилка: ${error.message}`, 'error');
        } finally {
            // Reset button
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <span>🚀</span>
                <span>Заповнити дані</span>
            `;
        }
    }

    async function callOpenAI(userInput) {
        const response = await fetch(CONFIG.OPENAI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: CONFIG.OPENAI_MODEL,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userInput }
                ],
                temperature: 0.3,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'OpenAI API error');
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content.trim();

        // Parse JSON from AI response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('AI не повернув валідний JSON');
        }

        return JSON.parse(jsonMatch[0]);
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
                        text: `${SYSTEM_PROMPT}\n\nUser input:\n${userInput}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 500
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Gemini API error');
        }

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text.trim();

        // Parse JSON from AI response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('AI не повернув валідний JSON');
        }

        return JSON.parse(jsonMatch[0]);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 📝 FORM FILLING LOGIC
    // ═══════════════════════════════════════════════════════════════════
    
    async function fillCheckoutForm(data) {
        if (CONFIG.DEBUG) {
            console.log('═══════════════════════════════════════════════');
            console.log('📝 FILLING CHECKOUT FORM WITH DATA:');
            console.table(data);
            console.log('═══════════════════════════════════════════════');
        }

        // 1. Fill Name (multiple search strategies)
        if (data.firstName || data.lastName) {
            const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
            setFieldValue(['fullName', 'full-name', 'name', "ім'я", 'повне ім\'я'], fullName);
        }

        // 2. Fill Phone
        if (data.phone) {
            setFieldValue(['phone', 'tel', 'telephone', 'телефон', 'мобільний'], data.phone);
        }

        // 3. Fill Telegram
        if (data.telegram) {
            const telegram = data.telegram.startsWith('@') ? data.telegram : `@${data.telegram}`;
            setFieldValue(['telegram', 'tg', 'телеграм', 'telegram-username'], telegram);
        }

        // 4. Select Delivery Method
        if (data.delivery) {
            await selectDeliveryMethod(data.delivery);
            await new Promise(resolve => setTimeout(resolve, 400)); // Wait for delivery UI to update
        }

        // 5. Fill City (Nova Poshta specific)
        if (data.city && data.delivery === 'nova') {
            await fillNovaPoshtaCity(data.city);
        }

        // 6. Fill Branch (Nova Poshta)
        if (data.branch && data.delivery === 'nova') {
            await fillNovaPoshtaBranch(data.branch);
        }

        // 7. Fill Ukrposhta fields
        if (data.delivery === 'ukr' && data.city) {
            setFieldValue(['up-city-input', 'ukr-city', 'місто', 'city'], data.city);
        }

        // 8. Select Payment Method
        if (data.payment) {
            await selectPaymentMethod(data.payment);
        }

        if (CONFIG.DEBUG) {
            console.log('═══════════════════════════════════════════════');
            console.log('✅ FORM FILLING COMPLETED');
            console.log('═══════════════════════════════════════════════');
        }
    }

    /**
     * 🔥 CRITICAL: Force Update Logic
     * This is the fix - properly dispatches events so Nova Poshta recognizes changes
     */
    function setFieldValue(searchTerms, value) {
        if (CONFIG.DEBUG) console.log(`📝 Setting field [${searchTerms}] = "${value}"`);
        
        const field = findField(Array.isArray(searchTerms) ? searchTerms : [searchTerms]);
        
        if (field) {
            field.value = value;
            field.classList.add('field-highlight');
            
            // 🔥 THE FIX: Dispatch ALL events with bubbles: true
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            field.dispatchEvent(new Event('blur', { bubbles: true }));
            
            if (CONFIG.DEBUG) console.log(`✅ Set field "${field.id || field.name}" = "${value}"`);
            
            // Remove highlight after animation
            setTimeout(() => field.classList.remove('field-highlight'), 1500);
            
            return true;
        } else {
            if (CONFIG.DEBUG) console.warn(`⚠️ Could not find field for: [${searchTerms}]`);
            return false;
        }
    }
    
    /**
     * 🎯 Select Delivery Method (Smart)
     */
    async function selectDeliveryMethod(deliveryType) {
        if (CONFIG.DEBUG) console.log(`🚚 Selecting delivery: ${deliveryType}`);
        
        let searchTerms = [];
        if (deliveryType === 'nova') {
            searchTerms = ['нова пошта', 'nova poshta', 'нп', 'nova'];
        } else if (deliveryType === 'ukr') {
            searchTerms = ['укрпошта', 'ukrposhta', 'укр пошта', 'ukr'];
        }
        
        // Try data attribute first
        const deliveryCard = findClickable(searchTerms, 'data-delivery');
        
        if (deliveryCard) {
            deliveryCard.click();
            
            // 🔥 THE FIX: Dispatch events after click
            deliveryCard.dispatchEvent(new Event('change', { bubbles: true }));
            
            if (CONFIG.DEBUG) console.log(`✅ Selected delivery: ${deliveryType}`);
            
            // Wait for UI to update
            await new Promise(resolve => setTimeout(resolve, 400));
            return true;
        } else {
            if (CONFIG.DEBUG) console.warn(`⚠️ Delivery option not found: ${deliveryType}`);
            return false;
        }
    }

    /**
     * 📍 Fill Nova Poshta City (with autocomplete)
     */
    async function fillNovaPoshtaCity(cityName) {
        if (CONFIG.DEBUG) console.log(`📍 Filling Nova Poshta city: ${cityName}`);
        
        const cityInput = findField(['np-city-input', 'nova-city', 'місто нова пошта', 'city-nova']);
        
        if (!cityInput) {
            if (CONFIG.DEBUG) console.warn('⚠️ Nova Poshta city input not found');
            return false;
        }

        // Set value and trigger autocomplete
        cityInput.value = cityName;
        cityInput.classList.add('field-highlight');
        
        // 🔥 THE FIX: Dispatch ALL events
        cityInput.dispatchEvent(new Event('input', { bubbles: true }));
        cityInput.dispatchEvent(new Event('change', { bubbles: true }));
        cityInput.dispatchEvent(new Event('keyup', { bubbles: true }));
        
        if (CONFIG.DEBUG) console.log(`✅ Set Nova Poshta city: ${cityName}, waiting for autocomplete...`);

        // Wait for autocomplete suggestions
        await new Promise(resolve => setTimeout(resolve, 600));

        // Try to click first suggestion
        const suggestionsList = document.querySelector('#np-city-list, .city-suggestions, [id*="city"]');
        if (suggestionsList) {
            const firstSuggestion = suggestionsList.querySelector('li, .suggestion-item, option');
            if (firstSuggestion) {
                firstSuggestion.click();
                if (CONFIG.DEBUG) console.log('✅ Selected first city suggestion');
                return true;
            }
        }
        
        if (CONFIG.DEBUG) console.warn('⚠️ No autocomplete suggestions found');
        return false;
    }

    /**
     * 🏢 Fill Nova Poshta Branch
     */
    async function fillNovaPoshtaBranch(branchNumber) {
        if (CONFIG.DEBUG) console.log(`🏢 Filling branch number: ${branchNumber}`);
        
        // Wait for warehouse select to be populated
        await new Promise(resolve => setTimeout(resolve, 900));

        const warehouseSelect = findField(['np-warehouse-select', 'warehouse', 'branch', 'відділення', 'nova-warehouse']);
        
        if (!warehouseSelect) {
            if (CONFIG.DEBUG) console.warn('⚠️ Nova Poshta warehouse select not found');
            return false;
        }

        // Find option with branch number
        const options = Array.from(warehouseSelect.options || warehouseSelect.querySelectorAll('option'));
        const branchOption = options.find(opt => {
            const text = opt.textContent.toLowerCase();
            return text.includes(`№${branchNumber}`) || 
                   text.includes(`#${branchNumber}`) ||
                   text.includes(`відділення ${branchNumber}`) ||
                   text.match(new RegExp(`\\b${branchNumber}\\b`));
        });

        if (branchOption) {
            warehouseSelect.value = branchOption.value;
            warehouseSelect.classList.add('field-highlight');
            
            // 🔥 THE FIX: Dispatch events
            warehouseSelect.dispatchEvent(new Event('change', { bubbles: true }));
            warehouseSelect.dispatchEvent(new Event('input', { bubbles: true }));
            
            if (CONFIG.DEBUG) console.log(`✅ Selected branch: ${branchNumber}`);
            return true;
        } else {
            if (CONFIG.DEBUG) {
                console.warn(`⚠️ Branch ${branchNumber} not found. Available options:`);
                console.log(options.map(opt => opt.textContent));
            }
            return false;
        }
    }

    /**
     * 💳 Select Payment Method (Smart)
     */
    async function selectPaymentMethod(paymentType) {
        if (CONFIG.DEBUG) console.log(`💳 Selecting payment: ${paymentType}`);
        
        let searchTerms = [];
        if (paymentType === 'online') {
            searchTerms = ['онлайн', 'online', 'картка', 'card', 'оплата онлайн'];
        } else if (paymentType === 'cod') {
            searchTerms = ['післяплата', 'при отриманні', 'cod', 'cash on delivery', 'готівка'];
        }
        
        // Try data attribute first
        const paymentCard = findClickable(searchTerms, 'data-payment');
        
        if (paymentCard) {
            paymentCard.click();
            
            // 🔥 THE FIX: Dispatch events
            paymentCard.dispatchEvent(new Event('change', { bubbles: true }));
            
            if (CONFIG.DEBUG) console.log(`✅ Selected payment: ${paymentType}`);
            return true;
        } else {
            if (CONFIG.DEBUG) console.warn(`⚠️ Payment option not found: ${paymentType}`);
            return false;
        }
    }

    /**
     * 💬 Show Message to User
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
    // 🚀 AUTO-INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

        // Auto-remove after 5 seconds
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => message.remove(), 300);
        }, 5000);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🚀 AUTO-INIT
    // ═══════════════════════════════════════════════════════════════════
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
