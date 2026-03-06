// ============================================
// 🛑 HARD IP BLOCKER — latiao-snack.com.ua
// ============================================
// Runs immediately at page load.
// Hides page > fetches IP > checks Firestore
// blacklist > blocks or reveals.

(async function hardIpBlock() {
    'use strict';

    // ── Step 0: Instantly hide the page to prevent content flash ──
    const hideStyle = document.createElement('style');
    hideStyle.id = '__latiao_hide__';
    hideStyle.textContent = 'html{visibility:hidden!important;pointer-events:none!important}';
    document.head.appendChild(hideStyle);

    function reveal() {
        document.getElementById('__latiao_hide__')?.remove();
    }

    function showBlockScreen(ip) {
        document.documentElement.innerHTML = `<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>⛔ Доступ заблоковано</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;min-height:100vh;background:#000}
body{
  display:flex;align-items:center;justify-content:center;
  padding:24px;font-family:'Courier New',Courier,monospace
}
.container{
  max-width:600px;width:100%;
  display:flex;flex-direction:column;align-items:center;
  gap:24px;text-align:center
}
h1{
  font-size:clamp(22px,5vw,38px);font-weight:700;
  color:#FF0000;letter-spacing:3px;text-transform:uppercase;
  line-height:1.3
}
.lines{
  display:flex;flex-direction:column;gap:12px;width:100%
}
.lines p{
  font-size:clamp(14px,2.5vw,17px);color:#FF0000;
  line-height:1.6;letter-spacing:.5px
}
.divider{width:100%;height:1px;background:#FF0000;opacity:.35}
@keyframes bounce{
  0%,100%{transform:translateY(0)}
  50%{transform:translateY(10px)}
}
.arrow-down{font-size:34px;animation:bounce 1.2s ease-in-out infinite}
.cta-btn{
  display:inline-block;background:#FF0000;color:#000;
  font-family:'Courier New',Courier,monospace;font-weight:700;
  font-size:16px;letter-spacing:1.5px;padding:15px 40px;border-radius:4px;
  text-decoration:none;box-shadow:0 0 15px #FF0000
}
.cta-btn:hover{background:#cc0000;box-shadow:0 0 30px #FF0000}
</style>
</head>
<body>
<div class="container">
  <h1>⛔ Latiao Security System</h1>
  <div class="divider"></div>
  <div class="lines">
    <p>Ми помітили, що ви покинули кошик з латяо.</p>
    <p>Система безпеки активована.</p>
    <p>Щоб знову потрапити на сайт напишіть нам</p>
  </div>
  <div class="arrow-down">⬇️</div>
  <a class="cta-btn" href="https://t.me/sales_latiao">✉️ Написати менеджеру</a>
</div>
</body>
</html>`;
        try { window.stop(); } catch (e) { /* ignore */ }
    }

    // ── Short cache: only for "not-blocked" state (5 min) ──
    const CACHE_KEY = 'latiao_bl2_';
    const CACHE_TTL = 5 * 60 * 1000;

    try {
        // ── Step 1: Fetch visitor IP (3 s hard timeout) ──
        let ip = null;
        try {
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), 3000);
            const r = await fetch('https://api.ipify.org?format=json', { signal: ctrl.signal });
            clearTimeout(t);
            ip = (await r.json()).ip || null;
        } catch (_) { /* network / timeout */ }

        if (!ip) { reveal(); return; }

        // ── Step 2: Check cache (only for "safe" IPs) ──
        try {
            const c = JSON.parse(localStorage.getItem(CACHE_KEY + ip) || 'null');
            if (c && c.safe === true && (Date.now() - c.t) < CACHE_TTL) {
                reveal(); return;
            }
        } catch (_) { /* ignore */ }

        // ── Step 3: Query Firestore ──
        const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

        const cfg = {
            apiKey: 'AIzaSyDyQvItRyL4IKl9NmEItswwPOEiKAbWkMw',
            authDomain: 'my-magazin-81c96.firebaseapp.com',
            projectId: 'my-magazin-81c96',
            storageBucket: 'my-magazin-81c96.firebasestorage.app',
            messagingSenderId: '129061757346',
            appId: '1:129061757346:web:3e7bc5838cc5f7bda992fb'
        };
        const apps = getApps();
        const fbApp = apps.length ? apps[0] : initializeApp(cfg);
        const db = getFirestore(fbApp);

        const snap = await getDoc(doc(db, 'blacklist', ip));

        if (snap.exists()) {
            // ── BLOCKED ──
            showBlockScreen(ip);
            return;
        }

        // ── NOT blocked: cache safe state and reveal ──
        try {
            localStorage.setItem(CACHE_KEY + ip, JSON.stringify({ safe: true, t: Date.now() }));
        } catch (_) { /* ignore */ }
        reveal();

    } catch (err) {
        // Fail open — never lock out users due to errors
        reveal();
    }
})();
