import { WIDTH, HEIGHT } from './config.js';
import { antCount, changeBirthDefAnt, defenderAntCount } from './settings.js';
import { Ant } from './Ant.js';
import { DefenderAnt } from './DefenderAnt.js';

export class Queen {
  constructor(p) {
    this.p = p;
    // Размещаем матку точно в центре стартовой камеры (дома)
    this.x = WIDTH / 2;
    this.y = HEIGHT * 0.6;
    this.size = 14;          // Матка заметно крупнее обычного муравья
    this.spawnCooldown = 180; // Спавн каждые 180 кадров (примерно 3 секунды при 60 FPS)
    this.timer = 0;
  }

  update(antsArray, defAntsArray) {
    this.timer++;

    // Проверяем кулдаун
    if (this.timer >= this.spawnCooldown) {
      this.timer = 0;
      
      // Создаем нового муравья и передаем в массив симуляции
      // Передаем контекст p5 (this.p)
      if (this.p.random(1) < changeBirthDefAnt.value){
        defAntsArray.push(new DefenderAnt(this.p));
        defenderAntCount.value = defAntsArray.length;
      }
      else{
        antsArray.push(new Ant(this.p)); 
        antCount.value = antsArray.length;
      }
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
