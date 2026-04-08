// Canvas renderer for the city map

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cellSize = canvas.width / GRID_SIZE;
  }

  render(env) {
    const ctx = this.ctx;
    const cs = this.cellSize;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = env.grid[y][x];
        ctx.fillStyle = cell === WALL ? '#2a2e3e' : '#e8eaf2';
        ctx.fillRect(x * cs, y * cs, cs, cs);
      }
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cs, 0);
      ctx.lineTo(i * cs, this.canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cs);
      ctx.lineTo(this.canvas.width, i * cs);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.floor(cs * 0.7)}px -apple-system, sans-serif`;

    for (const r of env.restaurantPositions) {
      ctx.fillText('🍕', r.x * cs + cs / 2, r.y * cs + cs / 2);
    }

    if (env.hasOrder && env.customerPos) {
      ctx.fillText('📍', env.customerPos.x * cs + cs / 2, env.customerPos.y * cs + cs / 2);
    }

    const ax = env.agentPos.x * cs + cs / 2;
    const ay = env.agentPos.y * cs + cs / 2;
    ctx.fillText(env.hasOrder ? '📦' : '🛵', ax, ay);
  }
}
