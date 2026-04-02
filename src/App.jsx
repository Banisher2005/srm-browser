import { useRef, useState } from "react";

export default function App() {
  const [url, setUrl] = useState("academia.srmist.edu.in");
  const [currentUrl, setCurrentUrl] = useState(
    "https://academia.srmist.edu.in"
  );

  const webviewRef = useRef(null);

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
  };

  const goBack = () => {
    webviewRef.current?.goBack();
  };

  const goForward = () => {
    webviewRef.current?.goForward();
  };

  const reloadPage = () => {
    webviewRef.current?.reload();
  };

  return (
    <div style={styles.app}>
      <div style={styles.topbar}>
        <button style={styles.navBtn} onClick={goBack}>
          ←
        </button>

        <button style={styles.navBtn} onClick={goForward}>
          →
        </button>

        <button style={styles.navBtn} onClick={reloadPage}>
          ⟳
        </button>

        <input
          style={styles.urlBar}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && goToPage()}
          placeholder="Search Google or enter URL"
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
  );
}

const styles = {
  app: {
    background: "#09090b",
    color: "white",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "Inter, sans-serif"
  },
  topbar: {
    display: "flex",
    gap: "10px",
    padding: "12px",
    borderBottom: "1px solid #27272a",
    alignItems: "center",
    background: "#09090b"
  },
  navBtn: {
    background: "#18181b",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px"
  },
  urlBar: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#18181b",
    color: "white",
    outline: "none",
    fontSize: "14px"
  },
  goBtn: {
    background: "#7c3aed",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold"
  },
  webview: {
    width: "100%",
    height: "100%",
    flex: 1
  }
};