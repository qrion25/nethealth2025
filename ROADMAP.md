# NetHealth2025 – Roadmap to Version 5.0

This document outlines the planned evolution of NetHealth2025 from a Flask dashboard into a fully packaged, cross-platform desktop application that seamlessly integrates with each operating system while continuing to serve the user interface through the user's default web browser.

---

## Vision for v5.0

NetHealth2025 v5.0 aims to deliver:

- A true desktop application for macOS, Windows, and Linux  
- Automatic browser-based UI with a local server backend  
- Zero setup required (no manual Python or dependency installation)  
- Live system metrics tailored per operating system  
- Automatic theme switching based on local time  
- Improved performance, reliability, and update mechanisms  
- A cleaner, unified application structure  

---

## v5.0 Core Objectives

### 1. Cross-Platform Application Packaging

Package NetHealth2025 as a standalone application for all major operating systems.

Planned approaches:

- macOS: .app bundle with automated build  
- Windows: .exe packaged using PyInstaller or Briefcase  
- Linux: .AppImage or .deb package (distribution-dependent)  

Shared architecture goals:

- Embedded Python runtime  
- Fully frozen dependencies  
- App-controlled server lifecycle  
- Automatic browser launch  

Overall goals:

- Zero external dependencies  
- No virtual environments required  
- No system-level Python installation required  

---

### 2. Unified Application Launcher

Develop a cross-platform launcher responsible for:

- Detecting the user's operating system  
- Starting the backend server in a controlled subprocess  
- Managing dynamic port selection  
- Ensuring graceful shutdown  
- Providing consistent error and event logging across all platforms  

---

### 3. Automatic Theme Scheduling

Implement a universal theme scheduler that:

- Detects local system time  
- Automatically switches between light and dark modes  
- Allows user overrides  
- Uses OS color preference when available (macOS and Windows)  

Implementation tasks:

- Frontend theme scheduling module  
- Time-based checks  
- Local storage configuration  
- Optional system-level theme detection  

---

### 4. Time-Series Metrics Pipeline

Transition from snapshot-based metrics to historical tracking.

Planned features:

- Local lightweight metrics database (SQLite)  
- Background job collecting CPU, RAM, disk usage, load, and weather over time  
- API endpoints for historical queries  
- Visualizations using Chart.js or Plotly  

---

### 5. Modular Plugin Architecture (Phase 1)

Introduce a modular service-based system preparing for future plugins.

Goals for v5.0:

- Core system refactor into modular service interfaces  
- Plugin concept definition  
- Initial built-in plugins:  
  - System Metrics  
  - Network Discovery  
  - Weather  
  - Price Tracker  

---

### 6. Application Settings Panel

Create an in-dashboard settings module including:

- Theme selection  
- Theme scheduling options  
- Update interval settings  
- Weather API key configuration  
- Plugin enable/disable toggles  
- Local data retention and cache management  

Settings will be stored in a local cross-platform JSON configuration file.

---

### 7. Improved ARP Network Discovery

Enhance cross-platform network scanning reliability.

Planned improvements:

- Faster ARP parsing  
- Optional IPv6 NDP support  
- Optional UDP broadcast discovery  
- Device grouping and heuristic-based identification  

---

### 8. Optional Cloud Sync Layer (Experimental)

A long-term feature, not enabled by default.

Concept:

- Sync settings across devices  
- Optional account-based preferences  
- Fully local-first approach with no personal data collection  

This feature may extend beyond the v5.0 cycle.

---

## v5.0 Delivery Milestones

### Milestone 1 — Cross-Platform Packaging Foundation
- Freeze app structure  
- Embed Python runtime  
- Create packaging prototypes for macOS, Windows, and Linux  
- Resolve port conflicts and server lifecycle issues  
- Standardize multi-platform logging  

### Milestone 2 — Theme Scheduler and Settings Panel
- Implement frontend scheduling logic  
- Add system theme detection  
- Add user overrides  
- Build the Settings UI  
- Add configuration persistence  

### Milestone 3 — Historical Metrics Database
- Integrate SQLite  
- Build background collection process  
- Add versioned storage  
- Implement data visualization panels  

### Milestone 4 — Plugin Architecture (Phase 1)
- Abstract metrics, weather, and network modules  
- Implement plugin loader  
- Add service registration system  

### Milestone 5 — Public Beta (v5.0-beta)
- Provide installers for all supported platforms  
- Update documentation and README  
- Publish GitHub releases  
- Begin public feedback cycle  

### Milestone 6 — Stable Release (v5.0)
- Final bug fixes  
- Performance tuning  
- Cross-platform reliability verification  
- Publish release installers  
- Tag official v5.0 release and publish detailed release notes  

---