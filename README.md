# BlockCraft

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Three.js](https://img.shields.io/badge/Three.js-0.167-blue)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF)](https://vitejs.dev/)

一个基于 Web 的简化版 Minecraft 实现

[English](README.en.md) | 简体中文

</div>

## 项目简介

BlockCraft 是一个使用 Three.js 和 Vite 构建的网页版 Minecraft 简化实现。项目旨在展示如何使用现代 Web 技术创建 3D 体素游戏，支持桌面端和移动端。

> ⚠️ **注意**：这不是官方 Minecraft 产品。本项目仅用于教育目的。

## 功能特性

### 🎮 游戏玩法
- **第一人称视角** - 沉浸式 3D 体验
- **方块建造与破坏** - 左键破坏，右键放置
- **程序化地形生成** - 基于噪声的随机地形
- **物品栏系统** - 破坏方块获得，放置方块消耗
- **多种方块类型** - 草方块、泥土、石头、木头、树叶、木板、水、沙子、圆石、基岩

### 🕹️ 操作控制
- **键盘鼠标** - WASD 移动，鼠标视角，空格跳跃
- **移动端触控** - 虚拟摇杆移动，触控视角，动作按钮
- **飞行模式** - F 键切换，自由飞行
- **疾跑与潜行** - Shift 潜行，Ctrl 疾跑

### 🎨 视觉效果
- **体素渲染** - 面剔除优化性能
- **天空盒与雾效** - 营造氛围
- **方块高亮** - 准星指向的方块高亮显示
- **灰度图着色** - 支持给灰度纹理动态着色

### 📱 跨平台支持
- **桌面端** - 完整的键盘鼠标支持
- **移动端** - 虚拟摇杆 + 触控操作
- **响应式** - 自适应不同屏幕尺寸

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装

```bash
# 克隆仓库
git clone https://github.com/wisebreeze/BlockCraft.git

# 进入项目目录
cd BlockCraft

# 安装依赖
npm install
```

### 开发模式

```bash
npm run dev
```

启动后在浏览器中打开 `http://localhost:5173`

### 生产构建

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

### 预览构建

```bash
npm run preview
```

## 操作说明

### 桌面端

| 操作 | 按键 |
|------|------|
| 前进 | W |
| 后退 | S |
| 左移 | A |
| 右移 | D |
| 跳跃 | Space |
| 潜行 | Shift |
| 疾跑 | Ctrl |
| 飞行模式 | F |
| 破坏方块 | 鼠标左键 |
| 放置方块 | 鼠标右键 |
| 切换方块 | 数字键 1-9 / 鼠标滚轮 |
| 释放鼠标 | Esc |

### 移动端

| 操作 | 方式 |
|------|------|
| 移动 | 左侧虚拟摇杆 |
| 视角 | 右侧屏幕滑动 |
| 跳跃 | 跳跃按钮 |
| 潜行 | 潜行按钮 |
| 飞行上升 | 飞行上升按钮（双击切换飞行） |
| 飞行下降 | 飞行下降按钮 |
| 破坏方块 | 破坏按钮 |
| 放置方块 | 放置按钮 |
| 切换方块 | 点击快捷栏 |

## 技术栈

- **渲染引擎** - [Three.js](https://threejs.org/)
- **构建工具** - [Vite](https://vitejs.dev/)
- **语言** - JavaScript (ES6+)
- **样式** - CSS3

## 项目结构

```
BlockCraft/
├── public/
│   └── assets/              # 静态资源
│       ├── blocks/          # 方块贴图
│       └── ui/              # UI 贴图
├── src/
│   ├── game/
│   │   ├── BlockTypes.js    # 方块类型定义
│   │   ├── World.js         # 世界管理与地形生成
│   │   ├── Player.js        # 玩家控制与物理
│   │   └── Game.js          # 游戏主循环
│   ├── main.js              # 入口文件
│   └── style.css            # 样式
├── index.html               # HTML 模板
├── package.json
├── vite.config.js
└── README.md
```

## 方块列表

| ID | 名称 | 特性 |
|----|------|------|
| 0 | 空气 (Air) | 非实体 |
| 1 | 草方块 (Grass) | 实体 |
| 2 | 泥土 (Dirt) | 实体 |
| 3 | 石头 (Stone) | 实体 |
| 4 | 橡木原木 (Wood) | 实体 |
| 5 | 橡树叶 (Leaves) | 实体、透明 |
| 6 | 橡木木板 (Planks) | 实体 |
| 7 | 水 (Water) | 非实体、透明 |
| 8 | 沙子 (Sand) | 实体 |
| 9 | 圆石 (Cobblestone) | 实体 |
| 10 | 基岩 (Bedrock) | 实体、不可破坏 |

## 免责声明

本项目 **不是** 官方 Minecraft 产品。这是一个出于教育目的创建的简化 Web 实现。

本项目中使用的所有纹理和资源均为 Mojang Studios 和 Microsoft 的财产。本项目与 Mojang Studios 或 Microsoft 没有任何关联、认可或联系。

## 许可证

[MIT License](LICENSE)
