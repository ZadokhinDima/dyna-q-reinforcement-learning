class DynaQAgent {
  constructor({ alpha, gamma, epsilon, planningSteps }) {
    this.alpha = alpha;
    this.gamma = gamma;
    this.epsilon = epsilon;
    this.planningSteps = planningSteps;
    this.Q = {};
    this.model = {};
    // For planning: visited states and per-state action lists
    this.visitedStates = [];
    this.stateActions = {};
  }

  ensureState(state) {
    if (!this.Q[state]) {
      this.Q[state] = new Array(NUM_ACTIONS).fill(0);
    }
  }

  getQValues(state) {
    this.ensureState(state);
    return this.Q[state];
  }

  chooseAction(state) {
    this.ensureState(state);
    if (Math.random() < this.epsilon) {
      return Math.floor(Math.random() * NUM_ACTIONS);
    }
    return this.argmax(this.Q[state]);
  }

  argmax(arr) {
    let best = 0;
    let bestVal = arr[0];
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] > bestVal) { bestVal = arr[i]; best = i; }
    }
    // random tie-breaking
    const ties = [];
    for (let i = 0; i < arr.length; i++) if (arr[i] === bestVal) ties.push(i);
    return ties[Math.floor(Math.random() * ties.length)];
  }

  learn(s, a, r, sNext) {
    this.ensureState(s);
    this.ensureState(sNext);
    const maxNext = Math.max(...this.Q[sNext]);
    const target = r + this.gamma * maxNext;
    this.Q[s][a] += this.alpha * (target - this.Q[s][a]);
  }

  updateModel(s, a, r, sNext) {
    const key = `${s}|${a}`;
    if (!this.model[key]) {
      if (!this.stateActions[s]) {
        this.stateActions[s] = [];
        this.visitedStates.push(s);
      }
      if (!this.stateActions[s].includes(a)) {
        this.stateActions[s].push(a);
      }
    }
    this.model[key] = { nextState: sNext, reward: r };
  }

  planning() {
    if (this.planningSteps <= 0 || this.visitedStates.length === 0) return;
    for (let i = 0; i < this.planningSteps; i++) {
      const s = this.visitedStates[Math.floor(Math.random() * this.visitedStates.length)];
      const acts = this.stateActions[s];
      const a = acts[Math.floor(Math.random() * acts.length)];
      const { nextState, reward } = this.model[`${s}|${a}`];
      this.learn(s, a, reward, nextState);
    }
  }
}
