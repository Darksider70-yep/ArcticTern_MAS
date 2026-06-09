# ArcticTern ATC — AI-Assisted Air Traffic Scheduling

An interactive, high-fidelity Multi-Agent System (MAS) simulation optimizing airport ground and airspace operations for **Delhi Indira Gandhi International Airport (DEL / VIDP)**, powered by Q-Learning agents.

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARCTICTERN ATC SIMULATION                    │
│                                                                 │
│   [ 🛩️ Approach ] ──> [ 🛬 Runway sequence ] ──> [ 🅿 Gate assignment ] │
│                             │                         │         │
│                       (Runway Agent)             (Gate Agent)   │
│                             │                         │         │
│                             └────< ECT Taxiway Bridge ┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✈️ Overview

ArcticTern ATC decomposes complex air traffic control and ground operations scheduling into smaller, specialized sub-problems resolved by cooperative reinforcement learning agents. Under extreme weather scenarios or runway maintenance shutdowns, the agents adapt dynamically to minimize delays, reduce fuel consumption, maintain safety separations, and maximize terminal utilization.

The visual interface is built as a highly sophisticated dark-theme radar canvas, with all physical parameters (runway angles, terminal fingers, airline carriers, and the Eastern Cross Taxiways) directly aligned with Delhi IGI Airport's official aerodrome charts.

---

## 🚀 Key Features

*   **Slanted 4-Runway Operations**: Real-time rendering and tracking of flight paths along the exact magnetic angles of DEL runways `09/27`, `10/28`, `11L/29R`, and `11R/29L`.
*   **Terminal Pier fingers**: Architectural modeling of Terminals 1, 2, and 3 with realistic gate layouts.
*   **Eastern Cross Taxiways (ECT)**: Parallel vertical taxi corridors connecting the northern and southern flight sectors.
*   **Carrier Gate Rules**: Automated routing of Low-Cost Carriers (IndiGo, SpiceJet, Akasa) to T1/T2, and International/Full-Service flights (Air India, Vistara, etc.) to T3.
*   **Multi-Agent Q-Learning**: Cooperative learning between Flight, Runway, and Gate agents.
*   **Dynamic Scenarios**: Test scheduler adaptability in *Normal Ops*, *Rush Hour* (48 active flights), *Severe Storm* (moving cells requiring spacing hold patterns), and *Runway Closure*.

---

## 📂 Project Structure

```
├── src/
│   ├── engine/                    # Pure-JS simulation engine
│   │   ├── SimEngine.js           # Master tick loop & pub/sub coordinator
│   │   ├── Airport.js             # Static DEL layout definitions
│   │   ├── QLearning.js           # Shared reinforcement learning algorithms
│   │   └── agents/                # Tactical and Operational agent instances
│   ├── components/                # React Radar Dashboard & Canvas layout
│   └── utils/                     # Decision narration templates & utilities
├── docs/                          # Detailed architecture & spec docs
└── README.md                      # Project entry point
```

---

## 📖 Documentation Directory

For deep dives into the system design, check our specialized documentation folder:
*   [Architectural Design Manual](file:///c:/Users/Daksh%20Gehlot/OneDrive/Desktop/ArcticTern_MAS/docs/ARCHITECTURAL_DESIGN.md) — HMAS agent formulations, state/action spaces, and rewards.
*   [Delhi Airport Specifications](file:///c:/Users/Daksh%20Gehlot/OneDrive/Desktop/ArcticTern_MAS/docs/DELHI_AIRPORT_SPECS.md) — Runway vector math, terminal gate boundaries, and taxiway graphs.
*   [Setup & Run Guide](file:///c:/Users/Daksh%20Gehlot/OneDrive/Desktop/ArcticTern_MAS/docs/RUN_GUIDE.md) — Quickstart commands and interactive scenario configurations.

---

## 🛠️ Quick Start

Install dependencies and start the development server:
```bash
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.
