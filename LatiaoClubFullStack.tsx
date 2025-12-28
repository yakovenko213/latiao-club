<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Latiao Club | Premium Rewards</title>
    <style>
        :root {
            --primary: #ff0055;
            --primary-glow: rgba(255, 0, 85, 0.5);
            --secondary: #00f2ff;
            --bg-dark: #0a0a0c;
            --card-dark: rgba(255, 255, 255, 0.05);
            --text-main: #ffffff;
            --text-dim: #a0a0a0;
            --glass: rgba(20, 20, 25, 0.8);
            --border: rgba(255, 255, 255, 0.1);
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .light-theme {
            --bg-dark: #f0f2f5;
            --card-dark: #ffffff;
            --text-main: #1a1a1a;
            --text-dim: #666666;
            --glass: rgba(255, 255, 255, 0.9);
            --border: rgba(0, 0, 0, 0.1);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        body {
            background-color: var(--bg-dark);
            color: var(--text-main);
            min-height: 100vh;
            overflow-x: hidden;
            transition: var(--transition);
        }

        /* Background Glows */
        .glow-bg {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            z-index: -1;
            overflow: hidden;
        }
        .blob {
            position: absolute;
            width: 400px;
            height: 400px;
            background: var(--primary-glow);
            filter: blur(80px);
            border-radius: 50%;
            animation: move 20s infinite alternate;
        }
        @keyframes move {
            from { transform: translate(-10%, -10%); }
            to { transform: translate(100%, 80%); }
        }

        /* Typography & Layout */
        .container {
            max-width: 500px;
            margin: 0 auto;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .glass-card {
            background: var(--glass);
            backdrop-filter: blur(15px);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 25px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            margin-bottom: 20px;
        }

        h1, h2, h3 { font-weight: 800; letter-spacing: -0.5px; }
        .neon-text {
            color: var(--primary);
            text-shadow: 0 0 10px var(--primary-glow);
        }

        /* Forms */
        input, select {
            width: 100%;
            padding: 14px 20px;
            background: rgba(255,255,255,0.05);
            border: 1px solid var(--border);
            border-radius: 12px;
            color: var(--text-main);
            margin-bottom: 15px;
            outline: none;
            transition: var(--transition);
        }
        input:focus { border-color: var(--primary); box-shadow: 0 0 10px var(--primary-glow); }

        .btn {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 12px;
            font-weight: bold;
            cursor: pointer;
            transition: var(--transition);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .btn-primary { background: var(--primary); color: white; box-shadow: 0 4px 15px var(--primary-glow); }
        .btn-primary:hover { transform: translateY(-2px); filter: brightness(1.2); }
        .btn-secondary { background: var(--card-dark); color: var(--text-main); border: 1px solid var(--border); }

        /* Progress Bar */
        .progress-container { background: rgba(255,255,255,0.1); height: 10px; border-radius: 5px; margin: 15px 0; overflow: hidden; }
        .progress-bar { height: 100%; background: linear-gradient(90deg, var(--primary), var(--secondary)); width: 0%; transition: width 1s ease-out; }

        /* Slots/Game */
        .slot-machine {
            text-align: center;
            padding: 30px;
            border: 2px dashed var(--primary);
        }
        .slot-box {
            font-size: 40px;
            margin: 20px 0;
            display: flex;
            justify-content: center;
            gap: 15px;
        }
        .slot-item {
            background: var(--card-dark);
            padding: 10px;
            border-radius: 10px;
            min-width: 60px;
            display: inline-block;
        }
        .spinning { animation: shake 0.1s infinite; }
        @keyframes shake {
            0% { transform: translateY(-2px); }
            100% { transform: translateY(2px); }
        }

        /* Promo Codes */
        .promo-list { display: grid; gap: 10px; }
        .promo-card {
            background: rgba(255,255,255,0.03);
            border-left: 4px solid var(--secondary);
            padding: 15px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .promo-card.used { opacity: 0.5; border-left-color: #666; text-decoration: line-through; }

        /* Navigation */
        .nav-bar {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 400px;
            background: var(--glass);
            backdrop-filter: blur(20px);
            border-radius: 50px;
            display: flex;
            justify-content: space-around;
            padding: 10px;
            border: 1px solid var(--border);
            z-index: 100;
        }
        .nav-item { color: var(--text-dim); cursor: pointer; font-size: 12px; text-align: center; }
        .nav-item.active { color: var(--primary); }

        /* Admin Styles */
        .admin-panel { max-width: 900px !important; }
        .admin-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .stat-card { background: var(--card-dark); padding: 20px; border-radius: 15px; border: 1px solid var(--border); }
        .user-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .user-table th, .user-table td { text-align: left; padding: 12px; border-bottom: 1px solid var(--border); }
        
        .hidden { display: none !important; }

        /* Micro-interactions */
        .tap-scale:active { transform: scale(0.95); }
    </style>
</head>
<body>

<div class="glow-bg"><div class="blob"></div></div>

<nav id="main-nav" class="nav-bar hidden">
    <div class="nav-item active" onclick="showScreen('client-home')">🏠<br>Home</div>
    <div class="nav-item" onclick="showScreen('promo-screen')">🎁<br>Promos</div>
    <div class="nav-item" onclick="showScreen('game-screen')">🎰<br>Spin</div>
    <div class="nav-item" onclick="toggleAdmin()">⚙️<br>Admin</div>
</nav>

<div class="container">
    
    <div style="position: absolute; top: 20px; right: 20px; cursor: pointer; z-index: 10;" onclick="toggleTheme()">🌓</div>

    <section id="login-screen" class="glass-card" style="margin-top: 20vh;">
        <h1 class="neon-text" style="text-align: center; margin-bottom: 10px;">LATIAO CLUB</h1>
        <p style="text-align: center; color: var(--text-dim); margin-bottom: 30px;">Premium Asian Snacks Rewards</p>
        <input type="text" id="login-input" placeholder="Phone number or Nickname...">
        <button class="btn btn-primary tap-scale" onclick="handleLogin()">ENTER CLUB</button>
    </section>

    <section id="client-home" class="hidden">
        <div class="glass-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h2 id="user-name-display">Welcome Back!</h2>
                    <p id="user-rank" style="color: var(--secondary); font-weight: bold; margin-top: 5px;">VIP Member</p>
                </div>
                <div id="user-points" style="font-size: 24px; font-weight: 800;">1,250 <span style="font-size: 12px; color: var(--text-dim);">XP</span></div>
            </div>
            
            <div class="progress-container">
                <div id="user-progress" class="progress-bar"></div>
            </div>
            <p id="progress-text" style="font-size: 12px; color: var(--text-dim);"></p>
        </div>

        <h3 style="margin-bottom: 15px;">Recent History</h3>
        <div id="history-list" class="promo-list">
            </div>
        <button class="btn btn-secondary" style="margin-top: 20px;" onclick="logout()">LOGOUT</button>
    </section>

    <section id="promo-screen" class="hidden">
        <h2 class="neon-text" style="margin-bottom: 20px;">My Rewards</h2>
        <div id="active-promos" class="promo-list">
            </div>
    </section>

    <section id="game-screen" class="hidden">
        <div class="glass-card slot-machine">
            <h3>Daily Fortune</h3>
            <p style="color: var(--text-dim); font-size: 13px;">Spin to win exclusive discounts</p>
            <div class="slot-box">
                <div class="slot-item" id="slot-1">🌶️</div>
                <div class="slot-item" id="slot-2">🥢</div>
                <div class="slot-item" id="slot-3">🍜</div>
            </div>
            <button id="spin-btn" class="btn btn-primary tap-scale" onclick="handleSpin()">SPIN NOW</button>
            <p id="spin-timer" style="margin-top: 15px; font-size: 12px; color: var(--primary);"></p>
        </div>
    </section>

    <section id="admin-auth" class="hidden glass-card">
        <h3>Admin Access</h3>
        <input type="password" id="admin-pass" placeholder="Password...">
        <button class="btn btn-primary" onclick="verifyAdmin()">UNLOCK</button>
        <button class="btn btn-secondary" onclick="showScreen('client-home')" style="margin-top: 10px;">CANCEL</button>
    </section>

    <section id="admin-dashboard" class="hidden admin-panel">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 class="neon-text">Control Center</h2>
            <button class="btn btn-secondary" style="width: auto; padding: 5px 15px;" onclick="showScreen('client-home')">Exit</button>
        </div>

        <div class="admin-grid">
            <div class="stat-card">
                <small>Total Users</small>
                <h2 id="stat-users">0</h2>
            </div>
            <div class="stat-card">
                <small>Promos Used</small>
                <h2 id="stat-promos">0</h2>
            </div>
        </div>

        <div class="glass-card">
            <h3>User Management</h3>
            <input type="text" id="user-search" placeholder="Search by name/phone..." oninput="renderAdminUsers()">
            <div style="overflow-x: auto;">
                <table class="user-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>XP</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="admin-user-list"></tbody>
                </table>
            </div>
        </div>

        <div class="glass-card">
            <h3>Create Promo Code</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                <input type="text" id="new-promo-code" placeholder="CODE (e.g. HOT25)">
                <input type="number" id="new-promo-val" placeholder="Value (%)">
                <input type="number" id="new-promo-min" placeholder="Min Order">
                <input type="date" id="new-promo-expiry">
            </div>
            <button class="btn btn-primary" onclick="createPromo()">Generate Promo</button>
        </div>
    </section>

</div>

<script>
    // --- DATABASE / STATE ---
    const DB_KEY = 'latiao_db_v1';
    let state = {
        users: [],
        promos: [],
        currentUser: null,
        isAdmin: false
    };

    const RANKS = [
        { name: 'New', min: 0, max: 999 },
        { name: 'Regular', min: 1000, max: 4999 },
        { name: 'VIP', min: 5000, max: 14999 },
        { name: 'Legend', min: 15000, max: Infinity }
    ];

    // --- INITIALIZATION ---
    function init() {
        const saved = localStorage.getItem(DB_KEY);
        if (saved) {
            state = JSON.parse(saved);
        } else {
            // Demo Data
            state.users = [
                { id: '1', name: 'Admin User', phone: '000', xp: 25000, status: 'active', history: [], lastSpin: null },
                { id: '2', name: 'Ivan G.', phone: '0971234567', xp: 1200, status: 'active', history: [], lastSpin: null }
            ];
            state.promos = [
                { id: 'p1', code: 'WELCOME20', val: 20, min: 200, expiry: '2026-12-31', usedBy: [] },
                { id: 'p2', code: 'LATIAO_KING', val: 50, min: 1000, expiry: '2026-06-01', usedBy: [] }
            ];
            saveState();
        }
    }

    function saveState() {
        localStorage.setItem(DB_KEY, JSON.stringify(state));
    }

    // --- NAVIGATION ---
    function showScreen(screenId) {
        document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
        document.getElementById(screenId).classList.remove('hidden');
        
        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(n => {
            n.classList.remove('active');
            if(n.innerText.toLowerCase().includes(screenId.split('-')[0])) n.classList.add('active');
        });

        if(screenId === 'client-home') renderProfile();
        if(screenId === 'promo-screen') renderPromos();
        if(screenId === 'admin-dashboard') renderAdmin();
    }

    // --- AUTH ---
    function handleLogin() {
        const val = document.getElementById('login-input').value.trim();
        if(!val) return alert('Enter something!');

        let user = state.users.find(u => u.phone === val || u.name === val);
        if(!user) {
            user = { id: Date.now().toString(), name: val, phone: val, xp: 0, status: 'active', history: [], lastSpin: null };
            state.users.push(user);
            saveState();
        }

        if(user.status === 'blocked') return alert('Account suspended. Contact Admin.');

        state.currentUser = user;
        document.getElementById('main-nav').classList.remove('hidden');
        showScreen('client-home');
    }

    function logout() {
        state.currentUser = null;
        document.getElementById('main-nav').classList.add('hidden');
        showScreen('login-screen');
    }

    function toggleAdmin() {
        if(state.isAdmin) showScreen('admin-dashboard');
        else showScreen('admin-auth');
    }

    function verifyAdmin() {
        const pass = document.getElementById('admin-pass').value;
        if(pass === 'latiao2026') {
            state.isAdmin = true;
            showScreen('admin-dashboard');
        } else {
            alert('Incorrect passcode.');
        }
    }

    // --- CLIENT LOGIC ---
    function renderProfile() {
        const user = state.currentUser;
        const rank = RANKS.find(r => user.xp >= r.min && user.xp <= r.max);
        
        document.getElementById('user-name-display').innerText = `Hi, ${user.name}!`;
        document.getElementById('user-rank').innerText = rank.name;
        document.getElementById('user-points').innerHTML = `${user.xp.toLocaleString()} <span style="font-size: 12px; color: var(--text-dim);">XP</span>`;
        
        const nextRank = RANKS[RANKS.indexOf(rank) + 1] || rank;
        const progress = rank.max === Infinity ? 100 : ((user.xp - rank.min) / (rank.max - rank.min)) * 100;
        document.getElementById('user-progress').style.width = `${progress}%`;
        document.getElementById('progress-text').innerText = rank.max === Infinity ? 'Max Level Reached' : `${nextRank.min - user.xp} XP to ${nextRank.name}`;

        const histHtml = user.history.length 
            ? user.history.map(h => `<div class="promo-card"><span>${h.msg}</span><small>${h.date}</small></div>`).join('')
            : '<p style="color:var(--text-dim); text-align:center;">No history yet</p>';
        document.getElementById('history-list').innerHTML = histHtml;
    }

    function renderPromos() {
        const html = state.promos.map(p => {
            const isUsed = p.usedBy.includes(state.currentUser.id);
            return `
                <div class="promo-card ${isUsed ? 'used' : ''}">
                    <div>
                        <strong style="color:var(--primary)">${p.code}</strong><br>
                        <small>${p.val}% off | Min: ${p.min}₴</small>
                    </div>
                    <div style="text-align:right">
                        <small>${p.expiry}</small><br>
                        <strong>${isUsed ? 'USED' : 'ACTIVE'}</strong>
                    </div>
                </div>
            `;
        }).join('');
        document.getElementById('active-promos').innerHTML = html || 'No promos available';
    }

    // --- GAME LOGIC ---
    function handleSpin() {
        const user = state.currentUser;
        const today = new Date().toDateString();
        
        if(user.lastSpin === today) {
            return alert('You already had your fortune today! Come back tomorrow.');
        }

        const btn = document.getElementById('spin-btn');
        const slots = [document.getElementById('slot-1'), document.getElementById('slot-2'), document.getElementById('slot-3')];
        const emojis = ['🌶️', '🥢', '🍜', '🍤', '🔥', '🥡'];
        
        btn.disabled = true;
        slots.forEach(s => s.classList.add('spinning'));

        setTimeout(() => {
            slots.forEach(s => {
                s.classList.remove('spinning');
                s.innerText = emojis[Math.floor(Math.random() * emojis.length)];
            });

            // Logic: 10% chance to win random promo
            const won = Math.random() > 0.7;
            if(won) {
                const bonusXp = Math.floor(Math.random() * 50) + 10;
                user.xp += bonusXp;
                user.history.unshift({ msg: `Won ${bonusXp} XP from Spin!`, date: new Date().toLocaleDateString() });
                alert(`JACKPOT! You won ${bonusXp} XP!`);
            } else {
                alert('Better luck tomorrow! You gained 5 XP for trying.');
                user.xp += 5;
            }

            user.lastSpin = today;
            saveState();
            renderProfile();
            btn.disabled = false;
        }, 2000);
    }

    // --- ADMIN LOGIC ---
    function renderAdmin() {
        document.getElementById('stat-users').innerText = state.users.length;
        document.getElementById('stat-promos').innerText = state.promos.reduce((acc, p) => acc + p.usedBy.length, 0);
        renderAdminUsers();
    }

    function renderAdminUsers() {
        const search = document.getElementById('user-search').value.toLowerCase();
        const filtered = state.users.filter(u => u.name.toLowerCase().includes(search) || u.phone.includes(search));
        
        const html = filtered.map(u => `
            <tr>
                <td>${u.name}<br><small>${u.phone}</small></td>
                <td><input type="number" value="${u.xp}" onchange="updateUserXp('${u.id}', this.value)" style="width:80px; margin:0; padding:5px;"></td>
                <td><span style="color: ${u.status === 'active' ? '#00ff00' : '#ff0000'}">${u.status}</span></td>
                <td>
                    <button onclick="toggleUserStatus('${u.id}')">🚫</button>
                    <button onclick="giftPromo('${u.id}')">🎁</button>
                </td>
            </tr>
        `).join('');
        document.getElementById('admin-user-list').innerHTML = html;
    }

    function updateUserXp(id, val) {
        const user = state.users.find(u => u.id === id);
        user.xp = parseInt(val);
        saveState();
    }

    function toggleUserStatus(id) {
        const user = state.users.find(u => u.id === id);
        user.status = user.status === 'active' ? 'blocked' : 'active';
        saveState();
        renderAdminUsers();
    }

    function createPromo() {
        const code = document.getElementById('new-promo-code').value.toUpperCase();
        const val = document.getElementById('new-promo-val').value;
        const min = document.getElementById('new-promo-min').value;
        const expiry = document.getElementById('new-promo-expiry').value;

        if(!code || !val) return alert('Fill details');

        state.promos.push({
            id: Date.now().toString(),
            code, val, min, expiry, usedBy: []
        });
        saveState();
        alert('Promo Created!');
        renderAdmin();
    }

    function giftPromo(userId) {
        const code = prompt('Enter special code to gift this user:');
        if(!code) return;
        const user = state.users.find(u => u.id === userId);
        user.history.unshift({ msg: `Received special promo: ${code}`, date: new Date().toLocaleDateString() });
        saveState();
        alert('Promo gifted to user history!');
    }

    // --- UTILS ---
    function toggleTheme() {
        document.body.classList.toggle('light-theme');
    }

    // Start
    init();
</script>

</body>
</html>
