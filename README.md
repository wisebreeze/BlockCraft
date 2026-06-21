<div align="center">

# BlockCraft

[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.md)
[![中文](https://img.shields.io/badge/lang-中文-red.svg)](README.zh-CN.md)

A simplified Minecraft-like voxel game built with Three.js and Vite.

![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Three.js](https://img.shields.io/badge/Three.js-0.167.0-lightgrey)
![Vite](https://img.shields.io/badge/Vite-5.4.0-yellow)

</div>

## 📖 Introduction

BlockCraft is a web-based implementation of simplified Minecraft gameplay. It's built entirely with JavaScript using Three.js for 3D rendering and Vite as the build tool. This project is created for educational purposes to demonstrate voxel rendering, procedural terrain generation, and basic game mechanics.

> **Note**: This is NOT an official Minecraft product. See [Disclaimer](#-disclaimer) for details.

## ✨ Features

- **3D Voxel Rendering** - Built with Three.js, featuring face culling optimization
- **Procedural Terrain Generation** - Multi-layer noise-based terrain with grass, dirt, stone, trees, and water
- **First Person Controller** - WASD movement, mouse look, jump, sneak, and sprint
- **Building System** - Break blocks with left click, place blocks with right click
- **Inventory System** - Collect blocks by breaking them, consume blocks when placing
- **Hotbar** - 9 slots with number keys 1-9 and mouse wheel switching
- **Flight Mode** - Press F to toggle free flight mode
- **Mobile Support** - Virtual joystick, touch look, and on-screen action buttons
- **Colored Grayscale Textures** - Dynamic color tinting for grayscale block textures
- **Bedrock** - Unbreakable bedrock layer at the bottom

## 🚀 Getting Started

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
# Start development server
npm run dev
```

The game will be available at `http://localhost:5173`

### Build

```bash
# Build for production
npm run build
```

The built files will be in the `dist` directory.

### Preview

```bash
# Preview production build
npm run preview
```

## 🎮 Controls

### Keyboard

| Key | Action |
|-----|--------|
| W | Move Forward |
| S | Move Backward |
| A | Move Left |
| D | Move Right |
| Space | Jump |
| Shift | Sneak |
| Ctrl | Sprint |
| F | Toggle Flight Mode |
| 1-9 | Select Hotbar Slot |
| Mouse Wheel | Switch Hotbar Slot |
| Left Click | Break Block |
| Right Click | Place Block |
| ESC | Release Mouse |

### Mobile

| Control | Action |
|---------|--------|
| Left Joystick | Move |
| Right Side Drag | Look Around |
| Jump Button | Jump |
| Sneak Button | Sneak |
| Fly Up Button | Fly Up (double tap to toggle flight) |
| Fly Down Button | Fly Down |
| Break Button | Break Block |
| Place Button | Place Block |

## 🛠️ Tech Stack

- **[Three.js](https://threejs.org/)** - 3D rendering engine
- **[Vite](https://vitejs.dev/)** - Next generation frontend tooling
- **JavaScript (ES6+)** - Core programming language
- **HTML5 Canvas** - 2D UI rendering

## 📁 Project Structure

```
BlockCraft/
├── public/
│   └── assets/
│       ├── blocks/          # Block textures
│       └── ui/              # UI textures (hotbar, joystick, buttons)
├── src/
│   ├── game/
│   │   ├── BlockTypes.js    # Block type definitions and materials
│   │   ├── World.js         # World management and terrain generation
│   │   ├── Player.js        # Player controls and physics
│   │   └── Game.js          # Main game loop
│   ├── main.js              # Entry point
│   └── style.css            # Styles
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🧱 Block Types

| ID | Name | Solid | Transparent |
|----|------|-------|-------------|
| 0 | Air | ❌ | ✅ |
| 1 | Grass | ✅ | ❌ |
| 2 | Dirt | ✅ | ❌ |
| 3 | Stone | ✅ | ❌ |
| 4 | Oak Log | ✅ | ❌ |
| 5 | Oak Leaves | ✅ | ✅ |
| 6 | Oak Planks | ✅ | ❌ |
| 7 | Water | ❌ | ✅ |
| 8 | Sand | ✅ | ❌ |
| 9 | Cobblestone | ✅ | ❌ |
| 10 | Bedrock | ✅ | ❌ |

> **Note**: Bedrock is unbreakable.

## ⚠️ Disclaimer

This is **NOT** an official Minecraft product. It is a simplified web-based implementation created for educational purposes.

All textures and assets used in this project are the property of Mojang Studios and Microsoft. This project is not affiliated with, endorsed by, or connected to Mojang Studios or Microsoft in any way.

## 📄 License

This project is for educational purposes only. All game textures are property of their respective owners.

The code in this project is provided as-is for learning purposes.
