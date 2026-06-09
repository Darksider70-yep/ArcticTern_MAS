// ArcticTern ATC — Q-Learning Implementation
// Shared Q-table with epsilon-greedy action selection

export class QTable {
  constructor(actions, options = {}) {
    this.actions = actions;
    this.alpha = options.alpha || 0.1;      // Learning rate
    this.gamma = options.gamma || 0.9;      // Discount factor
    this.epsilon = options.epsilon || 0.3;  // Exploration rate
    this.epsilonDecay = options.epsilonDecay || 0.999;
    this.epsilonMin = options.epsilonMin || 0.05;
    this.table = {};                         // state -> {action: value}
    this.updateCount = 0;
  }

  /**
   * Get Q-value for a state-action pair.
   */
  getQ(state, action) {
    if (!this.table[state]) this.table[state] = {};
    return this.table[state][action] || 0;
  }

  /**
   * Get all Q-values for a state.
   */
  getStateValues(state) {
    if (!this.table[state]) this.table[state] = {};
    const values = {};
    for (const a of this.actions) {
      values[a] = this.table[state][a] || 0;
    }
    return values;
  }

  /**
   * Choose an action using epsilon-greedy strategy.
   * Returns { action, qValue, wasExploration }
   */
  chooseAction(state) {
    const isExplore = Math.random() < this.epsilon;

    if (isExplore) {
      const action = this.actions[Math.floor(Math.random() * this.actions.length)];
      return {
        action,
        qValue: this.getQ(state, action),
        wasExploration: true,
      };
    }

    // Exploit: pick best action
    let bestAction = this.actions[0];
    let bestValue = this.getQ(state, bestAction);

    for (let i = 1; i < this.actions.length; i++) {
      const v = this.getQ(state, this.actions[i]);
      if (v > bestValue) {
        bestValue = v;
        bestAction = this.actions[i];
      }
    }

    return {
      action: bestAction,
      qValue: bestValue,
      wasExploration: false,
    };
  }

  /**
   * Update Q-value using the Q-learning formula.
   * Q(s,a) += α * [R + γ * max(Q(s',a')) - Q(s,a)]
   */
  learn(state, action, reward, nextState) {
    if (!this.table[state]) this.table[state] = {};

    const oldQ = this.getQ(state, action);

    // Find max Q-value for next state
    let nextMaxQ = -Infinity;
    for (const a of this.actions) {
      const v = this.getQ(nextState, a);
      if (v > nextMaxQ) nextMaxQ = v;
    }
    if (nextMaxQ === -Infinity) nextMaxQ = 0;

    // Q-learning update
    const newQ = oldQ + this.alpha * (reward + this.gamma * nextMaxQ - oldQ);
    this.table[state][action] = newQ;

    // Decay epsilon
    this.epsilon = Math.max(this.epsilonMin, this.epsilon * this.epsilonDecay);
    this.updateCount++;

    return newQ;
  }

  /**
   * Pre-seed the Q-table with initial values for demo readiness.
   */
  seed(stateActionValues) {
    for (const [state, actionValues] of Object.entries(stateActionValues)) {
      this.table[state] = { ...actionValues };
    }
  }

  /**
   * Get statistics about the Q-table.
   */
  getStats() {
    const states = Object.keys(this.table).length;
    return {
      states,
      updates: this.updateCount,
      epsilon: this.epsilon.toFixed(3),
    };
  }
}

/**
 * Discretize a continuous value into buckets.
 * @param {number} value - The continuous value
 * @param {number[]} thresholds - Sorted array of thresholds
 * @returns {number} Bucket index (0 to thresholds.length)
 */
export function discretize(value, thresholds) {
  for (let i = 0; i < thresholds.length; i++) {
    if (value <= thresholds[i]) return i;
  }
  return thresholds.length;
}

/**
 * Create a state key from multiple discretized dimensions.
 */
export function makeStateKey(...values) {
  return values.join('_');
}
