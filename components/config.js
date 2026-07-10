import { ref } from 'vue';

// Настройки сетки
export const COLS = 50;
export const ROWS = 40;
export const CELL_SIZE = 12;
export const WIDTH = COLS * CELL_SIZE;
export const HEIGHT = ROWS * CELL_SIZE;

// Массивы 
export let grid = [];
export let homePheromone = [];
export let foodPheromone = [];
export let foods = [];
export let enemies = [];

// Функции для изменения массивов
export function resetGrid(){
    grid = Array(ROWS).fill().map(() => Array(COLS).fill(0));
}
export function resetHomePheromone(){
    homePheromone = Array(ROWS).fill().map(() => Array(COLS).fill(0));
}
export function resetFoodPheromone(){
    foodPheromone = Array(ROWS).fill().map(() => Array(COLS).fill(0));
}