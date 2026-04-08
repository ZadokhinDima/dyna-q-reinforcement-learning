const SLIDERS = ['alpha', 'gamma', 'epsilon', 'planning', 'maxSteps', 'tickDelay'];
const WINDOW_SIZE = 100;

const PALETTE = [
  '#818cf8', '#34d399', '#fb923c', '#f472b6',
  '#38bdf8', '#a78bfa', '#facc15', '#4ade80',
];

class CompareChart {
  constructor(canvas) {
    this.chart = new Chart(canvas, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: {
            title: { display: true, text: 'Step', color: '#8b8fa3' },
            ticks: { color: '#8b8fa3', maxTicksLimit: 10 },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
          y: {
            title: { display: true, text: `Reward (last ${WINDOW_SIZE} steps)`, color: '#8b8fa3' },
            ticks: { color: '#8b8fa3' },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
        },
        plugins: { legend: { display: false } },
      },
    });
  }

  addRun(labels, data, color, label) {
    if (labels.length > this.chart.data.labels.length) {
      this.chart.data.labels = labels;
    }
    this.chart.data.datasets.push({
      label, data,
      borderColor: color,
      backgroundColor: color + '22',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.3,
      fill: false,
    });
    this.chart.update('none');
  }

  clear() {
    this.chart.data.labels = [];
    this.chart.data.datasets = [];
    this.chart.update('none');
  }

  get runCount() { return this.chart.data.datasets.length; }
}

class App {
  constructor() {
    this.env = new Environment();
    this.renderer = new Renderer(document.getElementById('mapCanvas'));
    this.chart = new RewardChart(document.getElementById('rewardChart'));
    this.compareChart = new CompareChart(document.getElementById('compareChart'));
    this.agent = null;

    this.isRunning = false;
    this.totalSteps = 0;
    this.deliveries = 0;
    this.rewardWindow = [];
    this.tickDelay = 10;
    this.tickHandle = null;
    this.lastHp = null;

    this.bindUI();
    this.reset();
  }

  bindUI() {
    for (const id of SLIDERS) {
      const el = document.getElementById(id);
      const out = document.getElementById(id + 'Val');
      const update = () => {
        const v = parseFloat(el.value);
        out.textContent = (['planning', 'maxSteps', 'tickDelay'].includes(id)) ? v.toString() : v.toFixed(2);
        if (id === 'tickDelay') this.tickDelay = v;
      };
      el.addEventListener('input', update);
      update();
    }
    document.getElementById('startStopBtn').addEventListener('click', () => this.toggleStartStop());
    document.getElementById('clearCompareBtn').addEventListener('click', () => this.clearCompare());
  }

  readHyperparams() {
    return {
      alpha: parseFloat(document.getElementById('alpha').value),
      gamma: parseFloat(document.getElementById('gamma').value),
      epsilon: parseFloat(document.getElementById('epsilon').value),
      planningSteps: parseInt(document.getElementById('planning').value, 10),
      maxSteps: parseInt(document.getElementById('maxSteps').value, 10),
      tickDelay: parseInt(document.getElementById('tickDelay').value, 10),
    };
  }

  stop() {
    this.isRunning = false;
    if (this.tickHandle) { clearTimeout(this.tickHandle); this.tickHandle = null; }
    this.updateStartStopBtn();
  }

  toggleStartStop() {
    if (this.isRunning) {
      this.stop();
      this.addToCompare();
    } else {
      this.reset();
      this.start();
    }
  }

  updateStartStopBtn() {
    const btn = document.getElementById('startStopBtn');
    if (this.isRunning) {
      btn.textContent = '⏹ Стоп';
      btn.classList.add('is-running');
    } else {
      btn.textContent = '▶ Старт';
      btn.classList.remove('is-running');
    }
  }

  reset() {
    this.stop();
    const hp = this.readHyperparams();
    this.lastHp = hp;
    this.maxSteps = hp.maxSteps;
    this.tickDelay = hp.tickDelay;
    this.agent = new DynaQAgent({
      alpha: hp.alpha, gamma: hp.gamma,
      epsilon: hp.epsilon, planningSteps: hp.planningSteps,
    });
    this.env.reset();
    this.chart.clear();
    this.totalSteps = 0;
    this.deliveries = 0;
    this.rewardWindow = [];
    this.updateStats();
    this.renderer.render(this.env);
    this.updateStartStopBtn();
  }

  smooth(data, w = 10) {
    return data.map((_, i) => {
      const slice = data.slice(Math.max(0, i - w + 1), i + 1);
      return slice.reduce((a, b) => a + b, 0) / slice.length;
    });
  }

  addToCompare() {
    const snapshot = this.chart.getSnapshot();
    if (snapshot.data.length === 0) return;
    const idx = this.compareChart.runCount;
    const color = PALETTE[idx % PALETTE.length];
    const hp = this.lastHp;
    const label = `α=${hp.alpha} γ=${hp.gamma} ε=${hp.epsilon} n=${hp.planningSteps}`;
    this.compareChart.addRun(snapshot.labels, this.smooth(snapshot.data), color, label);
    this.renderCompareLabels();
  }

  renderCompareLabels() {
    const container = document.getElementById('compareLabels');
    const datasets = this.compareChart.chart.data.datasets;
    if (datasets.length === 0) {
      container.innerHTML = '<span class="compare-empty">Add a run using the button above</span>';
      return;
    }
    container.innerHTML = datasets.map((ds, i) => {
      const hidden = ds.hidden || false;
      return `
      <div class="compare-label-item ${hidden ? 'is-hidden' : ''}" data-index="${i}">
        <div class="label-color-dot" style="background:${hidden ? 'transparent' : ds.borderColor};border:2px solid ${ds.borderColor}"></div>
        <div class="label-params"><b>#${i + 1}</b><br>${ds.label.split(' ').join('  ')}</div>
      </div>`;
    }).join('');

    container.querySelectorAll('.compare-label-item').forEach(el => {
      el.addEventListener('click', () => {
        const i = parseInt(el.dataset.index, 10);
        const ds = this.compareChart.chart.data.datasets[i];
        ds.hidden = !ds.hidden;
        this.compareChart.chart.update('none');
        this.renderCompareLabels();
      });
    });
  }

  clearCompare() {
    this.compareChart.clear();
    document.getElementById('compareLabels').innerHTML =
      '<span class="compare-empty">Add a run using the button above</span>';
  }

  start() {
    this.isRunning = true;
    this.updateStartStopBtn();
    this.tick();
  }

  tick() {
    if (!this.isRunning) return;
    if (this.totalSteps >= this.maxSteps) {
      this.stop();
      this.addToCompare();
      return;
    }

    const state = this.env.getState();
    const action = this.agent.chooseAction(state);
    const { nextState, reward, done } = this.env.step(action);
    this.agent.learn(state, action, reward, nextState);
    this.agent.updateModel(state, action, reward, nextState);
    this.agent.planning();

    this.totalSteps += 1;

    this.rewardWindow.push(reward);
    if (this.rewardWindow.length > WINDOW_SIZE) this.rewardWindow.shift();

    // After delivery — keep position, reset order only (no full episode reset)
    if (done) {
      this.deliveries += 1;
      this.env.hasOrder = false;
    }

    if (this.totalSteps % WINDOW_SIZE === 0) {
      const windowSum = this.rewardWindow.reduce((a, b) => a + b, 0);
      this.chart.addDataPoint(this.totalSteps, windowSum);
    }

    this.renderer.render(this.env);
    this.updateStats();
    this.tickHandle = setTimeout(() => this.tick(), this.tickDelay);
  }

  updateStats() {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('statEpisode', this.totalSteps);
    const windowSum = this.rewardWindow.length > 0
      ? this.rewardWindow.reduce((a, b) => a + b, 0) : 0;
    set('statReward', windowSum.toFixed(0));
    set('statAvg', windowSum.toFixed(0));
    set('statDeliveries', this.deliveries);
  }
}

window.addEventListener('DOMContentLoaded', () => { window.app = new App(); });
