import { scrapeAll } from "../core/scraper";

export const injectSRMDeskWidget = async (webview) => {
  if (!webview) return;

  const url = webview.getURL();
  if (!url.includes("academia.srmist.edu.in")) return;

  // only inject when actually inside the portal (not on login page)
  let isLoggedIn = false;
  try {
    isLoggedIn = await webview.executeJavaScript(`
      (() => {
        const text = document.body?.innerText || "";
        const hasPortalContent =
          text.includes("Day Order") ||
          text.includes("WELCOME") ||
          text.includes("My Attendance") ||
          text.includes("Student Profile") ||
          document.querySelector('[id*="zohoLogin"]') === null;
        const isLoginPage =
          document.querySelector('input[type="password"]') !== null &&
          text.length < 3000;
        return hasPortalContent && !isLoginPage;
      })()
    `);
  } catch (e) { return; }

  if (!isLoggedIn) return;

  // if loading overlay is already present, skip (scrape in progress)
  let loadingActive = false;
  try {
    loadingActive = await webview.executeJavaScript(`!!document.getElementById("srm-loading-overlay")`);
  } catch (e) {}
  if (loadingActive) return;

  // if dashboard is visible, skip — user hasn't navigated away
  let dashVisible = false;
  try {
    dashVisible = await webview.executeJavaScript(`
      (() => {
        const o = document.getElementById("srm-dashboard-overlay");
        return !!(o && o.style.display !== "none");
      })()
    `);
  } catch (e) {}
  if (dashVisible) return;

  // clear any leftover stale elements
  try {
    await webview.executeJavaScript(`
      document.getElementById("srm-dashboard-overlay")?.remove();
      document.getElementById("srm-show-dashboard-btn")?.remove();
      document.getElementById("srm-loading-overlay")?.remove();
    `);
  } catch (e) {}

  // show loading screen
  try {
    await webview.executeJavaScript(`
      (() => {
        const el = document.createElement("div");
        el.id = "srm-loading-overlay";
        el.style.cssText = [
          "position:fixed",
          "top:0",
          "left:0",
          "width:100vw",
          "height:100vh",
          "background:#0a0a0c",
          "color:#f5f5f7",
          "z-index:2147483647",
          "display:flex",
          "flex-direction:column",
          "align-items:center",
          "justify-content:center",
          "font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
          "gap:12px",
          "-webkit-font-smoothing:antialiased",
        ].join(";");

        el.innerHTML = \`
          <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(145deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 16px rgba(99,102,241,0.4);">⚡</div>
          <div style="font-size:15px;font-weight:600;letter-spacing:-0.2px;color:rgba(255,255,255,0.9);">SRM Browser</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.35);letter-spacing:0.1px;">Loading your dashboard...</div>
          <div style="width:160px;height:2px;background:rgba(255,255,255,0.06);border-radius:999px;overflow:hidden;margin-top:4px;">
            <div id="srm-load-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#6366f1,#8b5cf6);border-radius:999px;transition:width 0.35s ease;"></div>
          </div>
        \`;
        document.body.appendChild(el);

        let p = 0;
        window._srmLoadTimer = setInterval(() => {
          p = Math.min(p + (Math.random() * 9 + 2), 87);
          const bar = document.getElementById("srm-load-bar");
          if (bar) bar.style.width = p + "%";
        }, 450);
      })();
    `);
  } catch (e) { return; }

  // run scraper
  let result;
  try {
    result = await webview.executeJavaScript(`(${scrapeAll.toString()})()`);
  } catch (e) {
    try {
      await webview.executeJavaScript(`
        clearInterval(window._srmLoadTimer);
        document.getElementById("srm-loading-overlay")?.remove();
      `);
    } catch (_) {}
    return;
  }

  // finish bar
  try {
    await webview.executeJavaScript(`
      clearInterval(window._srmLoadTimer);
      const bar = document.getElementById("srm-load-bar");
      if (bar) bar.style.width = "100%";
    `);
    await new Promise(r => setTimeout(r, 280));
  } catch (e) {}

  // render dashboard
  try {
    await webview.executeJavaScript(`
      (() => {
        document.getElementById("srm-loading-overlay")?.remove();

        const data = ${JSON.stringify(result)};

        // ── Overlay shell ──────────────────────────────────────
        const overlay = document.createElement("div");
        overlay.id = "srm-dashboard-overlay";
        overlay.style.cssText = [
          "position:fixed",
          "top:0",
          "left:0",
          "width:100vw",
          "height:100vh",
          "background:#0a0a0c",
          "color:#f5f5f7",
          "z-index:2147483647",
          "font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
          "display:flex",
          "flex-direction:column",
          "-webkit-font-smoothing:antialiased",
        ].join(";");

        // ── Header ────────────────────────────────────────────
        const hdr = document.createElement("div");
        hdr.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;background:#0d0d10;";
        hdr.innerHTML = \`
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:28px;height:28px;border-radius:7px;background:linear-gradient(145deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:13px;">⚡</div>
            <span style="font-size:14px;font-weight:600;letter-spacing:-0.2px;">SRM Browser</span>
            \${data.sectionRoom ? \`<span style="font-size:10px;background:rgba(99,102,241,0.18);color:#818cf8;padding:2px 9px;border-radius:999px;font-weight:600;letter-spacing:0.2px;">\${data.sectionRoom}</span>\` : ""}
          </div>
          <div style="display:flex;gap:5px;" id="srm-tabs">
            <button class="srm-t" data-tab="today">Today</button>
            <button class="srm-t" data-tab="attendance">Attendance</button>
            <button class="srm-t" data-tab="marks">Marks</button>
            <button id="srm-portal-btn" style="padding:5px 13px;border:1px solid rgba(255,255,255,0.1);border-radius:6px;cursor:pointer;font-size:11px;font-weight:500;color:rgba(255,255,255,0.55);background:transparent;font-family:inherit;">Portal</button>
          </div>
        \`;
        overlay.appendChild(hdr);

        // ── Content ───────────────────────────────────────────
        const body = document.createElement("div");
        body.id = "srm-body";
        body.style.cssText = "flex:1;overflow:auto;padding:18px 20px;";
        overlay.appendChild(body);

        document.body.appendChild(overlay);

        // ── Show-dashboard floating button ─────────────────────
        const fab = document.createElement("button");
        fab.id = "srm-show-dashboard-btn";
        fab.innerText = "Dashboard";
        fab.style.cssText = "position:fixed;bottom:16px;right:16px;z-index:2147483647;display:none;padding:8px 16px;border:none;border-radius:9px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;letter-spacing:0.1px;box-shadow:0 4px 14px rgba(99,102,241,0.4);";
        document.body.appendChild(fab);

        // ── Tab style helper ──────────────────────────────────
        function activateTab(name) {
          overlay.querySelectorAll(".srm-t").forEach(b => {
            const on = b.dataset.tab === name;
            b.style.cssText = \`padding:5px 13px;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;font-family:inherit;letter-spacing:0.1px;background:\${on ? "rgba(99,102,241,0.22)" : "transparent"};color:\${on ? "#818cf8" : "rgba(255,255,255,0.4)"};\`;
          });
        }

        // ── Shared card style ─────────────────────────────────
        const card = "background:#111114;border-radius:12px;border:1px solid rgba(255,255,255,0.06);";

        // ── TODAY ─────────────────────────────────────────────
        function renderToday() {
          activateTab("today");
          const day  = data.todayDayOrder;
          const grid = data.slotGrid || {};
          const tt   = data.timetable || [];

          if (!day || !grid[day]) {
            body.innerHTML = \`
              <div style="\${card}padding:20px;">
                <div style="font-size:11px;letter-spacing:.5px;opacity:.3;margin-bottom:8px;">TODAY</div>
                <div style="font-size:14px;opacity:.55;">No timetable data available.</div>
                <div style="font-size:10px;opacity:.2;margin-top:10px;">
                  Day order: \${day || "not detected"} &nbsp;·&nbsp;
                  Slot grid days: \${Object.keys(grid).join(", ") || "none"} &nbsp;·&nbsp;
                  Timetable entries: \${tt.length}
                </div>
              </div>
            \`;
            return;
          }

          const daySlots = grid[day];
          const classes  = [];
          tt.forEach(sub => {
            const slot = daySlots[sub.courseCode];
            if (!slot) return;
            classes.push({ subject: sub.courseTitle, room: sub.room || "TBA", faculty: sub.faculty || "", start: slot.start, end: slot.end });
          });
          classes.sort((a, b) => a.start.localeCompare(b.start));

          const now = new Date();
          const cur = now.getHours() * 60 + now.getMinutes();
          const toM = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

          let next = null, status = "No more classes today", live = false;
          for (const cls of classes) {
            const s = toM(cls.start), e = toM(cls.end);
            if (cur >= s && cur <= e) { next = cls; status = "Ends in " + (e - cur) + " mins"; live = true; break; }
            if (cur < s) { next = cls; status = "Starts in " + (s - cur) + " mins"; break; }
          }

          body.innerHTML = \`
            <div style="display:grid;gap:10px;">
              <div style="\${card}padding:18px 20px;">
                <div style="font-size:10px;font-weight:600;letter-spacing:.6px;opacity:.3;margin-bottom:10px;">\${live ? "NOW IN CLASS" : "NEXT CLASS"}</div>
                \${next ? \`
                  <div style="font-size:18px;font-weight:600;letter-spacing:-0.2px;margin-bottom:5px;">\${next.subject}</div>
                  <div style="font-size:12px;opacity:.45;">\${next.room}\${next.faculty ? " · " + next.faculty : ""}</div>
                  <div style="display:inline-block;margin-top:10px;font-size:11px;font-weight:600;color:#818cf8;background:rgba(99,102,241,0.12);padding:3px 10px;border-radius:999px;">\${status}</div>
                \` : \`<div style="font-size:14px;opacity:.4;">\${status}</div>\`}
              </div>

              <div style="\${card}overflow:hidden;">
                <div style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:10px;font-weight:600;letter-spacing:.6px;opacity:.3;">\${day} · SCHEDULE</div>
                <div style="padding:0 20px;">
                  \${classes.length ? classes.map((cls, i) => \`
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:13px 0;\${i < classes.length-1 ? "border-bottom:1px solid rgba(255,255,255,0.04);" : ""}">
                      <div>
                        <div style="font-size:13px;font-weight:500;">\${cls.subject}</div>
                        <div style="font-size:11px;opacity:.35;margin-top:2px;">\${cls.room}\${cls.faculty ? " · " + cls.faculty : ""}</div>
                      </div>
                      <div style="font-size:11px;opacity:.4;white-space:nowrap;margin-left:14px;font-variant-numeric:tabular-nums;">\${cls.start}–\${cls.end}</div>
                    </div>
                  \`).join("") : \`<div style="padding:16px 0;font-size:13px;opacity:.3;">No classes found for \${day}.</div>\`}
                </div>
              </div>
            </div>
          \`;
        }

        // ── ATTENDANCE ────────────────────────────────────────
        function renderAttendance() {
          activateTab("attendance");
          const att = data.attendance || [];

          if (!att.length) {
            body.innerHTML = \`<div style="\${card}padding:20px;font-size:13px;opacity:.45;">No attendance data found.</div>\`;
            return;
          }

          const totalSkip = att.reduce((s, r) => s + Math.max(0, Math.floor((r.attended - r.total * 0.75) / 0.75)), 0);
          const avgPct    = Math.round(att.reduce((s, r) => s + r.percentage, 0) / att.length);

          const statPill = (label, val, sub) => \`
            <div style="\${card}padding:16px 18px;">
              <div style="font-size:9px;font-weight:700;letter-spacing:.7px;opacity:.25;margin-bottom:8px;">\${label}</div>
              <div style="font-size:26px;font-weight:600;letter-spacing:-0.5px;">\${val}</div>
              \${sub ? \`<div style="font-size:10px;opacity:.28;margin-top:3px;">\${sub}</div>\` : ""}
            </div>\`;

          body.innerHTML = \`
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">
              \${statPill("OVERALL ATTENDANCE", avgPct + "%")}
              \${statPill("SAFE LEAVES", totalSkip, "can still skip")}
              \${statPill("SUBJECTS", att.length)}
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px;">
              \${att.map(sub => {
                const pct      = Math.round(sub.percentage) || 0;
                const clr      = pct >= 75 ? "#34d399" : pct >= 65 ? "#fbbf24" : "#f87171";
                const canSkip  = Math.max(0, Math.floor((sub.attended - sub.total * 0.75) / 0.75));
                const needMore = pct < 75 ? Math.ceil((0.75 * sub.total - sub.attended) / 0.25) : 0;
                return \`
                  <div style="\${card}padding:15px 16px;">
                    <div style="font-size:12px;font-weight:500;line-height:1.3;margin-bottom:2px;">\${sub.courseTitle}</div>
                    <div style="font-size:9px;opacity:.3;margin-bottom:11px;letter-spacing:.2px;">\${sub.courseCode}\${sub.slot ? " · " + sub.slot : ""}</div>
                    <div style="height:3px;background:rgba(255,255,255,0.06);border-radius:999px;margin-bottom:9px;">
                      <div style="width:\${Math.min(pct,100)}%;height:100%;background:\${clr};border-radius:999px;"></div>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                      <span style="font-size:10px;opacity:.3;">\${sub.attended}/\${sub.total} classes</span>
                      <span style="font-size:13px;font-weight:600;color:\${clr};">\${pct}%</span>
                    </div>
                    <div style="font-size:9px;opacity:.22;margin-top:5px;">
                      \${pct >= 75 ? "Can skip " + canSkip + " more" : "Need " + needMore + " more to reach 75%"}
                    </div>
                  </div>
                \`;
              }).join("")}
            </div>
          \`;
        }

        // ── MARKS ─────────────────────────────────────────────
        function renderMarks() {
          activateTab("marks");
          const marks = data.marks || [];

          if (!marks.length) {
            body.innerHTML = \`<div style="\${card}padding:20px;font-size:13px;opacity:.45;">No marks data found.</div>\`;
            return;
          }

          body.innerHTML = \`
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:8px;">
              \${marks.map(sub => {
                const tests = sub.testPerformance || [];
                const total = tests.reduce((a, t) => a + (t.scored || 0), 0);
                const max   = tests.reduce((a, t) => a + (t.maximum || 0), 0);
                const pct   = max ? Math.round((total / max) * 100) : 0;
                const clr   = pct >= 75 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#f87171";
                return \`
                  <div style="\${card}padding:15px 16px;">
                    <div style="font-size:12px;font-weight:500;line-height:1.3;margin-bottom:2px;">\${sub.courseTitle}</div>
                    <div style="font-size:9px;opacity:.28;margin-bottom:12px;letter-spacing:.2px;">\${sub.courseCode} · \${sub.courseType || ""}</div>
                    \${tests.map((t, i) => \`
                      <div style="display:flex;justify-content:space-between;padding:6px 0;\${i < tests.length-1 ? "border-bottom:1px solid rgba(255,255,255,0.04);" : ""}">
                        <span style="font-size:11px;opacity:.4;">\${t.testName}</span>
                        <span style="font-size:11px;font-weight:500;">\${t.scored}/\${t.maximum}</span>
                      </div>
                    \`).join("")}
                    <div style="display:flex;justify-content:space-between;margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);">
                      <span style="font-size:10px;opacity:.28;">Total</span>
                      <span style="font-size:12px;font-weight:600;color:\${clr};">\${total}/\${max} (\${pct}%)</span>
                    </div>
                  </div>
                \`;
              }).join("")}
            </div>
          \`;
        }

        // ── Wire up ───────────────────────────────────────────
        renderToday();

        overlay.querySelectorAll(".srm-t").forEach(btn => {
          btn.addEventListener("click", () => {
            const t = btn.dataset.tab;
            if (t === "today")      renderToday();
            if (t === "attendance") renderAttendance();
            if (t === "marks")      renderMarks();
          });
        });

        document.getElementById("srm-portal-btn").addEventListener("click", () => {
          overlay.style.display = "none";
          fab.style.display = "block";
        });

        fab.addEventListener("click", () => {
          overlay.style.display = "flex";
          fab.style.display = "none";
        });

        // ── Scrollbar ─────────────────────────────────────────
        const st = document.createElement("style");
        st.textContent = "#srm-body::-webkit-scrollbar{width:4px}#srm-body::-webkit-scrollbar-track{background:transparent}#srm-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:999px}.srm-t{transition:all .15s}";
        document.head.appendChild(st);
      })();
    `);
  } catch (e) {
    console.error("Dashboard render error:", e);
  }
};
