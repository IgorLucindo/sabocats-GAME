import { DataLoader } from './core/DataLoader.js';
import { initGameServices } from './core/GameServices.js';
import { GameInitializer } from './core/GameInitializer.js';
import { GameLoop } from './core/GameLoop.js';

const dataLoader = new DataLoader();
const { GameConfig, data } = await dataLoader.load();

initGameServices(GameConfig, data);

const initializer = new GameInitializer();
initializer.initialize();

const gameLoop = new GameLoop();
gameLoop.start();
