const GRID_SIZE = 10;
const EMPTY = 0;
const WALL = 1;
const RESTAURANT = 2;

const ACTION_UP = 0;
const ACTION_DOWN = 1;
const ACTION_LEFT = 2;
const ACTION_RIGHT = 3;
const NUM_ACTIONS = 4;

const REWARD_STEP = -1;
const REWARD_PICKUP = 5;
const REWARD_DELIVERY = 20;

const START_POS      = { x: 0, y: 0 };
const RESTAURANT_POS = { x: 9, y: 9 };
const CUSTOMER_POS   = { x: 4, y: 4 };


class Environment {
  constructor() {
    this.size = GRID_SIZE;
    this.grid = [];
    this.restaurantPositions = [RESTAURANT_POS];
    this.buildMap();
    this.agentPos = { ...START_POS };
    this.hasOrder = false;
    this.customerPos = { ...CUSTOMER_POS };
  }

  buildMap() {
    const g = [];
    for (let y = 0; y < this.size; y++) {
      g.push(new Array(this.size).fill(EMPTY));
    }

    const walls = [
      // Row 1
      [1,1],[2,1],[3,1],[6,1],[8,1],
      // Row 2
      [3,2],[8,2],
      // Row 3
      [0,3],[1,3],[3,3],[5,3],[6,3],[8,3],
      // Row 4
      [5,4],
      // Row 5
      [1,5],[2,5],[3,5],[4,5],[5,5],[7,5],[8,5],
      // Row 6
      [1,6],[7,6],
      // Row 7
      [1,7],[3,7],[4,7],[5,7],[7,7],[9,7],
      // Row 8
      [3,8],[9,8],
      // Row 9
      [4,9],[5,9],
    ];

    for (const [x, y] of walls) g[y][x] = WALL;
    g[RESTAURANT_POS.y][RESTAURANT_POS.x] = RESTAURANT;

    this.grid = g;
  }

  isWall(x, y) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return true;
    return this.grid[y][x] === WALL;
  }

  getState() {
    return `${this.agentPos.x},${this.agentPos.y},${this.hasOrder ? 1 : 0}`;
  }

  // Reset agent to start, clear order
  reset() {
    this.agentPos = { ...START_POS };
    this.hasOrder = false;
    return this.getState();
  }

  // Alias kept for app.js compatibility
  resetFull() {
    return this.reset();
  }

  step(action) {
    let nx = this.agentPos.x;
    let ny = this.agentPos.y;
    if (action === ACTION_UP)         ny -= 1;
    else if (action === ACTION_DOWN)  ny += 1;
    else if (action === ACTION_LEFT)  nx -= 1;
    else if (action === ACTION_RIGHT) nx += 1;

    let reward = REWARD_STEP;
    if (!this.isWall(nx, ny)) {
      this.agentPos.x = nx;
      this.agentPos.y = ny;
    }

    let done = false;
    const cell = this.grid[this.agentPos.y][this.agentPos.x];

    if (!this.hasOrder && cell === RESTAURANT) {
      this.hasOrder = true;
      reward += REWARD_PICKUP;
    } else if (
      this.hasOrder &&
      this.agentPos.x === CUSTOMER_POS.x &&
      this.agentPos.y === CUSTOMER_POS.y
    ) {
      reward += REWARD_DELIVERY;
      done = true;
    }

    return { nextState: this.getState(), reward, done };
  }
}
