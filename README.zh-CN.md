<div align="center">

# BlockCraft

[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.md)
[![中文](https://img.shields.io/badge/lang-中文-red.svg)](README.zh-CN.md)

一个基于 Three.js 和 Vite 构建的简化版 Minecraft 体素游戏。

![License](https://img.shields.io/badge/license-AGPL--3.0-blue)
![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Three.js](https://img.shields.io/badge/Three.js-0.167.0-lightgrey)
![Vite](https://img.shields.io/badge/Vite-5.4.0-yellow)

</div>

## 📖 项目简介

BlockCraft 是一个基于 Web 的简化版 Minecraft 游戏实现。项目完全使用 JavaScript 构建，采用 Three.js 进行 3D 渲染，Vite 作为构建工具。本项目出于教育目的创建，用于展示体素渲染、程序化地形生成和基础游戏机制。

> **注意**：这不是官方 Minecraft 产品。详见 [免责声明](#️-免责声明)。

## ✨ 功能特性

- **3D 体素渲染** - 基于 Three.js 构建，支持面剔除优化
- **程序化地形生成** - 多层噪声地形，包含草地、泥土、石头、树木和水域
- **第一人称控制器** - WASD 移动、鼠标视角、跳跃、潜行、疾跑
- **建造系统** - 左键破坏方块，右键放置方块
- **物品栏系统** - 破坏方块获得，放置方块消耗
- **快捷栏** - 9 个槽位，支持数字键 1-9 和鼠标滚轮切换
- **飞行模式** - 按 F 键切换自由飞行模式
- **移动端支持** - 虚拟摇杆、触控视角、屏幕操作按钮
- **灰度图着色** - 支持给灰度纹理动态着色
- **基岩** - 底部不可破坏的基岩层

## 🚀 快速开始

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
# 启动开发服务器
npm run dev
```

游戏将在 `http://localhost:5173` 运行

### 生产构建

```bash
# 构建生产版本
npm run build
```

构建产物将输出到 `dist` 目录。

### 预览构建

```bash
# 预览生产构建
npm run preview
```

## 🎮 操作说明

### 键盘操作

| 按键 | 功能 |
|------|------|
| W | 前进 |
| S | 后退 |
| A | 左移 |
| D | 右移 |
| Space | 跳跃 |
| Shift | 潜行 |
| Ctrl | 疾跑 |
| F | 切换飞行模式 |
| 1-9 | 选择快捷栏槽位 |
| 鼠标滚轮 | 切换快捷栏 |
| 左键 | 破坏方块 |
| 右键 | 放置方块 |
| ESC | 释放鼠标 |

### 移动端操作

| 控件 | 功能 |
|------|------|
| 左侧摇杆 | 移动 |
| 右侧滑动 | 视角控制 |
| 跳跃按钮 | 跳跃 |
| 潜行按钮 | 潜行 |
| 飞行上升按钮 | 飞行上升（双击切换飞行） |
| 飞行下降按钮 | 飞行下降 |
| 破坏按钮 | 破坏方块 |
| 放置按钮 | 放置方块 |

## 🛠️ 技术栈

- **[Three.js](https://threejs.org/)** - 3D 渲染引擎
- **[Vite](https://vitejs.dev/)** - 下一代前端构建工具
- **JavaScript (ES6+)** - 核心编程语言
- **HTML5 Canvas** - 2D UI 渲染

## 📁 项目结构

```
BlockCraft/
├── public/
│   └── assets/
│       ├── blocks/          # 方块贴图
│       └── ui/              # UI 贴图（快捷栏、摇杆、按钮）
├── src/
│   ├── game/
│   │   ├── BlockTypes.js    # 方块类型定义与材质
│   │   ├── World.js         # 世界管理与地形生成
│   │   ├── Player.js        # 玩家控制与物理
│   │   └── Game.js          # 游戏主循环
│   ├── main.js              # 入口文件
│   └── style.css            # 样式
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🧱 方块类型

| ID | 名称 | 实体 | 透明 |
|----|------|------|------|
| 0 | 空气 | ❌ | ✅ |
| 1 | 草方块 | ✅ | ❌ |
| 2 | 泥土 | ✅ | ❌ |
| 3 | 石头 | ✅ | ❌ |
| 4 | 橡木原木 | ✅ | ❌ |
| 5 | 橡树叶 | ✅ | ✅ |
| 6 | 橡木木板 | ✅ | ❌ |
| 7 | 水 | ❌ | ✅ |
| 8 | 沙子 | ✅ | ❌ |
| 9 | 圆石 | ✅ | ❌ |
| 10 | 基岩 | ✅ | ❌ |

> **注意**：基岩不可破坏。

## ⚠️ 免责声明

本项目 **不是** 官方 Minecraft 产品。这是一个出于教育目的创建的简化 Web 实现。

本项目中使用的所有纹理和资源均为 Mojang Studios 和 Microsoft 的财产。本项目与 Mojang Studios 或 Microsoft 没有任何关联、认可或联系。

## 📄 许可证

本项目采用 **GNU Affero General Public License v3.0 (AGPL-3.0)** 许可证 - 详见 [LICENSE](LICENSE) 文件。

> **重要说明**：本项目中使用的所有游戏贴图和资源均为 Mojang Studios 和 Microsoft 的财产，**不**受 AGPL-3.0 许可证保护。本项目仅用于教育目的。
