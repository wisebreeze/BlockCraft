import React from 'react'
import ReactDOM from 'react-dom/client'
import { Game } from './game/Game.js'
import App from './App.jsx'

// Initialize game with canvas from HTML
const canvas = document.getElementById('game-canvas')
const game = new Game(canvas)

// Mount React UI
const uiRoot = document.getElementById('ui-root')
if (uiRoot) {
  ReactDOM.createRoot(uiRoot).render(
    <App game={game} />
  )
}
