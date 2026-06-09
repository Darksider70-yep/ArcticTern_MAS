# Hierarchical Multi-Agent System (HMAS) Architectural Design

This document describes the design, communication protocol, and reinforcement learning formulation of the Hierarchical Multi-Agent System (HMAS) in ArcticTern ATC.

```mermaid
graph TD
    subgraph Coordinator Layer
        C[Coordinator Agent]
    </td>
    subgraph Operational Agents
        W[Weather Agent]
        T[Traffic Agent]
        R[Runway Agent]
        G[Gate Agent]
    end
    subgraph Tactical Layer
        F[Flight Agent 1]
        F2[Flight Agent 2]
    end

    C <--> W
    C <--> T
    C <--> R
    C <--> G
    R <--> F
    G <--> F
    T <--> F
    T <--> F2
```

---

## 1. Agent Definitions & Roles

### Flight Agent (Tactical)
*   **Role**: Autonomously pilots individual aircraft along approach paths, holds, landing sequences, gate turnarounds, and takeoffs.
*   **State Space**:
    *   `weatherSeverity`: Discretized into `[Low, Medium, High]`
    *   `fuelLevel`: Discretized into `[Critical, Low, Normal]`
    *   `queuePosition`: Discretized into `[Short, Medium, Long]`
    *   `holdingState`: Binary `[IsHolding, IsNotHolding]`
*   **Action Space**:
    *   `REQUEST_LANDING`: Seek landing queue assignment.
    *   `HOLD_PATTERN`: Hold in a circular orbit to burn time/congested spacing.
    *   `DIVERT`: Divert to alternate airport (triggered by low fuel or severe weather).
    *   `REQUEST_TAKEOFF`: Request taxi to runway for departure.
    *   `TAXI_TO_GATE`: Taxi to assigned gate after landing.
    *   `TAXI_TO_RUNWAY`: Taxi to assigned runway for departure.
*   **Reward Function**:
    *   $R = +0.5 \text{ (on landing)} - (\text{Delay} \times 0.01) - 1.0 \text{ (if fuel critical)}$

### Runway Agent (Operational)
*   **Role**: Manages sequencing, separation class rules, cooldown times, and active configurations of the runways.
*   **State Space**:
    *   `totalQueue`: Combined length of landing/takeoff queues `[Empty, Short, Medium, Long]`
    *   `anyOccupied`: Binary `[Occupied, Free]`
    *   `weatherSeverity`: Discretized storm level
    *   `hasDepartures`: Binary indicator if there are aircraft ready to depart
*   **Action Space**:
    *   `CLEAR_LANDING`: Clear the first arriving aircraft for touchdown.
    *   `CLEAR_TAKEOFF`: Clear the first departing aircraft for takeoff.
    *   `HOLD`: Keep all aircraft in their respective queues.
    *   `SWITCH_RUNWAY`: Re-allocate active runways or reopen closed ones due to wind/weather change.
*   **Reward Function**:
    *   $R = +1.0 \text{ (successful operation)} - (\text{Queue Length} \times 0.05)$

### Gate Agent (Operational)
*   **Role**: Allocates Terminal gates (T1, T2, T3) according to carrier profiles and handles turnaround processes.
*   **State Space**:
    *   `freeGates`: Count of empty gates `[0, 1-2, 3+]`
    *   `pendingArrivals`: Count of landed aircraft waiting for gate allocation
    *   `hasReadyRelease`: Binary indicator if turnaround is complete for any parked aircraft
*   **Action Space**:
    *   `ASSIGN_GATE`: Assign a gate matching the airline terminal rules (LCC to T1/T2, Full Service/Intl to T3).
    *   `REASSIGN`: Shift an aircraft assignment to optimize gates.
    *   `HOLD_TAXIWAY`: Hold aircraft in taxiways if gates are fully occupied.
    *   `RELEASE`: Release terminal gate and clear flight for runway taxi.

### Weather Agent (Operational / Environment)
*   **Role**: Simulates weather state machine transitions (`CLEAR`, `CLOUDY`, `STORM`, `CLEARING`) and generates storm cells moving across coordinates.

### Traffic Agent (Operational / Safety)
*   **Role**: Scans airspace coordinates to calculate distances between all active aircraft, flags conflict zones (breaches of 3nm horizontal or 1000ft vertical separation margins), and alerts the Coordinator.

### Coordinator (Global Controller)
*   **Role**: Resolves conflicts detected by the Traffic Agent (by prioritizing lower fuel flights and ordering spacing holds), gathers local agent states, and publishes global metrics/schedule updates.

---

## 2. Shared Learning & Q-Tables
*   All `FlightAgent` instances share a global Q-Table to aggregate experience from multiple parallel flights.
*   Learning rate $\alpha = 0.1$, discount factor $\gamma = 0.9$, and exploration epsilon $\epsilon = 0.15$ with decay.
