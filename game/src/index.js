import { DataLoader } from './core/DataLoader.js';
import { gameServices, initGameServices } from './core/GameServices.js';
import { GameInitializer } from './core/GameInitializer.js';
import { GameLoop } from './core/GameLoop.js';
import { StartScreen } from './core/StartScreen.js';

const dataLoader = new DataLoader();
const { GameConfig, data } = await dataLoader.load();

initGameServices(GameConfig, data);

if (!GameConfig.debug.joinDevRoom) {
  const startScreen = new StartScreen();
  await startScreen.show();
}

const initializer = new GameInitializer();
initializer.initialize();

// Set cursor color based on user's loginOrder
gameServices.cursorSystem.showCursor();

const gameLoop = new GameLoop();
gameLoop.start();
