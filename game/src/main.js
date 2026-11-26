// Boot Canyon Run: find the canvas, start the game loop.
import { CanyonGame } from './game.js';

const canvas = document.getElementById('game');
const game = new CanyonGame(canvas);
game.run();
