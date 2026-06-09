# Delhi Indira Gandhi International Airport (DEL / VIDP) Specifications

This document outlines the layout, runway configurations, terminal operations, and taxiway structures modeled in the simulator.

---

## 1. Runway Infrastructure

Indira Gandhi International Airport operates with four parallel slanted runways. The simulator models these based on true headings and coordinate projections:

| Runway | Length | Slant Vector Coordinates | Primary Usage |
|---|---|---|---|
| **09/27** | 2,816m | `(150, 150) -> (800, 160)` | Domestic / General |
| **10/28** | 3,813m | `(100, 300) -> (900, 340)` | Main Central Operations |
| **11L/29R**| 4,400m | `(80, 520) -> (880, 590)` | Southern Parallel (Intl / Heavy) |
| **11R/29L**| 4,430m | `(80, 650) -> (880, 720)` | Southernmost Parallel (Heavy) |

### Slant Orientation Math
Each runway's path is drawn along its magnetic angle using vector math:
$$\theta = \text{atan2}(y_2 - y_1, x_2 - x_1)$$
The aircraft adjust their headings and trajectories along this line. Threshold markers and touchdown pads are rotated accordingly on the canvas display.

---

## 2. Terminals and Gate Assignments

The airport's passenger operations are split across three main terminals:

### Terminal 1 (T1) - Domestic LCC
*   **Location**: Top-right, near Runway 09/27.
*   **Gates**: `T1-1` to `T1-4`.
*   **Operators**: Low-Cost Carriers (e.g. IndiGo `6E`, SpiceJet `SG`, Akasa Air `QP`).

### Terminal 2 (T2) - Domestic
*   **Location**: Middle-left.
*   **Gates**: `T2-1` to `T2-3`.
*   **Operators**: Domestic operators.

### Terminal 3 (T3) - International & Full Service Hub
*   **Location**: Middle-left to Center.
*   **Architecture**: Modeled with three pier fingers extending downwards.
*   **Gates**: `T3-1` to `T3-8`.
*   **Operators**: International flights and full-service domestic airlines (e.g. Air India `AI`, Vistara `UK`, Emirates `EK`, British Airways `BA`).

---

## 3. Eastern Cross Taxiways (ECT)

*   **Description**: High-capacity parallel taxiways running vertically on the right side of the airport (`x = 820` to `x = 840`).
*   **Role**: Connects Runway 09/27 and Terminal 1 in the north to Terminals 2/3 and Runway 11/29 in the south without crossing intermediate runway paths, reducing taxi times and ground conflict bottlenecks.
