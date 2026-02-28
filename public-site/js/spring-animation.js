/**
 * Spring Animation - Falling Sakura Petals
 * Lightweight CSS-based animation for a fresh spring atmosphere
 * Excludes checkout and thank-you pages for distraction-free conversion
 */

(function() {
    'use strict';

    // Check if animation should run on this page
    const pathname = window.location.pathname.toLowerCase();
    const excludedPages = ['checkout', 'success', 'thank-you'];
    const shouldRun = !excludedPages.some(page => pathname.includes(page));

    if (!shouldRun) {
        console.log('🌸 Spring animation disabled on checkout/success pages');
        return;
    }

    // Inject CSS animations
    function injectStyles() {
        const style = document.createElement('style');
        style.id = 'spring-animation-styles';
        style.textContent = `
            #spring-animation {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9999;
                overflow: hidden;
            }

            .sakura-petal {
                position: absolute;
                top: -50px;
                pointer-events: none;
                user-select: none;
                font-size: 20px;
                opacity: 0.7;
                animation: fall linear infinite, sway ease-in-out infinite, rotate linear infinite;
            }

            @keyframes fall {
                0% {
                    top: -50px;
                }
                100% {
                    top: 100vh;
                }
            }

            @keyframes sway {
                0%, 100% {
                    transform: translateX(0);
                }
                50% {
                    transform: translateX(30px);
                }
            }

            @keyframes rotate {
                0% {
                    transform: rotate(0deg);
                }
                100% {
                    transform: rotate(360deg);
                }
            }

            /* Subtle glow effect for spring feel */
            .sakura-petal::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(255, 182, 193, 0.3) 0%, transparent 70%);
                pointer-events: none;
            }

            /* Performance optimization: will-change hint */
            .sakura-petal {
                will-change: transform, top;
            }
        `;
        document.head.appendChild(style);
    }

    // Create sakura petals
    function createPetals() {
        const container = document.createElement('div');
        container.id = 'spring-animation';
        
        const petalEmojis = ['🌸', '💮', '🌸', '💮', '🌸']; // More 🌸 for variety
        const petalCount = 18; // Sweet spot between beauty and performance

        for (let i = 0; i < petalCount; i++) {
            const petal = document.createElement('div');
            petal.className = 'sakura-petal';
            petal.textContent = petalEmojis[Math.floor(Math.random() * petalEmojis.length)];
            
            // Randomize position and animation
            const leftPos = Math.random() * 100;
            const fallDuration = 12 + Math.random() * 8; // 12-20 seconds
            const swayDuration = 3 + Math.random() * 2; // 3-5 seconds
            const rotateDuration = 5 + Math.random() * 5; // 5-10 seconds
            const animationDelay = Math.random() * 5; // Stagger start
            const size = 0.7 + Math.random() * 0.6; // 0.7x - 1.3x size
            const opacity = 0.5 + Math.random() * 0.3; // 0.5 - 0.8 opacity
            
            petal.style.left = `${leftPos}%`;
            petal.style.fontSize = `${20 * size}px`;
            petal.style.opacity = opacity;
            petal.style.animationDuration = `${fallDuration}s, ${swayDuration}s, ${rotateDuration}s`;
            petal.style.animationDelay = `${animationDelay}s, ${animationDelay}s, ${animationDelay}s`;
            
            container.appendChild(petal);
        }

        document.body.appendChild(container);
        console.log('🌸 Spring animation initialized with', petalCount, 'petals');
    }

    // Initialize animation when DOM is ready
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                injectStyles();
                createPetals();
            });
        } else {
            injectStyles();
            createPetals();
        }
    }

    // Start the animation
    init();

    // Cleanup function (if needed for SPA navigation)
    window.removeSpringAnimation = function() {
        const container = document.getElementById('spring-animation');
        const styles = document.getElementById('spring-animation-styles');
        if (container) container.remove();
        if (styles) styles.remove();
        console.log('🌸 Spring animation removed');
    };

})();
