// Reward chart — rolling reward sum over last WINDOW_SIZE steps

class RewardChart {
  constructor(canvas) {
    this.points = [];
    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Reward (last 100 steps)',
          data: [],
          borderColor: '#818cf8',
          backgroundColor: 'rgba(99,102,241,0.1)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: {
            title: { display: true, text: 'Step', color: '#8b8fa3' },
            ticks: { color: '#8b8fa3', maxTicksLimit: 8 },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
          y: {
            title: { display: true, text: 'Reward (last 100 steps)', color: '#8b8fa3' },
            ticks: { color: '#8b8fa3' },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
        },
        plugins: {
          legend: { labels: { color: '#e4e4e7', font: { size: 11 } } },
        },
      },
    });
  }

  addDataPoint(step, rewardSum) {
    this.points.push({ step, rewardSum });
    this.chart.data.labels.push(step);
    this.chart.data.datasets[0].data.push(rewardSum);
    this.chart.update('none');
    return rewardSum;
  }

  getSnapshot() {
    return {
      labels: [...this.chart.data.labels],
      data: [...this.chart.data.datasets[0].data],
    };
  }

  clear() {
    this.points = [];
    this.chart.data.labels = [];
    this.chart.data.datasets[0].data = [];
    this.chart.update('none');
  }
}
