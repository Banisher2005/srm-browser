# SRM Browser

A custom Electron and React-based productivity browser built specifically for SRM students. It combines a full desktop browsing experience with native SRM Academia enhancements such as live attendance scraping, safe leave prediction, and quick access to essential student tools.

## Overview

SRM Browser is designed to reduce the friction of switching between multiple tabs and portals. Instead of juggling Academia, Gmail, coding platforms, and productivity tools separately, everything is available inside a single focused desktop workspace.

Core highlights:

* Native SRM Desk integration inside Academia
* Live attendance analytics and safe leave prediction
* Smart omnibox with URL + search support
* Quick-launch sidebar for Academia, Gmail, LeetCode, and GitHub
* Foundation for dashboards, AI assistants, and section communication

---

## Features

### Browser Core

* Smart omnibox for both searches and URLs
* Back, forward, and reload navigation
* Electron-powered `webview` rendering
* Persistent quick-access sidebar
* Dark minimal interface optimized for long study sessions

### SRM Academia Integration

* Opens SRM Academia directly in the browser
* Uses Zoho hash-based navigation
* Automatically routes to the attendance page
* Injects SRM Desk widgets into the authenticated session
* No Chrome extension installation required

### Attendance Intelligence

* Real-time attendance scraping from the portal
* Overall attendance percentage
* Safe leave prediction
* Subject count detection
* Built from the original SRM Desk parsing logic

---

## Tech Stack

* Electron
* React
* Vite
* JavaScript
* Electron `webview`
* DOM scraping and injection layer

---

## Installation

```bash
# Clone the repository
git clone https://github.com/Banisher2005/srm-browser.git
cd srm-browser

# Install dependencies
npm install

# Start development mode
npm run dev
```

---

## How It Works

1. Launch SRM Browser
2. Open Academia from the sidebar
3. Log in normally using your SRM credentials
4. The browser auto-navigates to `#Page:My_Attendance`
5. The scraper reads the live iframe and DOM content
6. Attendance insights are injected as a floating widget

This works entirely within your existing authenticated SRM session.

---

## Project Structure

```bash
srm-browser/
├── electron/
│   └── main.js
├── src/
│   ├── core/
│   │   └── scraper.js
│   ├── injectors/
│   │   └── srmDeskInjector.js
│   ├── App.jsx
│   └── main.jsx
└── package.json
```

---

## Roadmap

* [x] Electron browser shell
* [x] Smart omnibox
* [x] Sidebar dock
* [x] Academia quick access
* [x] Hash-based attendance scraping
* [x] Live attendance widget
* [ ] Full SRM dashboard page
* [ ] Marks integration
* [ ] Timetable day-order engine
* [ ] AI attendance warning assistant
* [ ] Section-based communication
* [ ] Productivity widgets
* [ ] Release builds for Windows and Linux

---

## Vision

The long-term goal is to turn SRM Browser into a complete academic operating system for SRM students.

Instead of managing scattered tabs and tools, students get a dedicated workspace for academics, coding, communication, and planning.

A simple way to describe it:
**Arc Browser × SRM Desk × Student Workspace**

---

## Disclaimer

This is an independent student-built project and is not affiliated with SRM Institute of Science and Technology.
Use responsibly.

---

## Author

**Abhinav Kumar**
Built with caffeine, stubbornness, and a slight grudge against the default Academia UI
