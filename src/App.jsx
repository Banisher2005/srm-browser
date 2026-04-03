import { useEffect, useRef, useState, useCallback } from "react";
import { injectSRMDeskWidget } from "./injectors/srmDeskInjector";

// ─── Default sidebar apps ────────────────────────────────────────────────────
const DEFAULT_APPS = [
  { key: "academia",    label: "Academia",     emoji: "🎓", url: "https://academia.srmist.edu.in",  pinned: true  },
  { key: "gmail",       label: "Mail",         emoji: "✉️",  url: "https://mail.google.com",          pinned: true  },
  { key: "leave",       label: "Leave",        emoji: "📋", url: "http://10.1.105.62/srmleaveapp",   pinned: true  },
  { key: "servicedesk", label: "Service Desk", emoji: "🛠️", url: "https://sd.srmist.edu.in",         pinned: true  },
  { key: "leetcode",    label: "LeetCode",     emoji: "⌨️",  url: "https://leetcode.com",             pinned: true  },
  { key: "github",      label: "GitHub",       emoji: "🐙", url: "https://github.com",               pinned: true  },
];

const NEWTAB = "srm://newtab";

// Speed dial items shown on new tab page
const SPEED_DIAL = [
  { label: "Academia",     url: "https://academia.srmist.edu.in",  emoji: "🎓" },
  { label: "Gmail",        url: "https://mail.google.com",          emoji: "✉️"  },
  { label: "Leave App",    url: "http://10.1.105.62/srmleaveapp",   emoji: "📋" },
  { label: "Service Desk", url: "https://sd.srmist.edu.in",         emoji: "🛠️" },
  { label: "LeetCode",     url: "https://leetcode.com",             emoji: "⌨️"  },
  { label: "GitHub",       url: "https://github.com",               emoji: "🐙" },
  { label: "YouTube",      url: "https://youtube.com",              emoji: "▶️"  },
  { label: "Maps",         url: "https://maps.google.com",          emoji: "🗺️"  },
];

function loadApps() {
  try {
    const saved = localStorage.getItem("srm-sidebar-apps");
    return saved ? JSON.parse(saved) : DEFAULT_APPS;
  } catch { return DEFAULT_APPS; }
}
function saveApps(apps) {
  try { localStorage.setItem("srm-sidebar-apps", JSON.stringify(apps)); } catch {}
}

// ─── New Tab Page ────────────────────────────────────────────────────────────
function NewTabPage({ onNavigate }) {
  const [search, setSearch] = useState("");
  const [time, setTime]     = useState(new Date());
  const inputRef            = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    const url = q.startsWith("http")
      ? q
      : q.includes(".") && !q.includes(" ")
        ? "https://" + q
        : "https://www.google.com/search?q=" + encodeURIComponent(q);
    onNavigate(url);
  };

  const hh = time.getHours().toString().padStart(2, "0");
  const mm = time.getMinutes().toString().padStart(2, "0");
  const dateStr = time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div style={nt.root}>
      <style>{`
        @keyframes ntFade { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .nt-sb:focus-within { border-color:rgba(99,102,241,0.6)!important; background:rgba(255,255,255,0.09)!important; box-shadow:0 0 0 3px rgba(99,102,241,0.13),0 4px 28px rgba(0,0,0,0.35)!important; }
        .sd-item:hover { background:rgba(255,255,255,0.1)!important; transform:translateY(-4px) scale(1.05)!important; border-color:rgba(255,255,255,0.13)!important; }
        .sd-item:hover .sd-lbl { color:rgba(255,255,255,0.75)!important; }
      `}</style>
      <div style={nt.glow1}/><div style={nt.glow2}/><div style={nt.grid}/>

      <div style={nt.inner}>
        {/* Clock */}
        <div style={{animation:"ntFade 0.45s ease both"}}>
          <div style={nt.clock}>{hh}<span style={{opacity:0.4}}>:</span>{mm}</div>
          <div style={nt.date}>{dateStr}</div>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{animation:"ntFade 0.45s ease 0.07s both", width:"100%", maxWidth:560}}>
          <div className="nt-sb" style={nt.searchBox}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{flexShrink:0,opacity:0.38}}>
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M10 10L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input ref={inputRef} style={nt.searchInput} value={search}
              onChange={e=>setSearch(e.target.value)} placeholder="Search Google or type a URL" spellCheck={false}/>
            {search && <button type="button" onClick={()=>setSearch("")} style={nt.clearBtn}>✕</button>}
          </div>
        </form>

        {/* Speed Dial */}
        <div style={{animation:"ntFade 0.45s ease 0.14s both", width:"100%", maxWidth:660}}>
          <div style={nt.sdHead}>Quick Access</div>
          <div style={nt.sdGrid}>
            {SPEED_DIAL.map(item=>(
              <button key={item.url} className="sd-item" onClick={()=>onNavigate(item.url)} style={nt.sdBtn}>
                <div style={nt.sdIcon}>{item.emoji}</div>
                <span className="sd-lbl" style={nt.sdLbl}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const nt = {
  root:{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",
    justifyContent:"center",background:"#0d0d12",color:"#f5f5f7",
    fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
    WebkitFontSmoothing:"antialiased",gap:32,padding:"40px 20px",overflow:"hidden"},
  glow1:{position:"absolute",inset:0,background:"radial-gradient(ellipse 90% 50% at 50% 0%,rgba(99,102,241,0.13) 0%,transparent 65%)",pointerEvents:"none"},
  glow2:{position:"absolute",width:500,height:500,borderRadius:"50%",
    background:"radial-gradient(circle,rgba(139,92,246,0.06) 0%,transparent 70%)",
    bottom:"-10%",right:"10%",pointerEvents:"none"},
  grid:{position:"absolute",inset:0,
    backgroundImage:"linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",
    backgroundSize:"40px 40px",pointerEvents:"none"},
  inner:{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:28,width:"100%"},
  clock:{fontSize:78,fontWeight:200,letterSpacing:-5,color:"rgba(255,255,255,0.92)",
    lineHeight:1,textAlign:"center",fontVariantNumeric:"tabular-nums"},
  date:{textAlign:"center",fontSize:13,color:"rgba(255,255,255,0.3)",fontWeight:400,letterSpacing:0.4,marginTop:6},
  searchBox:{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.055)",
    border:"1px solid rgba(255,255,255,0.09)",borderRadius:14,padding:"12px 16px",
    transition:"all 0.2s",boxShadow:"0 4px 24px rgba(0,0,0,0.25)"},
  searchInput:{flex:1,background:"transparent",border:"none",outline:"none",
    color:"rgba(255,255,255,0.88)",fontSize:15,
    fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif"},
  clearBtn:{background:"transparent",border:"none",color:"rgba(255,255,255,0.28)",cursor:"pointer",fontSize:10,padding:2},
  sdHead:{fontSize:9,fontWeight:700,letterSpacing:1.2,color:"rgba(255,255,255,0.18)",
    textTransform:"uppercase",marginBottom:12,textAlign:"center"},
  sdGrid:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10},
  sdBtn:{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"14px 8px",
    borderRadius:14,background:"rgba(255,255,255,0.045)",border:"1px solid rgba(255,255,255,0.07)",
    cursor:"pointer",transition:"all 0.18s cubic-bezier(0.34,1.56,0.64,1)",color:"inherit"},
  sdIcon:{fontSize:26,lineHeight:1},
  sdLbl:{fontSize:10,fontWeight:500,color:"rgba(255,255,255,0.42)",letterSpacing:0.2,transition:"color 0.15s"},
};

// ─── Add Site Modal ──────────────────────────────────────────────────────────
function AddSiteModal({ onClose, onAdd }) {
  const [label, setLabel] = useState("");
  const [url,   setUrl]   = useState("https://");
  const [emoji, setEmoji] = useState("🌐");

  const submit = (e) => {
    e.preventDefault();
    if (!label.trim() || !url.trim()) return;
    const u = url.trim().startsWith("http") ? url.trim() : "https://" + url.trim();
    onAdd({ key: "custom_" + Date.now(), label: label.trim(), emoji, url: u, pinned: true });
    onClose();
  };

  return (
    <div style={md.backdrop} onClick={onClose}>
      <div style={md.box} onClick={e=>e.stopPropagation()}>
        <div style={md.title}>Add to Sidebar</div>
        <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",gap:8}}>
            <input style={md.emojiIn} value={emoji} onChange={e=>setEmoji(e.target.value)} maxLength={2}/>
            <input style={md.input} placeholder="Site name" value={label} onChange={e=>setLabel(e.target.value)} autoFocus/>
          </div>
          <input style={md.input} placeholder="https://..." value={url} onChange={e=>setUrl(e.target.value)}/>
          <div style={{display:"flex",gap:8,marginTop:4}}>
            <button type="button" onClick={onClose} style={md.btnCancel}>Cancel</button>
            <button type="submit" style={md.btnAdd}>Add Site</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const md = {
  backdrop:{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.65)",
    backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center"},
  box:{background:"#18181f",border:"1px solid rgba(255,255,255,0.1)",borderRadius:16,
    padding:"22px 24px",width:310,boxShadow:"0 24px 64px rgba(0,0,0,0.55)",
    fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif",color:"#f5f5f7"},
  title:{fontSize:14,fontWeight:600,marginBottom:14,letterSpacing:-0.2},
  emojiIn:{width:46,textAlign:"center",fontSize:18,background:"rgba(255,255,255,0.07)",
    border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"8px 4px",
    color:"#f5f5f7",outline:"none",flexShrink:0},
  input:{flex:1,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",
    borderRadius:8,padding:"8px 10px",color:"#f5f5f7",outline:"none",fontSize:12,
    fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif"},
  btnCancel:{flex:1,padding:"8px",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,
    background:"transparent",color:"rgba(255,255,255,0.45)",cursor:"pointer",fontSize:12,
    fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif"},
  btnAdd:{flex:2,padding:"8px",border:"none",borderRadius:8,
    background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",cursor:"pointer",
    fontSize:12,fontWeight:600,fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif"},
};

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [apps, setApps]               = useState(loadApps);
  const [url, setUrl]                 = useState("");
  const [currentUrl, setCurrentUrl]   = useState(NEWTAB);
  const [canGoBack, setCanGoBack]     = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [activeKey, setActiveKey]     = useState(null);
  const [focused, setFocused]         = useState(false);
  const [showAdd, setShowAdd]         = useState(false);
  const [ctxMenu, setCtxMenu]         = useState(null); // {key,x,y}

  const webviewRef = useRef(null);
  const isNewTab   = currentUrl === NEWTAB;

  useEffect(() => { saveApps(apps); }, [apps]);

  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [ctxMenu]);

  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv || isNewTab) return;
    let injecting = false;

    const onLoad = () => {
      const loadedUrl = wv.getURL();
      setUrl(loadedUrl);
      setLoading(false);
      setCanGoBack(wv.canGoBack());
      setCanGoForward(wv.canGoForward());
      if (!loadedUrl.includes("academia.srmist.edu.in")) { injecting = false; return; }
      if (injecting) return;
      injecting = true;
      injectSRMDeskWidget(wv).finally(() => { injecting = false; });
    };
    const onStart = () => setLoading(true);

    wv.addEventListener("did-finish-load", onLoad);
    wv.addEventListener("did-start-loading", onStart);
    return () => {
      injecting = false;
      wv.removeEventListener("did-finish-load", onLoad);
      wv.removeEventListener("did-start-loading", onStart);
    };
  }, [currentUrl, isNewTab]);

  const navigate = useCallback((u) => {
    if (!u || u === NEWTAB) { setCurrentUrl(NEWTAB); setUrl(""); setActiveKey(null); return; }
    setCurrentUrl(u); setUrl(u);
  }, []);

  const goToPage = () => {
    const raw = url.trim();
    if (!raw) { navigate(NEWTAB); return; }
    if (raw.startsWith("srm://")) { navigate(NEWTAB); return; }
    let u = raw;
    if (!u.startsWith("http")) {
      u = u.includes(".") && !u.includes(" ")
        ? "https://" + u
        : "https://www.google.com/search?q=" + encodeURIComponent(u);
    }
    setActiveKey(null);
    navigate(u);
  };

  const openApp    = (app) => { setActiveKey(app.key); navigate(app.url); };
  const goBack     = () => { webviewRef.current?.goBack();    setTimeout(()=>{ setCanGoBack(webviewRef.current?.canGoBack()); setCanGoForward(webviewRef.current?.canGoForward()); },100); };
  const goForward  = () => { webviewRef.current?.goForward(); setTimeout(()=>{ setCanGoBack(webviewRef.current?.canGoBack()); setCanGoForward(webviewRef.current?.canGoForward()); },100); };
  const reload     = () => { loading ? webviewRef.current?.stop() : webviewRef.current?.reload(); };
  const addApp     = (app) => setApps(prev => [...prev, app]);
  const removeApp  = (key) => setApps(prev => prev.filter(a => a.key !== key));

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{height:100%;overflow:hidden}
        body{background:#0d0d12}
        input::placeholder{color:rgba(255,255,255,0.2)}
        @keyframes loadSlide{0%{transform:translateX(-100%)}50%{transform:translateX(60%)}100%{transform:translateX(200%)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes ctxIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}

        .ctrl-btn:hover{background:rgba(255,255,255,0.11)!important}
        .app-nav-btn{transition:transform 0.18s cubic-bezier(0.34,1.56,0.64,1)}
        .app-nav-btn:hover{transform:scale(1.1) translateY(-2px)!important}
        .app-nav-btn:hover .aicon{background:rgba(255,255,255,0.14)!important;box-shadow:0 0 0 1px rgba(255,255,255,0.18) inset,0 3px 12px rgba(0,0,0,0.38)!important}
        .app-nav-btn:hover .albl{color:rgba(255,255,255,0.55)!important}
        .app-nav-btn.on .aicon{background:rgba(99,102,241,0.22)!important;box-shadow:0 0 0 1px rgba(99,102,241,0.45) inset,0 4px 18px rgba(99,102,241,0.28)!important}
        .app-nav-btn.on .albl{color:rgba(255,255,255,0.72)!important}
        .add-btn:hover{border-color:rgba(99,102,241,0.4)!important;background:rgba(99,102,241,0.08)!important}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:999px}
      `}</style>

      <div style={s.root}>
        {/* ══ Opera GX Sidebar ══ */}
        <aside style={s.sidebar}>
          {/* Logo / home */}
          <button style={s.logo} onClick={()=>navigate(NEWTAB)} title="New Tab Home">
            <span style={{fontSize:14}}>⚡</span>
          </button>
          <div style={s.sep}/>

          {/* App list */}
          <nav style={s.nav}>
            {apps.map(app => (
              <button
                key={app.key}
                className={`app-nav-btn${activeKey===app.key?" on":""}`}
                style={s.appBtn}
                onClick={()=>openApp(app)}
                onContextMenu={e=>{e.preventDefault();setCtxMenu({key:app.key,x:e.clientX,y:e.clientY});}}
                title={app.label}
              >
                <div className="aicon" style={s.aIcon}>
                  <span style={{fontSize:17,lineHeight:1}}>{app.emoji}</span>
                  <div style={s.aSheen}/>
                </div>
                <span className="albl" style={s.aLbl}>{app.label}</span>
                {activeKey===app.key && <div style={s.activePip}/>}
              </button>
            ))}
          </nav>

          <div style={s.sep}/>

          {/* Add button */}
          <button
            className="add-btn"
            style={s.addBtn}
            onClick={()=>setShowAdd(true)}
            title="Add site to sidebar"
          >
            <span style={{fontSize:17,color:"rgba(255,255,255,0.38)"}}>＋</span>
          </button>
        </aside>

        {/* ══ Main area ══ */}
        <main style={s.main}>
          {/* Toolbar */}
          <div style={s.toolbar}>
            <div style={s.ctrls}>
              <button className="ctrl-btn" style={{...s.ctrlBtn,opacity:(!isNewTab&&canGoBack)?1:0.2}} onClick={goBack} disabled={isNewTab||!canGoBack}>
                <svg width="8" height="13" viewBox="0 0 8 13" fill="none"><path d="M7 1.5L2 6.5L7 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button className="ctrl-btn" style={{...s.ctrlBtn,opacity:(!isNewTab&&canGoForward)?1:0.2}} onClick={goForward} disabled={isNewTab||!canGoForward}>
                <svg width="8" height="13" viewBox="0 0 8 13" fill="none"><path d="M1 1.5L6 6.5L1 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>

            <div style={{
              ...s.urlBar,
              borderColor: focused?"rgba(99,102,241,0.55)":"rgba(255,255,255,0.07)",
              background:   focused?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.04)",
              boxShadow:    focused?"0 0 0 3px rgba(99,102,241,0.1)":"none",
            }}>
              {loading
                ? <div style={s.spinner}/>
                : isNewTab
                  ? <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{flexShrink:0,opacity:0.25}}>
                      <path d="M1 5.5L4 8.5L10 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  : <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{flexShrink:0,opacity:0.28}}>
                      <circle cx="4.5" cy="4.5" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M7.5 7.5L10 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
              }
              <input
                style={s.urlInput}
                value={url}
                onChange={e=>setUrl(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&goToPage()}
                onFocus={e=>{setFocused(true);e.target.select();}}
                onBlur={()=>setFocused(false)}
                placeholder={isNewTab?"Search Google or enter URL":"Search or enter URL"}
                spellCheck={false}
              />
            </div>

            <button className="ctrl-btn" style={{...s.ctrlBtn,opacity:isNewTab?0.2:1}} onClick={reload} disabled={isNewTab}>
              {loading
                ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                : <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M11.5 2A5.5 5.5 0 1 0 12 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M8.5 2H12V5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              }
            </button>
          </div>

          {/* Progress bar */}
          <div style={s.loadTrack}>
            {loading && <div style={s.loadBar}/>}
          </div>

          {/* Content */}
          <div style={s.content}>
            {isNewTab
              ? <NewTabPage onNavigate={u=>{setActiveKey(null);navigate(u);}}/>
              : <webview ref={webviewRef} src={currentUrl} style={s.webview}/>
            }
          </div>
        </main>
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <div
          style={{position:"fixed",zIndex:9998,top:ctxMenu.y,left:ctxMenu.x,
            background:"#1c1c24",border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:10,padding:4,boxShadow:"0 8px 32px rgba(0,0,0,0.55)",
            fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif",
            minWidth:160,animation:"ctxIn 0.12s ease"}}
          onClick={e=>e.stopPropagation()}
        >
          <button style={ctxBtn.base}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.07)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            onClick={()=>{const a=apps.find(x=>x.key===ctxMenu.key);if(a){openApp(a);}setCtxMenu(null);}}>
            🌐&nbsp; Open
          </button>
          <div style={{height:1,background:"rgba(255,255,255,0.06)",margin:"3px 0"}}/>
          <button style={{...ctxBtn.base,color:"#f87171"}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(248,113,113,0.09)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            onClick={()=>{removeApp(ctxMenu.key);if(activeKey===ctxMenu.key){navigate(NEWTAB);setActiveKey(null);}setCtxMenu(null);}}>
            🗑&nbsp; Remove from sidebar
          </button>
        </div>
      )}

      {/* Add site modal */}
      {showAdd && <AddSiteModal onClose={()=>setShowAdd(false)} onAdd={addApp}/>}
    </>
  );
}

const ctxBtn = {
  base:{display:"block",width:"100%",textAlign:"left",padding:"7px 12px",
    border:"none",background:"transparent",color:"rgba(255,255,255,0.78)",
    fontSize:12,fontWeight:500,cursor:"pointer",borderRadius:7,
    fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif",transition:"background 0.1s"},
};

const s = {
  root:{display:"flex",height:"100vh",width:"100vw",background:"#0d0d12",color:"#f5f5f7",
    fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
    overflow:"hidden",WebkitFontSmoothing:"antialiased",MozOsxFontSmoothing:"grayscale"},
  sidebar:{width:76,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",
    paddingTop:14,paddingBottom:14,background:"#09090d",
    borderRight:"1px solid rgba(255,255,255,0.05)",
    boxShadow:"2px 0 20px rgba(0,0,0,0.5),inset -1px 0 0 rgba(99,102,241,0.07)",
    position:"relative",zIndex:10,overflowY:"auto",overflowX:"hidden"},
  logo:{width:38,height:38,borderRadius:11,
    background:"linear-gradient(145deg,#6366f1,#8b5cf6)",
    border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
    flexShrink:0,boxShadow:"0 2px 14px rgba(99,102,241,0.5),0 0 0 1px rgba(255,255,255,0.14) inset",
    transition:"transform 0.15s",marginBottom:2},
  sep:{width:32,height:1,
    background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)",
    margin:"8px 0",flexShrink:0},
  nav:{display:"flex",flexDirection:"column",alignItems:"center",gap:3,
    width:"100%",padding:"0 8px",flex:1},
  appBtn:{position:"relative",width:"100%",padding:"7px 4px 5px",border:"none",
    background:"transparent",cursor:"pointer",borderRadius:12,
    display:"flex",flexDirection:"column",alignItems:"center",gap:3,
    color:"rgba(255,255,255,0.7)"},
  aIcon:{width:44,height:44,borderRadius:13,display:"flex",alignItems:"center",justifyContent:"center",
    background:"rgba(255,255,255,0.07)",
    border:"1px solid rgba(255,255,255,0.1)",
    boxShadow:"0 0 0 0.5px rgba(255,255,255,0.05) inset,0 2px 6px rgba(0,0,0,0.3)",
    transition:"all 0.18s",position:"relative",overflow:"hidden"},
  aSheen:{position:"absolute",top:0,left:0,right:0,height:"45%",
    background:"linear-gradient(180deg,rgba(255,255,255,0.1) 0%,transparent 100%)",
    borderRadius:"13px 13px 0 0",pointerEvents:"none"},
  aLbl:{fontSize:7.5,fontWeight:600,letterSpacing:0.2,color:"rgba(255,255,255,0.28)",
    lineHeight:1,transition:"color 0.15s",
    maxWidth:62,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},
  activePip:{position:"absolute",bottom:-1,left:"50%",transform:"translateX(-50%)",
    width:16,height:3,borderRadius:999,
    background:"linear-gradient(90deg,#6366f1,#8b5cf6)",
    boxShadow:"0 0 8px rgba(99,102,241,0.8)"},
  addBtn:{width:44,height:44,borderRadius:13,
    border:"1.5px dashed rgba(255,255,255,0.11)",background:"transparent",
    cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
    flexShrink:0,transition:"all 0.15s"},
  main:{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0,minHeight:0},
  toolbar:{display:"flex",alignItems:"center",gap:7,padding:"0 12px",height:44,
    background:"rgba(9,9,13,0.97)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
    borderBottom:"1px solid rgba(255,255,255,0.05)",flexShrink:0,zIndex:5},
  ctrls:{display:"flex",gap:3,flexShrink:0},
  ctrlBtn:{width:28,height:28,border:"none",background:"rgba(255,255,255,0.06)",
    color:"rgba(255,255,255,0.6)",borderRadius:7,cursor:"pointer",
    display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.12s"},
  urlBar:{flex:1,height:28,borderRadius:8,border:"1px solid",
    display:"flex",alignItems:"center",padding:"0 9px",gap:7,transition:"all 0.15s"},
  spinner:{width:10,height:10,borderRadius:"50%",
    border:"1.5px solid rgba(99,102,241,0.2)",borderTopColor:"#6366f1",
    flexShrink:0,animation:"spin 0.7s linear infinite"},
  urlInput:{flex:1,background:"transparent",border:"none",outline:"none",
    color:"rgba(255,255,255,0.82)",fontSize:12,
    fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
    letterSpacing:0.1},
  loadTrack:{height:2,background:"transparent",overflow:"hidden",flexShrink:0},
  loadBar:{height:"100%",width:"45%",
    background:"linear-gradient(90deg,#6366f1,#8b5cf6)",
    animation:"loadSlide 1.2s ease-in-out infinite"},
  content:{flex:1,minHeight:0,minWidth:0,position:"relative",overflow:"hidden"},
  webview:{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none",display:"block"},
};
