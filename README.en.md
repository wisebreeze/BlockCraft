# BlockCraft

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Three.js](https://img.shields.io/badge/Three.js-0.167-blue)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF)](https://vitejs.dev/)

A simplified Minecraft implementation for the web

English | [简体中文](README.md)

</div>

## About

BlockCraft is a simplified web-based Minecraft implementation built with Three.js and Vite. This project demonstrates how to create 3D voxel games using modern web technologies, with support for both desktop and mobile platforms.

> ⚠️ **Notice**: This is NOT an official Minecraft product. This project is for educational purposes only.

## Features

### 🎮 Gameplay
- **First-person view** - Immersive 3D experience
- **Block building & breaking** - Left click to break, right click to place
- **Procedural terrain generation** - Noise-based random terrain
- **Inventory system** - Gain blocks by breaking, consume by placing
- **Multiple block types** - Grass, dirt, stone, wood, leaves, planks, water, sand, cobblestone, bedrock

### 🕹️ Controls
- **Keyboard & mouse** - WASD movement, mouse look, space to jump
- **Mobile touch** - Virtual joystick for movement, touch look, action buttons
- **Flight mode** - Toggle with F key, free flight
- **Sprint & sneak** - Shift to sneak, Ctrl to sprint

### 🎨 Visuals
- **Voxel rendering** - Face culling for performance optimization
- **Skybox & fog** - Atmospheric effects
- **Block highlighting** - Highlight block under crosshair
- **Grayscale coloring** - Dynamic color tinting for grayscale textures

### 📱 Cross-platform
- **Desktop** - Full keyboard and mouse support
- **Mobile** - Virtual joystick + touch controls
- **Responsive** - Adapts to different screen sizes

## Getting Started

### Prerequisites
- Node.js >= 16.0.0
- npm >= 7.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/wisebreeze/BlockCraft.git

# Navigate to project directory
cd BlockCraft

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Build

```bash
npm run build
```

The build output will be in the `dist` directory.

### Preview Build

```bash
npm run preview
```

## Controls

### Desktop

| Action | Key |
|--------|-----|
| Move Forward | W |
| Move Backward | S |
| Move Left | A |
| Move Right | D |
| Jump | Space |
| Sneak | Shift |
| Sprint | Ctrl |
| Flight Mode | F |
| Break Block | Left Mouse Button |
| Place Block | Right Mouse Button |
| Switch Block | Number Keys 1-9 / Mouse Wheel |
| Release Mouse | Esc |

### Mobile

| Action | Method |
|--------|--------|
| Movement | Left virtual joystick |
| Look | Right side screen swipe |
| Jump | Jump button |
| Sneak | Sneak button |
| Fly Up | Fly up button (double tap to toggle flight) |
| Fly Down | Fly down button |
| Break Block | Break button |
| Place Block | Place button |
| Switch Block | Tap hotbar |

## Tech Stack

- **Rendering Engine** - [Three.js](https://threejs.org/)
- **Build Tool** - [Vite](https://vitejs.dev/)
- **Language** - JavaScript (ES6+)
- **Styling** - CSS3

## Project Structure

```
BlockCraft/
├── public/
│   └── assets/              # Static assets
│       ├── blocks/          # Block textures
│       └── ui/              # UI textures
├── src/
│   ├── game/
│   │   ├── BlockTypes.js    # Block type definitions
│   │   ├── World.js         # World management & terrain generation
│   │   ├── Player.js        # Player control & physics
│   │   └── Game.js          # Game main loop
│   ├── main.js              # Entry point
│   └── style.css            # Styles
├── index.html               # HTML template
├── package.json
├── vite.config.js
└── README.md
```

## Block List

| ID | Name | Properties |
|----|------|------------|
| 0 | Air | Non-solid |
| 1 | Grass | Solid |
| 2 | Dirt | Solid |
| 3 | Stone | Solid |
| 4 | Oak Log | Solid |
| 5 | Oak Leaves | Solid, Transparent |
| 6 | Oak Planks | Solid |
| 7 | Water | Non-solid, Transparent |
| 8 | Sand | Solid |
| 9 | Cobblestone | Solid |
| 10 | Bedrock | Solid, Unbreakable |

## Disclaimer

This project is **NOT** an official Minecraft product. It is a simplified web-based implementation created for educational purposes.

All textures and assets used in this project are the property of Mojang Studios and Microsoft. This project is not affiliated with, endorsed by, or connected to Mojang Studios or Microsoft in any way.

## License

[MIT License](LICENSE)
