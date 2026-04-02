import { useEffect, useRef, useState } from "react";
import { injectSRMDeskWidget } from "./injectors/srmDeskInjector";

const quickApps = {
  academia: "https://academia.srmist.edu.in",
  gmail: "https://mail.google.com",
  leetcode: "https://leetcode.com",
  github: "https://github.com/Banisher2005/SRM-Desk"
};

export default function App() {
  const [url, setUrl] = useState("academia.srmist.edu.in");
  const [currentUrl, setCurrentUrl] = useState(
    "https://academia.srmist.edu.in"
  );

  const webviewRef = useRef(null);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleLoad = () => {
      if (webview.getURL().includes("academia.srmist.edu.in")) {
        injectSRMDeskWidget(webview);
      }
    };

    webview.addEventListener("did-finish-load", handleLoad);

    return () => {
      webview.removeEventListener("did-finish-load", handleLoad);
    };
  }, [currentUrl]);

  const goToPage = () => {
    let finalUrl = url.trim();

    if (!finalUrl.startsWith("http")) {
      if (finalUrl.includes(".") && !finalUrl.includes(" ")) {
        finalUrl = "https://" + finalUrl;
      } else {
        finalUrl =
          "https://www.google.com/search?q=" +
          encodeURIComponent(finalUrl);
      }
    }

    setCurrentUrl(finalUrl);
    setUrl(finalUrl);
  };

  const openQuickApp = (site) => {
    setUrl(site);
    setCurrentUrl(site);
  };

  return (
    <div style={styles.app}>
      <div style={styles.sidebar}>
        <button
          style={styles.sideBtn}
          onClick={() => openQuickApp(quickApps.academia)}
        >
          📚
        </button>
        <button
          style={styles.sideBtn}
          onClick={() => openQuickApp(quickApps.gmail)}
        >
          📩
        </button>
        <button
          style={styles.sideBtn}
          onClick={() => openQuickApp(quickApps.leetcode)}
        >
          💻
        </button>
        <button
          style={styles.sideBtn}
          onClick={() => openQuickApp(quickApps.github)}
        >
          🐙
        </button>
      </div>

      <div style={styles.main}>
        <div style={styles.topbar}>
          <button
            style={styles.navBtn}
            onClick={() => webviewRef.current?.goBack()}
          >
            ←
          </button>
          <button
            style={styles.navBtn}
            onClick={() => webviewRef.current?.goForward()}
          >
            →
          </button>
          <button
            style={styles.navBtn}
            onClick={() => webviewRef.current?.reload()}
          >
            ⟳
          </button>

          <input
            style={styles.urlBar}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && goToPage()}
          />

          <button style={styles.goBtn} onClick={goToPage}>
            Go
          </button>
        </div>

        <webview
          ref={webviewRef}
          src={currentUrl}
          style={styles.webview}
        />
      </div>
    </div>
  );
}

const styles = {
  app: {
    display: "flex",
    height: "100vh",
    background: "#09090b",
    color: "white",
    fontFamily: "Inter, sans-serif"
  },
  sidebar: {
    width: "70px",
    background: "#111113",
    borderRight: "1px solid #27272a",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "18px",
    paddingTop: "20px"
  },
  sideBtn: {
    width: "46px",
    height: "46px",
    borderRadius: "14px",
    border: "none",
    background: "#18181b",
    color: "white",
    fontSize: "22px",
    cursor: "pointer"
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column"
  },
  topbar: {
    display: "flex",
    gap: "10px",
    padding: "12px",
    borderBottom: "1px solid #27272a"
  },
  navBtn: {
    background: "#18181b",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer"
  },
  urlBar: {
    flex: 1,
    padding: "10px",
    borderRadius: "10px",
    border: "none",
    background: "#18181b",
    color: "white",
    outline: "none"
  },
  goBtn: {
    background: "#7c3aed",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer"
  },
  webview: {
    flex: 1,
    width: "100%"
  }
};