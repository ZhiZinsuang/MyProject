// Класс Еды
export class Food {
  constructor(x, y, amount = 100) {
    this.x = x;
    this.y = y;
    this.amount = amount;
    this.radius = 15;
  }
}