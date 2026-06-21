import './style.css'
import { Game } from './game/Game.js'

const canvas = document.getElementById('game-canvas')
const game = new Game(canvas)

// Expose game for debugging
window.game = game
