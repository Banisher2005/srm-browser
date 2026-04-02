import { scrapeAll } from "../core/scraper";

export const injectSRMDeskWidget = async (webview) => {
  if (!webview) return;

  const result = await webview.executeJavaScript(`
    (${scrapeAll.toString()})()
  `);

  const existing = await webview.executeJavaScript(`
    document.getElementById("srm-widget")?.remove();
    true;
  `);

  await webview.executeJavaScript(`
    (() => {
      const widget = document.createElement("div");
      widget.id = "srm-widget";
      widget.style.position = "fixed";
      widget.style.top = "20px";
      widget.style.right = "20px";
      widget.style.zIndex = "99999";
      widget.style.background = "#111113";
      widget.style.color = "white";
      widget.style.padding = "18px";
      widget.style.borderRadius = "16px";
      widget.style.boxShadow = "0 0 20px rgba(0,0,0,0.3)";
      widget.style.fontFamily = "Inter, sans-serif";
      widget.style.minWidth = "240px";

      widget.innerHTML = \`
        📊 <b>SRM Desk Live</b><br/><br/>
        Overall: ${result.overallPct}%<br/>
        Safe Leaves: ${result.totalSkip}<br/>
        Subjects: ${result.attendance.length}
      \`;

      document.body.appendChild(widget);
    })();
  `);
};