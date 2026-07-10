import { 
  CELL_SIZE, COLS, ROWS, WIDTH, HEIGHT,
  grid, homePheromone, enemies
} from './config.js';
import { chanceChangeCource  } from './settings.js';

export class DefenderAnt {
  constructor(p) {
    this.p = p;
    this.homeX = WIDTH / 2;
    this.homeY = HEIGHT * 0.6;
    this.x = this.homeX;
    this.y = this.homeY;
    
    let angle = p.random(p.TWO_PI);
    this.vx = p.cos(angle) * 1.5;
    this.vy = p.sin(angle) * 1.5;
    
    this.searchRadius = 40; // Защитники видят дальше обычных муравьев
    this.attackDamage = 0.5; // Урон, наносимый врагу за кадр
  }

  update() {
    let cellX = Math.floor(this.x / CELL_SIZE);
    let cellY = Math.floor(this.y / CELL_SIZE);

    // Оставляют след дома
    if (cellX >= 0 && cellX < COLS && cellY >= 0 && cellY < ROWS) {
      homePheromone[cellY][cellX] = 255;
    }

    // ПОИСК ВРАГА
    let targetEnemy = null;
    let closestDist = this.searchRadius;

    for (let i = 0; i < enemies.length; i++) {
      let d = this.p.dist(this.x, this.y, enemies[i].x, enemies[i].y);
      if (d < closestDist) {
        closestDist = d;
        targetEnemy = enemies[i];
      }
    }

    if (targetEnemy) {
      // Идем напрямую к врагу
      let angleToEnemy = this.p.atan2(targetEnemy.y - this.y, targetEnemy.x - this.x);
      let targetVx = this.p.cos(angleToEnemy) * 1.8; // Чуть быстрее обычного хода
      let targetVy = this.p.sin(angleToEnemy) * 1.8;
      
      this.vx = this.p.lerp(this.vx, targetVx, 0.2);
      this.vy = this.p.lerp(this.vy, targetVy, 0.2);

      // Если дошли до врага — атакуем
      if (closestDist < targetEnemy.radius) {
        targetEnemy.hp -= this.attackDamage;
        // Отталкиваемся немного назад после укуса, создавая эффект анимации атаки
        this.vx *= -0.5;
        this.vy *= -0.5;
      }
    } else {
      // ОБЫЧНОЕ ПАТРУЛИРОВАНИЕ (по домашним феромонам или хаотичное)
      if (this.p.random(1) < chanceChangeCource.value) {
        let bestX = this.vx;
        let bestY = this.vy;
        let maxPheromone = 0;

        for (let i = 0; i < 5; i++) {
          let sampleAngle = this.p.atan2(this.vy, this.vx) + this.p.random(-0.8, 0.8);
          let checkX = this.x + this.p.cos(sampleAngle) * this.searchRadius;
          let checkY = this.y + this.p.sin(sampleAngle) * this.searchRadius;
          let cx = Math.floor(checkX / CELL_SIZE);
          let cy = Math.floor(checkY / CELL_SIZE);

          if (cx >= 0 && cx < COLS && cy >= 0 && cy < ROWS && grid[cy][cx] === 1) {
            if (homePheromone[cy][cx] > maxPheromone) {
              maxPheromone = homePheromone[cy][cx];
              bestX = this.p.cos(sampleAngle) * 1.5;
              bestY = this.p.sin(sampleAngle) * 1.5;
            }
          }
        }
        if (maxPheromone > 10) {
          this.vx = this.p.lerp(this.vx, bestX, 0.4);
          this.vy = this.p.lerp(this.vy, bestY, 0.4);
        }
      }

      // Случайный шум
      this.vx += this.p.random(-0.2, 0.2);
      this.vy += this.p.random(-0.2, 0.2);
    }

    // Ограничение скорости
    let speed = this.p.mag(this.vx, this.vy);
    if (speed > 2.2) {
      this.vx = (this.vx / speed) * 2.2;
      this.vy = (this.vy / speed) * 2.2;
    } else if (speed < 0.5 && speed > 0) {
      this.vx = (this.vx / speed) * 0.5;
      this.vy = (this.vy / speed) * 0.5;
    }

    // Движение и отскок от стен
    let nextX = this.x + this.vx;
    let nextY = this.y + this.vy;
    let nCellX = Math.floor(nextX / CELL_SIZE);
    let nCellY = Math.floor(nextY / CELL_SIZE);

    if (nCellX < 0 || nCellX >= COLS || nCellY < 0 || nCellY >= ROWS || grid[nCellY][nCellX] === 0) {
      let angle = this.p.atan2(this.vy, this.vx) + this.p.PI + this.p.random(-1, 1);
      this.vx = this.p.cos(angle) * 1.5;
      this.vy = this.p.sin(angle) * 1.5;
    } else {
      this.x = nextX;
      this.y = nextY;
    }
  }

  display() {
    this.p.noStroke();
    this.p.fill(150, 0, 0); // Муравьи-защитники будут темно-красными
    this.p.ellipse(this.x, this.y, 6, 6); // И чуть крупнее обычных
  }
}