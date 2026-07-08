<template>
  <h3 class="title-style">Муравейник с едой и феромонами</h3>
  <div class="simulation-container">
    <div ref="canvasContainer" class="canvas-holder"></div>
    <div class="controls">
      <p>Муравьев: <strong>{{ antCount }}</strong> | Собранная еда: <strong class="food-score">{{ score }}</strong></p>

      <div class="control-row">
        <label for="antChange">Размер круга: {{ antCount }}px</label>
        <input 
          id="antChange"
          type="range" 
          min="10" 
          max="200" 
          v-model.number="antCount" 
        />
      </div>
      <div class="control-row">
        <label for="changeCource">Вероятность смены курса по феромонам: {{ chanceChangeCource }}</label>
        <input 
          id="changeCource"
          type="range" 
          min="0.1" 
          max="1" 
          step="0.1"
          v-model.number="chanceChangeCource" 
        />
      </div>
      <div class="control-row">
        <label for="radiusAh">Радиус муравейника {{ radiusAnthill }}</label>
        <input 
          id="radiusAh"
          type="range" 
          min="40" 
          max="100" 
          step="5"
          v-model.number="radiusAnthill" 
        />
      </div>

      <button @click="resetSimulation">Перегенерировать мир</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import p5 from 'p5';

const canvasContainer = ref(null);
const antCount = ref(150); 
const score = ref(0);
const chanceChangeCource = ref(0.5);
const radiusAnthill = ref(60);
let p5Instance = null;

// Настройки сетки
const COLS = 50;
const ROWS = 40;
const CELL_SIZE = 12;
const WIDTH = COLS * CELL_SIZE;
const HEIGHT = ROWS * CELL_SIZE;

let grid = [];
let homePheromone = [];
let foodPheromone = [];
let foods = [];

// Класс Еды
class Food {
  constructor(x, y, amount = 100) {
    this.x = x;
    this.y = y;
    this.amount = amount;
    this.radius = 15;
  }
}

// Класс Муравья
class Ant {
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

    //  Оставляем феромоны на текущей позиции (если внутри тоннеля/на поверхности)
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
    if (this.p.random(1) < chanceChangeCource.value) { // 50% шанс скорректировать курс по запаху
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

class Queen {
  constructor(p) {
    this.p = p;
    // Размещаем матку точно в центре стартовой камеры (дома)
    this.x = WIDTH / 2;
    this.y = HEIGHT * 0.6;
    this.size = 14;          // Матка заметно крупнее обычного муравья
    this.spawnCooldown = 180; // Спавн каждые 180 кадров (примерно 3 секунды при 60 FPS)
    this.timer = 0;
  }

  update(antsArray) {
    this.timer++;

    // Проверяем кулдаун
    if (this.timer >= this.spawnCooldown) {
      this.timer = 0;
      
      // Создаем нового муравья и передаем в массив симуляции
      // Передаем контекст p5 (this.p)
      antsArray.push(new Ant(this.p)); 
      
      // Логируем в реактивную переменную Vue 
      antCount.value = antsArray.length;
    }
  }

  display() {
    this.p.noStroke();
    this.p.fill(80, 10, 10); // Темно-бордовый
    
    // Рисуем матку в виде крупного вытянутого муравья (из двух сегментов)
    this.p.ellipse(this.x, this.y, this.size, this.size * 0.8);
    this.p.ellipse(this.x - 4, this.y, this.size * 0.7, this.size * 0.7); // Брюшко
  }
}

// Генератор карты
const generateMap = () => {
  grid = Array(ROWS).fill().map(() => Array(COLS).fill(0));
  homePheromone = Array(ROWS).fill().map(() => Array(COLS).fill(0));
  foodPheromone = Array(ROWS).fill().map(() => Array(COLS).fill(0));
  foods = [];
  score.value = 0;

  // Поверхность (верхняя треть карты полностью открыта для вольного хождения)
  for (let y = 0; y < Math.floor(ROWS * 0.3); y++) {
    for (let x = 0; x < COLS; x++) {
      grid[y][x] = 1;
    }
  }

  // Стартовая камера в центре под землей
  const centerX = Math.floor(COLS / 2);
  const centerY = Math.floor(ROWS * 0.6);
  for (let y = centerY - 2; y <= centerY + 2; y++) {
    for (let x = centerX - 3; x <= centerX + 3; x++) {
      grid[y][x] = 1;
    }
  }

  // Копаем тоннели, включая те, что ведут на поверхность
  for (let i = 0; i < 5; i++) {
    let cx = centerX;
    let cy = centerY;
    let ban = null;
    for (let steps = 0; steps < 200; steps++) {
      let dir = Math.floor(Math.random() * 4);  //случайное число от 0 до 3
      if (dir === 0 && i != 3) cx++;
      if (dir === 1 && i != 2) cx--;
      if (dir === 2 && i >= 2) cy++;
      if (dir === 3 && i != 4) cy--;

      cx = Math.max(2, Math.min(COLS - 2, cx));   //ограничения, чтоб не ушли за карту
      cy = Math.max(1, Math.min(ROWS - 2, cy));
      grid[cy][cx] = 1;
      grid[cy - 1][cx] = 1;
      grid[cy][cx - 1] = 1;

      if (i < 2 && cy === 1) break;   //выход из цикла, если 2 первых копателя достигли верхней границы
      else if (i < 2) {
        grid[cy][cx + 1] = 1;
        grid[cy - 1][cx] = 1;
      }

      // копаем камеру справа 
      if (i === 2 && (cx === Math.floor(COLS * 0.8) || cy === Math.floor(ROWS * 0.4))){
        for (let j = 0; j < 7; j++) {
          grid[cy][cx + j] = 1;
          grid[cy - 1][cx + j] = 1;
          grid[cy - 2][cx + j] = 1;
        }
        break;
      }

      // копаем камеру слева
      if (i === 3 && (cx === Math.floor(COLS * 0.2) || cy === Math.floor(ROWS * 0.4))){
        for (let j = 0; j < 7; j++) {
          grid[cy][cx - j] = 1;
          grid[cy - 1][cx - j] = 1;
          grid[cy - 2][cx - j] = 1;
        }
        break;
      }

      // копаем нижнюю камеру
      if (i === 4 && cy === ROWS - 2){
        for (let j = 0; j < 9; j++) {
          grid[cy][cx - j] = 1;
          grid[cy - 1][cx - j] = 1;
          grid[cy - 2][cx - j] = 1;
        }
        break;
      }
    }
  }

  //  Генерируем 3 кучки еды на поверхности
  foods.push(new Food(WIDTH * 0.2, HEIGHT * 0.15, 150));
  foods.push(new Food(WIDTH * 0.5, HEIGHT * 0.10, 150));
  foods.push(new Food(WIDTH * 0.8, HEIGHT * 0.15, 150));
};

const initP5 = () => {
  const sketch = (p) => {
    let ants = [];
    let queen = null;

    p.setup = () => {
      p.createCanvas(WIDTH, HEIGHT).parent(canvasContainer.value);
      generateMap();
      for (let i = 0; i < antCount.value; i++) {
        ants.push(new Ant(p));
      }
      queen = new Queen(p);   // Создаём матку
    };

    p.draw = () => {
      p.background(139, 69, 19); // Цвет земли

      // Отрисовка тоннелей и поверхности
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (grid[y][x] === 1) {
            // Если это верхняя часть — красим как траву, ниже — как пещеру
            if (y < Math.floor(ROWS * 0.3)) {
              p.fill(80,200,120); // Небо
            } else {
              p.fill(222, 184, 135); // Пещера
            }
            p.noStroke();   //без контура
            p.rect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

            // Визуализация феромонов (подсветка синим и красным)
            if (homePheromone[y][x] > 0) {
              p.fill(0, 0, 255, homePheromone[y][x] * 0.15);
              p.rect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
              homePheromone[y][x] -= 0.9; // Испарение домашнего феромона
            }
            if (foodPheromone[y][x] > 0) {
              p.fill(255, 0, 0, foodPheromone[y][x] * 0.25);
              p.rect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
              foodPheromone[y][x] -= 0.9; // Испарение пищевого феромона
            }
          }
        }
      }

      // Отрисовка еды
      for (let f of foods) {
        p.fill(34, 139, 34);    // Зеленые маркеры ресурсов
        p.ellipse(f.x, f.y, f.radius);
      }

      // Обновление и отрисовка матки 
      if (queen) {
        queen.update(ants);
        queen.display();
      }

      // Обновление и отрисовка муравьев
      for (let ant of ants) {
        ant.update();
        ant.display();
      }
    };
  };

  p5Instance = new p5(sketch);
};

const resetSimulation = () => {
  if (p5Instance) {
    p5Instance.remove();
    initP5();
  }
};

onMounted(() => initP5());
onBeforeUnmount(() => { if (p5Instance) p5Instance.remove(); });
</script>

<style scoped>
.control-row{
  margin: 3px;
}
.title-style{
  margin-bottom: 15px;
  text-align: center;
  font-family: sans-serif;
  color: #333;
}
.simulation-container {
  display: flex;

  font-family: sans-serif;
  color: #333;
}
.controls {
  margin-bottom: 15px;
  text-align: center;
  border: 4px solid #451a03;
  width: 40%;

  display: block;
}
.food-score {
  color: #16a34a;
  font-size: 1.1em;
}
button {
  padding: 8px 16px;
  background-color: #059669;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin: 7px;
}
button:hover {
  background-color: #047857;
}
.canvas-holder {
  border: 4px solid #451a03;
  border-radius: 8px;
  overflow: hidden;
  width: v-bind(WIDTH + 'px');
  height: v-bind(HEIGHT + 'px')
}
</style>
