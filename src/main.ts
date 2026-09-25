import './ui/base.css';
import { createGame } from './game/config';

const game = createGame('game-root');

if (import.meta.env.DEV) {
  (window as unknown as { __game: unknown }).__game = game;
}
