import { CELL_SIZE, ROWS, COLS } from "./config";

export class Enemy {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = 15;
    this.hp = 100;
    this.maxHp = 100;
    
    let angle = p.random(p.TWO_PI);
    this.vx = p.cos(angle) * 0.5; // Медленный ход
    this.vy = p.sin(angle) * 0.5;
  }

  update() {
    // Случайное блуждание врага
    this.vx += this.p.random(-0.1, 0.1);
    this.vy += this.p.random(-0.1, 0.1);
    
    let speed = this.p.mag(this.vx, this.vy);
    if (speed > 0.8) {
      this.vx = (this.vx / speed) * 0.8;
      this.vy = (this.vy / speed) * 0.8;
    }

    let nextX = this.x + this.vx;
    let nextY = this.y + this.vy;
    let nCellX = Math.floor(nextX / CELL_SIZE);
    let nCellY = Math.floor(nextY / CELL_SIZE);

    // Отскок от стен
    if (nCellX < 0 || nCellX >= COLS || nCellY < 0 || nCellY >= ROWS || grid[nCellY][nCellX] === 0) {
      this.vx *= -1;
      this.vy *= -1;
    } else {
      this.x = nextX;
      this.y = nextY;
    }
  }

  display() {
    // Тело врага (пусть будет большим фиолетовым)
    this.p.fill(138, 43, 226);
    this.p.noStroke();
    this.p.ellipse(this.x, this.y, this.radius * 2, this.radius * 2);

    // Полоска здоровья над врагом
    this.p.fill(200, 0, 0);
    this.p.rect(this.x - 15, this.y - 22, 30, 4);
    this.p.fill(0, 200, 0);
    let healthWidth = this.p.map(this.hp, 0, this.maxHp, 0, 30);
    this.p.rect(this.x - 15, this.y - 22, healthWidth, 4);
  }
}