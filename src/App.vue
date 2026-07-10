<template>
  <h2 class="title-style">Симуляция муравейника</h2>
  <div class="simulation-container">
    <div ref="canvasContainer" class="canvas-holder"></div>
    <div class="controls">
      <p>Муравьёв всего: <strong>{{ antCount +  defenderAntCount}}</strong> | Собранная еда: <strong class="food-score">{{ score }}</strong></p>

      <div class="control-row">
        <label for="antChange">Муравьёв обычных: {{ antCount }}</label>
        <input 
          id="antChange"
          type="range" 
          min="10" 
          max="200" 
          v-model.number="antCount" 
        />
      </div>
      <div class="control-row">
        <label for="defAntCount">Муравьёв-защитников: {{ defenderAntCount }}</label>
        <input 
          id="defAntCount"
          type="range" 
          min="5" 
          max="30" 
          step="1"
          v-model.number="defenderAntCount" 
        />
      </div>
      <div class="control-row">
        <label for="changeCource">Вероятность смены курса по феромонам: {{ chanceChangeCource*100 }}%</label>
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
        <label for="changeBirth">Вероятность рождения защитника: {{ changeBirthDefAnt*100 }}%</label>
        <input 
          id="changeBirth"
          type="range" 
          min="0.1" 
          max="1" 
          step="0.1"
          v-model.number="changeBirthDefAnt" 
        />
      </div>
      <div class="control-row">
        <label for="radiusAh">Радиус муравейника: {{ radiusAnthill }}px</label>
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
import { Food } from '../components/Food.js';
import { Queen } from '../components/Queen.js';
import { Ant } from '../components/Ant.js';
import { Enemy } from '../components/Enemy.js';
import {  antCount, defenderAntCount, 
  score, chanceChangeCource, changeBirthDefAnt, radiusAnthill
} from '../components/settings.js';
import { homePheromone, foodPheromone, grid, enemies, foods, 
  WIDTH, HEIGHT, CELL_SIZE, ROWS, COLS
} from '../components/config.js'

// работает - не трогай

const canvasContainer = ref(null);
let p5Instance = null;

// Настройки сетки




// Класс Еды


// Класс Муравья


// Класс Королевы






// Генератор карты
const generateMap = () => {
  grid.length = 0;
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
    let defenderAnts = [];
    

    p.setup = () => {
      p.createCanvas(WIDTH, HEIGHT).parent(canvasContainer.value);
      generateMap();
      for (let i = 0; i < antCount.value; i++) {
        ants.push(new Ant(p));
      }
      queen = new Queen(p);   // Создаём матку
      for (let i = 0; i < defenderAntCount.value; i++) {
        defenderAnts.push(new DefenderAnt(p)); 
      }
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
        queen.update(ants, defenderAnts);
        queen.display();
      }

      // Обновление и отрисовка муравьев
      for (let ant of ants) {
        ant.update();
        ant.display();
      }

      for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update();
        enemies[i].display();
        if (enemies[i].hp <= 0) {
          enemies.splice(i, 1); // Враг побежден — удаляем
        }
      }

      // Обновление и отрисовка защитников
      for (let dant of defenderAnts) {
        dant.update();
        dant.display();
      }
      
    };

    p.mousePressed = function() {
      let cellX = Math.floor(p.mouseX / CELL_SIZE);
      let cellY = Math.floor(p.mouseY / CELL_SIZE);

      // Проверяем, что кликнули внутри экрана и по ПУСТОЙ клетке (grid === 1)
      if (cellX >= 0 && cellX < COLS && cellY >= 0 && cellY < ROWS && cellY < ROWS*0.3) {
        if (grid[cellY][cellX] === 1) {
          enemies.push(new Enemy(p, p.mouseX, p.mouseY));
        }
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
input{
  margin-left: 10px;
}
.control-row{
  margin-bottom: 5px;
}
.title-style{
  margin-bottom: 20px;
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
  margin-left: 30px;
  margin-top: 15px;
  text-align: center;
  border: 4px solid #225a26;
  border-radius: 8px;
  background-color: #cae4cc;
  width: 40%;
  height: 300px;

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
  height: v-bind(HEIGHT + 'px');
  margin: 15px;
}
</style>
