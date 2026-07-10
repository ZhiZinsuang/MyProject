import { 
  CELL_SIZE, COLS, ROWS, WIDTH, HEIGHT,
  grid, homePheromone, foodPheromone, foods 
} from './config.js';

import { score, chanceChangeCource, radiusAnthill } from './settings.js';

// Класс Муравья
export class Ant {
  constructor(p) {
    this.p = p;
    this.homeX = WIDTH / 2;
    this.homeY = HEIGHT * 0.6;
    this.x = this.homeX;
    this.y = this.homeY;
    
    let angle = p.random(p.TWO_PI);
    this.vx = p.cos(angle) * 1.5;
    this.vy = p.sin(angle) * 1.5;
    
    this.hasFood = false;
    this.searchRadius = 25; // Радиус обзора для поиска еды/дома/феромонов
  }

  update() {
    let cellX = Math.floor(this.x / CELL_SIZE);   //определяем индексы клетки, в которой находится муравей
    let cellY = Math.floor(this.y / CELL_SIZE);

    //  Оставляем феромоны на текущей позиции 
    if (cellX >= 0 && cellX < COLS && cellY >= 0 && cellY < ROWS) {
      if (this.hasFood) {
        foodPheromone[cellY][cellX] = 255; // Сильный след еды
      } else {
        homePheromone[cellY][cellX] = 255; // Сильный след дома
      }
    }

    //  Взаимодействие с едой и домом
    if (!this.hasFood) {
      // Ищем еду поблизости
      for (let i = foods.length - 1; i >= 0; i--) {
        let f = foods[i];
        if (this.p.dist(this.x, this.y, f.x, f.y) < f.radius) {
          this.hasFood = true;
          f.amount -= 1;
          if (f.amount <= 0) foods.splice(i, 1); // Съели источник
          this.vx *= -1; // Разворот домой
          this.vy *= -1;
          break;
        }
      }
    } else {
      // Несет еду домой
      if (this.p.dist(this.x, this.y, this.homeX, this.homeY) < radiusAnthill.value) {
        this.hasFood = false;
        score.value++; // Очко муравейнику
        this.vx *= -1; // Разворот на поиски
        this.vy *= -1;
      }
    }

    //  Выбор направления на основе феромонов 
    if (this.p.random(1) < chanceChangeCource.value) { // шанс скорректировать курс по запаху
      let targetGrid = this.hasFood ? homePheromone : foodPheromone;
      let bestX = this.vx;
      let bestY = this.vy;
      let maxPheromone = 0;

      // Проверяем 5 случайных точек впереди себя
      for (let i = 0; i < 5; i++) {
        let sampleAngle = this.p.atan2(this.vy, this.vx) + this.p.random(-0.8, 0.8);
        let checkX = this.x + this.p.cos(sampleAngle) * this.searchRadius;
        let checkY = this.y + this.p.sin(sampleAngle) * this.searchRadius;
        
        let cx = Math.floor(checkX / CELL_SIZE);
        let cy = Math.floor(checkY / CELL_SIZE);

        if (cx >= 0 && cx < COLS && cy >= 0 && cy < ROWS && grid[cy][cx] === 1) {
          if (targetGrid[cy][cx] > maxPheromone) {
            maxPheromone = targetGrid[cy][cx];
            bestX = this.p.cos(sampleAngle) * 1.5;
            bestY = this.p.sin(sampleAngle) * 1.5;
          }
        }
      }
      if (maxPheromone > 10) { // Если запах отчетливый — идем туда
        this.vx = this.p.lerp(this.vx, bestX, 0.8);
        this.vy = this.p.lerp(this.vy, bestY, 0.8);
      }
    }

    // Добавляем немного хаотичного шума в движение
    this.vx += this.p.random(-0.2, 0.2);
    this.vy += this.p.random(-0.2, 0.2);
    
    // Ограничение скорости
    let speed = this.p.dist(0, 0, this.vx, this.vy);
    if (speed > 2) { 
      this.vx = (this.vx / speed) * 2; 
      this.vy = (this.vy / speed) * 2; 
    }
    if (speed < 0.5) { 
      this.vx = (this.vx / speed) * 0.5; 
      this.vy = (this.vy / speed) * 0.5; 
    }

    // Физика движения и отскоков от стен
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
    if (this.hasFood) {
      this.p.fill(0, 200, 0); // Зеленый, если несет еду
    } else {
      this.p.fill(40, 20, 10); // Обычный коричневый
    }
    this.p.ellipse(this.x, this.y, 4, 4);
  }
}