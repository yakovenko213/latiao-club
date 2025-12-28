<!DOCTYPE html>
<html lang="uk" class="bg-slate-50/50">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Latiao Finance | Enterprise v14.1 Mobile Ready</title>
    
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Manrope', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
                    colors: { 
                        brand: { 50: '#fff1ec', 100: '#ffe4d9', 500: '#FF5722', 600: '#ea580c', 700: '#c2410c' },
                        slate: { 850: '#172033' }
                    },
                    boxShadow: {
                        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -2px rgba(0, 0, 0, 0.03)',
                        'glow-brand': '0 0 20px -5px rgba(255, 87, 34, 0.4)'
                    }
                }
            }
        }
    </script>
    <style>
        body { color: #1e293b; -webkit-tap-highlight-color: transparent; }
        main { background-image: radial-gradient(circle at center, #f1f5f9 1px, transparent 1px); background-size: 40px 40px; }
        .sidebar-link { transition: all 0.2s ease-in-out; }
        .sidebar-link.active { background: linear-gradient(135deg, #FF5722 0%, #ea580c 100%); color: white; box-shadow: 0 8px 16px -4px rgba(255, 87, 34, 0.3); border-radius: 16px; }
        .sidebar-link:hover:not(.active) { background: #fff1ec; color: #ea580c; border-radius: 16px; }
        .card-modern { background: white; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05); }
        .fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .logo-mono { background-image: url('https://multicast.com.ua/wp-content/uploads/2024/04/monobank-logo.png'); background-size: contain; background-repeat: no-repeat; background-position: center; }
        .logo-nova { background-image: url('https://novapay.ua/wp-content/themes/novapay/assets/img/logo.svg'); background-size: contain; background-repeat: no-repeat; background-position: center; }
        
        /* Mobile Navigation Bottom Bar */
        @media (max-width: 768px) {
            .sidebar-nav { position: fixed; bottom: 0; left: 0; right: 0; background: white; height: 70px; display: flex !important; flex-direction: row !important; border-top: 1px solid #e2e8f0; padding: 5px !important; z-index: 999; }
            .sidebar-nav button { flex: 1; flex-direction: column; font-size: 9px !important; gap: 4px !important; padding: 5px !important; background: transparent !important; box-shadow: none !important; color: #64748b !important; }
            .sidebar-nav button.active { color: #FF5722 !important; }
            .sidebar-nav .text-xs, .sidebar-nav .p-8, .sidebar-nav .pb-8, .sidebar-nav .p-4 { display: none !important; }
            .sidebar-nav .sidebar-logo-container { display: none !important; }
            main { padding: 15px !important; padding-bottom: 90px !important; }
            .hero-stats { grid-template-columns: 1fr !important; }
            .card-modern { padding: 20px !important; }
            .mobile-hide { display: none !important; }
        }
    </style>
</head>
<body>

<div id="root"></div>

<script type="text/babel" data-type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
    import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, setDoc, getDoc, writeBatch, getDocs, limit, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
    import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

    // --- FIREBASE CONFIG ---
    const firebaseConfig = {
      apiKey: "AIzaSyDIk302oYXye-r4hRE-EB16N6K3T31g1uk",
      authDomain: "latiao-finance.firebaseapp.com",
      projectId: "latiao-finance",
      storageBucket: "latiao-finance.firebasestorage.app",
      messagingSenderId: "858773999156",
      appId: "1:858773999156:web:fe8f4907314f83c9a88461"
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    try { setPersistence(auth, browserLocalPersistence).catch(console.error); } catch(e) {}

    const { useState, useEffect, useMemo, memo } = React;

    const Icon = ({ name, size = 18, className }) => {
        useEffect(() => { try { if(window.lucide) window.lucide.createIcons(); } catch(e){} }, [name]);
        return <i data-lucide={name} width={size} height={size} className={className}></i>;
    };

    const DEFAULT_CATEGORIES = {
        income: ['Продажі', 'Кешбек', 'Повернення', 'Інше'],
        expense: ['Закупівля (COGS)', 'Реклама', 'Логістика', 'Пакування', 'Зарплата', 'Податки', 'Оренда', 'Комісії', 'Знижки', 'Інше']
    };

    const ALL_VIEWS = [
        {id:'dashboard', label:'Огляд', icon:'layout-grid'},
        {id:'ops', label:'Операції', icon:'list-checks'},
        {id:'pnl', label:'P&L', icon:'pie-chart'},
        {id:'cashflow', label:'Потік', icon:'banknote'},
        {id:'dividends', label:'Дивіденди', icon:'gem'},
        {id:'managers', label:'Команда', icon:'users-round'},
        {id:'settings', label:'Налашт', icon:'sliders-horizontal'}
    ];

    // --- COMPONENTS ---

    const DashboardView = memo(({ metrics, transactions, setView }) => {
        const isHealthy = metrics.margin > 20;
        return (
            <div className="space-y-6 md:space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 hero-stats">
                    <div className="bg-slate-900 text-white p-6 rounded-[28px] shadow-lg relative overflow-hidden group border border-slate-800">
                        <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"><Icon name="wallet" size={100}/></div>
                        <div className="relative z-10">
                            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Icon name="wallet" size={12} className="text-brand-500"/> Капітал</div>
                            <div className="text-3xl font-mono font-bold">{metrics.totalCash.toLocaleString()} ₴</div>
                        </div>
                    </div>
                    <div className="card-modern p-6 border-t-4 border-emerald-500">
                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Чистий Прибуток</div>
                        <div className={`text-3xl font-mono font-bold ${metrics.net >= 0 ? 'text-slate-900' : 'text-red-600'}`}>{metrics.net.toLocaleString()} ₴</div>
                    </div>
                    <div className="card-modern p-6 border-t-4 border-brand-500">
                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Запас ходу</div>
                        <div className="text-3xl font-mono font-bold text-brand-600">{metrics.runway} <span className="text-xs font-sans">днів</span></div>
                    </div>
                    <div className={`card-modern p-6 flex flex-col justify-center items-center border-t-4 ${isHealthy ? 'border-emerald-500' : 'border-red-500'}`}>
                        <div className="text-slate-500 text-[10px] font-bold uppercase mb-1">Статус</div>
                        <div className={`text-lg font-black ${isHealthy ? 'text-emerald-600' : 'text-red-600'}`}>{isHealthy ? "OK" : "RISK"}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="card-modern p-5 flex flex-col justify-between h-32 border-b-4 border-black">
                            <div className="logo-mono w-8 h-8"></div>
                            <div className="font-mono font-bold text-lg">{metrics.balances.mono.toLocaleString()} ₴</div>
                        </div>
                        <div className="card-modern p-5 flex flex-col justify-between h-32 border-b-4 border-red-500">
                            <div className="logo-nova w-8 h-8"></div>
                            <div className="font-mono font-bold text-lg">{metrics.balances.nova.toLocaleString()} ₴</div>
                        </div>
                        <div className="card-modern p-5 h-32 sm:col-span-2 flex flex-col justify-between border-b-4 border-emerald-500 bg-emerald-50/20">
                            <div className="text-[10px] font-bold uppercase text-emerald-800 tracking-widest flex items-center gap-2"><Icon name="banknote" size={14}/> Готівка</div>
                            <div className="font-mono font-bold text-3xl text-right text-emerald-900">{metrics.balances.cash.toLocaleString()} ₴</div>
                        </div>
                    </div>
                    <div className="card-modern p-6 md:p-8 bg-slate-50 flex flex-col justify-between">
                         <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-widest">Експрес P&L</h3>
                         <div className="space-y-4 py-4">
                            <div><div className="flex justify-between text-[10px] font-black mb-1 text-slate-400 uppercase"><span>Доходи</span><span>{metrics.revenue.toLocaleString()}</span></div><div className="w-full h-1.5 bg-white rounded-full"><div className="h-full bg-emerald-400" style={{width:'100%'}}></div></div></div>
                            <div><div className="flex justify-between text-[10px] font-black mb-1 text-slate-400 uppercase"><span>Витрати</span><span>{metrics.totalExpense.toLocaleString()}</span></div><div className="w-full h-1.5 bg-white rounded-full"><div className="h-full bg-red-400" style={{width:`${metrics.revenue ? (metrics.totalExpense/metrics.revenue)*100 : 0}%`}}></div></div></div>
                         </div>
                        <button onClick={()=>setView('pnl')} className="w-full py-3 font-bold text-xs text-blue-700 bg-blue-100 rounded-xl hover:bg-blue-200 transition uppercase tracking-widest">Звіт</button>
                    </div>
                </div>
            </div>
        );
    });

    const PnLView = memo(({ metrics, transactions }) => {
        const getPct = (val) => metrics.revenue ? ((val / metrics.revenue) * 100).toFixed(1) : 0;
        return (
            <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
                <div className="card-modern p-8 border-l-8 border-emerald-500">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 tracking-tighter">Revenue</div>
                    <div className="text-4xl md:text-5xl font-mono font-bold">+{metrics.revenue.toLocaleString()} ₴</div>
                </div>
                <div className="space-y-4">
                    <div className="card-modern p-6 border-l-4 border-orange-400 flex justify-between items-center">
                        <div><div className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-tighter">COGS</div><div className="text-xl md:text-2xl font-mono font-bold">-{metrics.cogs.toLocaleString()} ₴</div></div>
                        <div className="text-lg font-bold text-slate-400">{getPct(metrics.cogs)}%</div>
                    </div>
                    <div className="card-modern p-6 border-l-4 border-red-400 flex justify-between items-center">
                        <div><div className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-tighter">OpEx</div><div className="text-xl md:text-2xl font-mono font-bold">-{metrics.opex.toLocaleString()} ₴</div></div>
                        <div className="text-lg font-bold text-slate-400">{getPct(metrics.opex)}%</div>
                    </div>
                </div>
                <div className="bg-slate-900 text-white p-8 rounded-[32px] flex justify-between items-center">
                    <div><div className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-tighter">Net Profit</div><div className="text-4xl md:text-6xl font-mono font-bold text-emerald-400">{metrics.net.toLocaleString()} ₴</div></div>
                    <div className="text-right"><div className="text-2xl md:text-4xl font-bold">{getPct(metrics.net)}%</div><div className="text-[10px] font-bold text-slate-500 uppercase">Margin</div></div>
                </div>
            </div>
        );
    });

    const CashFlowView = memo(({ metrics }) => (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in px-1">
             <div className="card-modern p-8 relative overflow-hidden border-l-8 border-blue-500">
                <h3 className="font-bold text-xl mb-6 tracking-tighter">Cash Flow</h3>
                <div className="space-y-4">
                    <div className="flex justify-between p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <span className="font-bold text-emerald-800 uppercase text-[10px] tracking-widest">In</span>
                        <span className="text-xl font-mono font-bold text-emerald-700">+{metrics.revenue.toLocaleString()} ₴</span>
                    </div>
                    <div className="flex justify-between p-5 bg-red-50 rounded-2xl border border-red-100">
                        <span className="font-bold text-red-800 uppercase text-[10px] tracking-widest">Out</span>
                        <span className="text-xl font-mono font-bold text-red-700">-{metrics.totalExpense.toLocaleString()} ₴</span>
                    </div>
                </div>
            </div>
             <div className="bg-slate-900 text-white p-8 rounded-[28px] flex justify-between items-center shadow-xl">
                <div className="text-lg font-bold">Total Change</div>
                <div className={`text-3xl md:text-5xl font-mono font-bold ${metrics.netCashChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{metrics.netCashChange.toLocaleString()} ₴</div>
            </div>
        </div>
    ));

    const DividendsView = memo(({ metrics, transactions, setModalType }) => (
        <div className="max-w-4xl mx-auto animate-fade-in space-y-6 md:space-y-8">
            <div className="bg-gradient-to-br from-slate-800 to-indigo-950 text-white p-8 rounded-[32px] flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl border border-indigo-900/50">
                <div><h2 className="text-3xl font-black mb-2 tracking-tighter text-center md:text-left">Дивіденди</h2><p className="text-indigo-200 text-sm text-center md:text-left">Виведення прибутку власнику.</p></div>
                <button onClick={()=>setModalType('dividend')} className="bg-white text-slate-900 w-full md:w-auto px-8 py-4 rounded-2xl font-black shadow-lg active:scale-95 transition">Виплатити</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card-modern p-6 text-center border-b-4 border-indigo-500"><div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Виведено</div><div className="text-2xl font-mono font-bold text-indigo-600">{metrics.dividends.toLocaleString()} ₴</div></div>
                <div className="card-modern p-6 text-center border-b-4 border-emerald-500"><div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Прибуток</div><div className="text-2xl font-mono font-bold text-emerald-600">{metrics.net.toLocaleString()} ₴</div></div>
                <div className="card-modern p-6 text-center border-b-4 border-slate-900 bg-slate-900 text-white"><div className="text-[10px] font-bold text-white/50 uppercase mb-2">Залишок</div><div className="text-2xl font-mono font-bold">{(metrics.net - metrics.dividends).toLocaleString()} ₴</div></div>
            </div>
        </div>
    ));

    const TransactionRowMemo = memo(({ t, canDelete, deleteTx }) => (
        <tr className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group">
            <td className="p-4 text-[10px] font-mono font-bold text-slate-400">{t.date}</td>
            <td className="p-4 font-bold text-slate-800 text-xs md:text-sm">
                <div className="truncate max-w-[150px] md:max-w-xs">{t.description}</div>
                <div className="md:hidden text-[9px] text-slate-400 mt-1 uppercase">{t.cat}</div>
            </td>
            <td className="hidden md:table-cell p-4"><span className="px-2 py-0.5 bg-slate-100 rounded-md text-[9px] font-bold text-slate-500 uppercase">{t.cat}</span></td>
            <td className={`p-4 text-right font-mono font-bold text-xs md:text-sm ${t.type==='income'?'text-emerald-600':'text-slate-800'}`}>
                {t.type==='income'?'+':'-'}{Number(t.amount).toLocaleString()}
            </td>
            <td className="p-4 text-right">
                {canDelete && <button onClick={()=>deleteTx(t.id)} className="text-slate-200 hover:text-red-500 transition-colors"><Icon name="trash-2" size={14}/></button>}
            </td>
        </tr>
    ));

    const OpsView = ({ transactions, deleteTx, syncMono, canDelete, categories }) => {
        const [isSyncing, setIsSyncing] = useState(false);
        const [limitCount, setLimitCount] = useState(30);
        const visibleTransactions = useMemo(() => transactions.slice(0, limitCount), [transactions, limitCount]);

        return (
            <div className="space-y-4 animate-fade-in px-1">
                <div className="flex justify-between items-center p-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <span className="font-bold text-slate-900 text-sm">{transactions.length} <span className="text-slate-400 font-normal">записів</span></span>
                    <button onClick={async ()=>{setIsSyncing(true); await syncMono(); setIsSyncing(false);}} className="bg-brand-500 text-white px-5 py-2.5 rounded-xl font-bold flex gap-2 items-center hover:bg-brand-600 active:scale-95 transition-all text-xs">
                        {isSyncing ? <Icon name="refresh-cw" className="animate-spin" size={14}/> : <Icon name="refresh-cw" size={14}/>} Sync
                    </button>
                </div>
                <div className="card-modern overflow-hidden">
                    <table className="w-full text-left table-fixed">
                        <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b">
                            <tr><th className="p-4 w-24">Дата</th><th className="p-4">Опис</th><th className="hidden md:table-cell p-4 w-32">Категорія</th><th className="p-4 w-28 text-right">Сума</th><th className="p-4 w-10"></th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {visibleTransactions.map(t => (
                                <TransactionRowMemo key={t.id} t={t} canDelete={canDelete} deleteTx={deleteTx} />
                            ))}
                        </tbody>
                    </table>
                    {transactions.length > limitCount && (
                        <button onClick={() => setLimitCount(prev => prev + 50)} className="w-full p-5 text-[10px] font-black text-slate-400 hover:text-brand-500 hover:bg-slate-50 transition uppercase tracking-widest border-t">Завантажити ще...</button>
                    )}
                </div>
            </div>
        );
    };

    const ManagersView = ({ db }) => {
        const [managers, setManagers] = useState([]);
        useEffect(() => { const unsub = onSnapshot(query(collection(db, "managers")), (snap) => setManagers(snap.docs.map(d => ({ id: d.id, ...d.data() })))); return () => unsub(); }, []);
        return (
            <div className="max-w-5xl mx-auto space-y-6 animate-fade-in px-1">
                <div className="card-modern p-8 bg-white shadow-lg flex justify-between items-center">
                    <div><h2 className="text-2xl font-black uppercase tracking-tighter">Team</h2><p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Access Control</p></div>
                    <Icon name="users-round" size={32} className="text-slate-200"/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {managers.map(m => (
                        <div key={m.id} className="card-modern p-6 relative group border-none shadow-md">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center font-bold text-xl uppercase shadow-inner">{m.name?.[0]}</div>
                                <div className="truncate flex-1">
                                    <div className="font-bold text-slate-800">{m.name}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{m.email}</div>
                                </div>
                                <button onClick={async()=>{if(confirm('Видалити?')) await deleteDoc(doc(db,"managers",m.id))}} className="text-slate-200 hover:text-red-500 transition"><Icon name="trash-2" size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const SettingsView = ({ settings, setSettings, saveSettings, categories, saveCategories }) => {
        const [newCatIn, setNewCatIn] = useState(''); const [newCatOut, setNewCatOut] = useState('');
        const addCat = (t, v, setter) => { if(!v) return; saveCategories({...categories, [t]: [...categories[t], v]}); setter(''); };
        return (
            <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-fade-in px-1 pb-10">
                <div className="card-modern p-6 md:p-8"><h2 className="text-2xl font-black mb-8 uppercase tracking-tighter border-b pb-4">Categories</h2>
                    <div className="grid md:grid-cols-2 gap-10">
                        <div><h3 className="font-black text-[10px] text-emerald-700 mb-4 uppercase tracking-widest">Income</h3>
                            <div className="flex gap-2 mb-4"><input value={newCatIn} onChange={e=>setNewCatIn(e.target.value)} className="flex-1 border-2 p-2 rounded-xl text-sm outline-none focus:border-emerald-500"/><button onClick={()=>addCat('income',newCatIn,setNewCatIn)} className="bg-emerald-500 text-white p-2 rounded-xl"><Icon name="plus" size={16}/></button></div>
                            <div className="flex flex-wrap gap-2">{categories.income.map(c => (<span key={c} className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-1 rounded border flex items-center gap-1 uppercase">{c} <button onClick={()=>saveCategories({...categories, income: categories.income.filter(x=>x!==c)})}><Icon name="x" size={10}/></button></span>))}</div>
                        </div>
                        <div><h3 className="font-black text-[10px] text-orange-700 mb-4 uppercase tracking-widest">Expenses</h3>
                            <div className="flex gap-2 mb-4"><input value={newCatOut} onChange={e=>setNewCatOut(e.target.value)} className="flex-1 border-2 p-2 rounded-xl text-sm outline-none focus:border-brand-500"/><button onClick={()=>addCat('expense',newCatOut,setNewCatOut)} className="bg-brand-500 text-white p-2 rounded-xl"><Icon name="plus" size={16}/></button></div>
                            <div className="flex flex-wrap gap-2">{categories.expense.map(c => (<span key={c} className="bg-orange-50 text-orange-700 text-[10px] font-black px-2 py-1 rounded border flex items-center gap-1 uppercase">{c} <button onClick={()=>saveCategories({...categories, expense: categories.expense.filter(x=>x!==c)})}><Icon name="x" size={10}/></button></span>))}</div>
                        </div>
                    </div>
                </div>
                <div className="card-modern p-6 md:p-8 bg-slate-900 text-white"><h2 className="text-2xl font-black mb-8 uppercase tracking-tighter text-white/50 border-b border-white/10 pb-4 tracking-tighter">Monobank API</h2>
                    <div className="space-y-4">
                        <input placeholder="X-Token" type="password" value={settings.monoKey} onChange={e=>setSettings({...settings, monoKey:e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-mono text-xs text-brand-500 outline-none focus:border-brand-500 transition-all"/>
                        <input placeholder="Account ID" value={settings.monoAccountId} onChange={e=>setSettings({...settings, monoAccountId:e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-mono text-xs outline-none focus:border-white/30 transition-all"/>
                    </div>
                    <button onClick={()=>saveSettings(settings)} className="bg-white text-slate-900 w-full py-4 rounded-[20px] font-black mt-8 active:scale-95 shadow-xl uppercase tracking-widest text-[10px]">SAVE API</button>
                </div>
            </div>
        );
    };

    const TransactionModal = ({ type, close, categories, db }) => {
        const [form, setForm] = useState({ amount: '', desc: '', cat: 'Інше', source: 'Monobank ФОП' });
        const cats = type==='income' ? categories.income : categories.expense;
        const theme = { income: 'from-emerald-500 to-teal-600', expense: 'from-brand-500 to-orange-600', dividend: 'from-indigo-500 to-purple-600' }[type];
        return (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                <div className="card-modern w-full max-w-lg overflow-hidden relative shadow-2xl animate-fade-in">
                    <div className={`bg-gradient-to-r ${theme} p-6 text-white font-black text-xl uppercase tracking-tighter flex justify-between items-center`}><span>{type}</span> <button onClick={close} className="bg-white/20 p-2 rounded-full"><Icon name="x" size={20}/></button></div>
                    <div className="p-6 md:p-8 space-y-6">
                        <div className="relative"><input type="number" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} className="w-full text-5xl font-mono font-black border-b-4 py-2 outline-none focus:border-slate-900 transition-colors bg-transparent text-center" placeholder="0"/><span className="absolute left-0 bottom-6 text-3xl text-slate-200">₴</span></div>
                        <div className="space-y-4">
                            <input type="text" value={form.desc} onChange={e=>setForm({...form, desc:e.target.value})} className="w-full border-2 p-4 rounded-2xl font-bold outline-none focus:border-brand-500 transition-all text-sm" placeholder="Опис операції..." />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <select value={form.cat} onChange={e=>setForm({...form, cat:e.target.value})} className="w-full border-2 p-3 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-white">{cats.map(c=><option key={c} value={c}>{c}</option>)}</select>
                                <select value={form.source} onChange={e=>setForm({...form, source:e.target.value})} className="w-full border-2 p-3 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-white">{['Monobank ФОП', 'NovaPay', 'Готівка'].map(a=><option key={a} value={a}>{a}</option>)}</select>
                            </div>
                        </div>
                        <button onClick={async () => { if(!form.amount) return; await addDoc(collection(db, "transactions"), { amount: Number(form.amount), description: form.desc || (type==='dividend'?'Виплата дивідендів':''), cat: type==='dividend'?'Дивіденди':form.cat, source: form.source, type: (type==='dividend' || type==='expense') ? 'expense' : 'income', isDividend: type==='dividend', date: new Date().toLocaleDateString('uk-UA'), createdAt: Date.now() }); close(); }} className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black text-lg shadow-2xl active:scale-95 transition-transform uppercase tracking-widest">OK</button>
                    </div>
                </div>
            </div>
        );
    };

    // --- MAIN APP ---

    const App = () => {
        const [currentUser, setCurrentUser] = useState(null);
        const [view, setView] = useState('auth');
        const [transactions, setTransactions] = useState([]);
        const [loading, setLoading] = useState(true);
        const [settings, setSettings] = useState({ monoKey: '', monoAccountId: '' });
        const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
        const [email, setEmail] = useState('');
        const [pass, setPass] = useState('');
        const [modalType, setModalType] = useState(null);

        useEffect(() => {
            onAuthStateChanged(auth, async (u) => {
                if (u) { setCurrentUser({ uid: u.uid, email: u.email, role: 'admin' }); setView('dashboard'); loadData(); } 
                else { const stored = localStorage.getItem('latiao_user'); if (stored) { setCurrentUser(JSON.parse(stored)); setView('dashboard'); loadData(); } else { setView('auth'); setLoading(false); } }
            });
        }, []);

        const loadData = async () => {
            setLoading(true);
            try {
                const sSnap = await getDoc(doc(db, "settings", "global")); if (sSnap.exists()) setSettings(sSnap.data());
                const cSnap = await getDoc(doc(db, "settings", "categories")); if (cSnap.exists()) setCategories(cSnap.data());
                onSnapshot(query(collection(db, "transactions"), orderBy("createdAt", "desc"), limit(500)), (snap) => {
                    setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                    setLoading(false);
                });
            } catch (e) { setLoading(false); }
        };

        const metrics = useMemo(() => {
            const inc = transactions.filter(t => t.type === 'income' && !t.isDividend).reduce((s,t) => s + (Number(t.amount)||0), 0);
            const exp = transactions.filter(t => t.type === 'expense' && !t.isDividend).reduce((s,t) => s + (Number(t.amount)||0), 0);
            const cogs = transactions.filter(t => t.cat === 'Закупівля (COGS)').reduce((s,t) => s + (Number(t.amount)||0), 0);
            const cash = transactions.reduce((s,t) => t.type==='income' ? s+(Number(t.amount)||0) : s-(Number(t.amount)||0), 0);
            const div = transactions.filter(t => t.isDividend).reduce((s,t) => s+(Number(t.amount)||0), 0);
            const bal = { mono: 0, nova: 0, cash: 0 };
            transactions.forEach(t => { const k = (t.source||'').includes('Mono') ? 'mono' : ((t.source||'').includes('Nova') ? 'nova' : 'cash'); bal[k] += (t.type==='income' ? (Number(t.amount)||0) : -(Number(t.amount)||0)); });
            return { revenue: inc, cogs, opex: exp - cogs, net: inc - exp, totalCash: cash, dividends: div, balances: bal, margin: inc ? (((inc-exp)/inc)*100).toFixed(0) : 0, totalExpense: exp, runway: exp > 0 ? (cash / (exp / 30)).toFixed(0) : "∞", netCashChange: (inc - exp) - div };
        }, [transactions]);

        const canAccess = (vid) => currentUser?.role === 'admin' || currentUser?.permissions?.includes(vid) || currentUser?.permissions?.includes('all');

        if (view === 'auth') return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-20"><div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-500 rounded-full blur-[150px] animate-pulse"></div></div>
                <div className="glass-bg p-10 md:p-12 rounded-[48px] w-full max-w-sm text-center shadow-2xl relative z-10 border border-white/10">
                    <div className="mb-12 flex flex-col items-center">
                        <div className="w-16 h-16 bg-gradient-to-tr from-brand-500 to-brand-700 rounded-3xl flex items-center justify-center shadow-2xl mb-4 transform rotate-6 border-b-4 border-brand-800"><Icon name="flame" size={32} className="text-white fill-white"/></div>
                        <h1 className="text-3xl font-black text-white tracking-tighter mb-1 uppercase tracking-widest">Latiao</h1>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Finance ERP</p>
                    </div>
                    <form onSubmit={async (e)=>{e.preventDefault(); setLoading(true); try{await signInWithEmailAndPassword(auth,email,pass);}catch(err){const s=await getDocs(query(collection(db,"managers"),where("email","==",email),where("password","==",pass))); if(!s.empty){const u={uid:s.docs[0].id,...s.docs[0].data(),role:'manager'}; localStorage.setItem('latiao_user',JSON.stringify(u)); setCurrentUser(u); setView('dashboard'); loadData();}else{alert("Err!"); setLoading(false);}}}} className="space-y-4">
                        <input type="email" placeholder="Login" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-4 rounded-2xl bg-white/5 text-white outline-none border border-white/10 focus:border-brand-500 transition-all font-bold"/>
                        <input type="password" placeholder="Pass" value={pass} onChange={e=>setPass(e.target.value)} className="w-full p-4 rounded-2xl bg-white/5 text-white outline-none border border-white/10 focus:border-brand-500 transition-all font-bold"/>
                        <button type="submit" className="w-full bg-brand-500 text-white py-4 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all">ENTER</button>
                    </form>
                </div>
            </div>
        );

        return (
            <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
                <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-20 shadow-soft sidebar-nav">
                    <div className="p-8 sidebar-logo-container"><h1 className="text-2xl font-black tracking-tighter uppercase tracking-widest">Latiao<span className="text-brand-500">.</span></h1></div>
                    <nav className="flex-1 px-4 space-y-1 mt-2">
                        {ALL_VIEWS.filter(v => canAccess(v.id)).map(item => (
                            <button key={item.id} onClick={()=>setView(item.id)} className={`w-full flex items-center gap-3 p-3.5 text-[10px] md:text-xs font-black uppercase tracking-widest sidebar-link ${view===item.id ? 'active' : 'text-slate-400'}`}><Icon name={item.icon} size={20}/> <span>{item.label}</span></button>
                        ))}
                    </nav>
                    <div className="p-6 border-t"><button onClick={() => {signOut(auth); localStorage.removeItem('latiao_user'); setView('auth');}} className="w-full flex items-center gap-3 p-3 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"><Icon name="log-out" size={18}/> EXIT</button></div>
                </aside>
                <main className="flex-1 overflow-y-auto p-8 relative scroll-smooth">
                    <div className="flex justify-between items-center mb-10 sticky top-0 bg-[#F8FAFC]/80 backdrop-blur-md z-30 py-4">
                        <div><h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">{ALL_VIEWS.find(v=>v.id===view)?.label}</h1><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">{currentUser?.email}</p></div>
                        {(view==='dashboard' || view==='ops') && (
                            <div className="flex gap-4 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-soft">
                                <button onClick={()=>setModalType('income')} className="bg-emerald-500 text-white px-5 md:px-8 py-2 md:py-3 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">In</button>
                                <button onClick={()=>setModalType('expense')} className="bg-brand-500 text-white px-5 md:px-8 py-2 md:py-3 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Out</button>
                            </div>
                        )}
                    </div>
                    <div className="fade-in pb-20 md:pb-12">
                        {loading ? <div className="text-center p-20 font-black animate-pulse text-slate-300 text-5xl tracking-tighter uppercase">Syncing...</div> : (
                            <>
                                {view==='dashboard' && <DashboardMemo metrics={metrics} setView={setView}/>}
                                {view==='ops' && <OpsMemo transactions={transactions} deleteTx={(id)=>deleteDoc(doc(db,"transactions",id))} syncMono={()=>{}} canDelete={currentUser?.role==='admin'} categories={categories}/>}
                                {view==='pnl' && <PnLMemo metrics={metrics} transactions={transactions}/>}
                                {view==='cashflow' && <CashFlowMemo metrics={metrics}/>}
                                {view==='dividends' && <DividendsMemo metrics={metrics} transactions={transactions} setModalType={setModalType}/>}
                                {view==='settings' && <SettingsMemo settings={settings} setSettings={setSettings} saveSettings={(d)=>setDoc(doc(db,"settings","global"),d)} categories={categories} saveCategories={(d)=>setDoc(doc(db,"settings","categories"),d)}/>}
                                {view==='managers' && <ManagersMemo db={db}/>}
                            </>
                        )}
                    </div>
                </main>
                {modalType && <TransactionModal type={modalType} close={()=>setModalType(null)} categories={categories} db={db}/>}
            </div>
        );
    };

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
</script>

</body>
</html>
