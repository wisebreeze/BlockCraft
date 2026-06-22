import * as THREE from 'three'
import { TGALoader } from 'three/addons/loaders/TGALoader.js'

const textureLoader = new THREE.TextureLoader()
const tgaLoader = new TGALoader()

function loadTexture(path) {
  const loader = path.endsWith('.tga') ? tgaLoader : textureLoader
  const texture = loader.load(path)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  texture.generateMipmaps = false
  return texture
}

// ============================================
// Block Type Definitions
// ============================================
export const BlockTypes = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD: 4,
  LEAVES: 5,
  PLANKS: 6,
  WATER: 7,
  SAND: 8,
  COBBLESTONE: 9,
  BEDROCK: 10,
  CRAFTING_TABLE: 11,
  FURNACE: 12,
  COAL_ORE: 13,
  IRON_ORE: 14,
  GOLD_ORE: 15,
  LAPIS_ORE: 16,
  DIAMOND_ORE: 17,
  EMERALD_ORE: 18,
  REDSTONE_ORE: 19
}

// ============================================
// Item Type Definitions (items start at 100)
// ============================================
export const ItemTypes = {
  // Block items (same ID as block)
  GRASS_BLOCK: 1,
  DIRT: 2,
  STONE: 3,
  WOOD: 4,
  LEAVES: 5,
  PLANKS: 6,
  SAND: 8,
  COBBLESTONE: 9,
  CRAFTING_TABLE: 11,
  FURNACE: 12,

  // Pure items (non-placeable)
  COAL: 100,
  IRON_INGOT: 101,
  GOLD_INGOT: 102,
  DIAMOND: 103,
  EMERALD: 104,
  LAPIS_LAZULI: 105,
  REDSTONE: 106,
  STICK: 107,
  APPLE: 108
}

// Check if an item is a block (can be placed)
export function isBlockItem(itemType) {
  return itemType < 100 && itemType !== 0 && BlockData[itemType]?.solid
}

// Get block type from item type (for placing)
export function getItemBlockType(itemType) {
  if (isBlockItem(itemType)) {
    return itemType
  }
  return null
}

// ============================================
// Block Properties
// ============================================
export const BlockData = {
  [BlockTypes.AIR]: {
    name: 'Air',
    solid: false,
    transparent: true
  },
  [BlockTypes.GRASS]: {
    name: 'Grass Block',
    solid: true,
    transparent: false,
    textures: {
      top: loadTexture('/assets/blocks/grass_top.png'),
      bottom: loadTexture('/assets/blocks/dirt.png'),
      side: loadTexture('/assets/blocks/grass_side_carried.png')
    },
    colors: {
      top: 0x55aa55,
      bottom: 0xffffff,
      side: 0xffffff
    }
  },
  [BlockTypes.DIRT]: {
    name: 'Dirt',
    solid: true,
    transparent: false,
    textures: {
      top: loadTexture('/assets/blocks/dirt.png'),
      bottom: loadTexture('/assets/blocks/dirt.png'),
      side: loadTexture('/assets/blocks/dirt.png')
    }
  },
  [BlockTypes.STONE]: {
    name: 'Stone',
    solid: true,
    transparent: false,
    textures: {
      top: loadTexture('/assets/blocks/stone.png'),
      bottom: loadTexture('/assets/blocks/stone.png'),
      side: loadTexture('/assets/blocks/stone.png')
    }
  },
  [BlockTypes.BEDROCK]: {
    name: 'Bedrock',
    solid: true,
    transparent: false,
    unbreakable: true,
    textures: {
      top: loadTexture('/assets/blocks/bedrock.png'),
      bottom: loadTexture('/assets/blocks/bedrock.png'),
      side: loadTexture('/assets/blocks/bedrock.png')
    }
  },
  [BlockTypes.WOOD]: {
    name: 'Oak Log',
    solid: true,
    transparent: false,
    textures: {
      top: loadTexture('/assets/blocks/log_oak_top.png'),
      bottom: loadTexture('/assets/blocks/log_oak_top.png'),
      side: loadTexture('/assets/blocks/log_oak.png')
    }
  },
  [BlockTypes.LEAVES]: {
    name: 'Oak Leaves',
    solid: true,
    transparent: true,
    opacity: 0.85,
    textures: {
      top: loadTexture('/assets/blocks/leaves_oak_carried.tga'),
      bottom: loadTexture('/assets/blocks/leaves_oak_carried.tga'),
      side: loadTexture('/assets/blocks/leaves_oak_carried.tga')
    },
    colors: {
      top: 0x33aa33,
      bottom: 0x33aa33,
      side: 0x33aa33
    }
  },
  [BlockTypes.PLANKS]: {
    name: 'Oak Planks',
    solid: true,
    transparent: false,
    textures: {
      top: loadTexture('/assets/blocks/planks_oak.png'),
      bottom: loadTexture('/assets/blocks/planks_oak.png'),
      side: loadTexture('/assets/blocks/planks_oak.png')
    }
  },
  [BlockTypes.WATER]: {
    name: 'Water',
    solid: false,
    transparent: true,
    opacity: 0.6,
    textures: {
      top: loadTexture('/assets/blocks/water_still.png'),
      bottom: loadTexture('/assets/blocks/water_still.png'),
      side: loadTexture('/assets/blocks/water_flow.png')
    },
    colors: {
      top: 0x3366cc,
      bottom: 0x3366cc,
      side: 0x3366cc
    }
  },
  [BlockTypes.SAND]: {
    name: 'Sand',
    solid: true,
    transparent: false,
    textures: {
      top: loadTexture('/assets/blocks/sand.png'),
      bottom: loadTexture('/assets/blocks/sand.png'),
      side: loadTexture('/assets/blocks/sand.png')
    }
  },
  [BlockTypes.COBBLESTONE]: {
    name: 'Cobblestone',
    solid: true,
    transparent: false,
    textures: {
      top: loadTexture('/assets/blocks/cobblestone.png'),
      bottom: loadTexture('/assets/blocks/cobblestone.png'),
      side: loadTexture('/assets/blocks/cobblestone.png')
    }
  },
  [BlockTypes.CRAFTING_TABLE]: {
    name: 'Crafting Table',
    solid: true,
    transparent: false,
    interactive: true,
    textures: {
      top: loadTexture('/assets/blocks/crafting_table_top.png'),
      bottom: loadTexture('/assets/blocks/planks_oak.png'),
      side: loadTexture('/assets/blocks/crafting_table_side.png'),
      front: loadTexture('/assets/blocks/crafting_table_front.png')
    }
  },
  [BlockTypes.FURNACE]: {
    name: 'Furnace',
    solid: true,
    transparent: false,
    interactive: true,
    textures: {
      top: loadTexture('/assets/blocks/furnace_top.png'),
      bottom: loadTexture('/assets/blocks/furnace_top.png'),
      side: loadTexture('/assets/blocks/furnace_side.png'),
      front: loadTexture('/assets/blocks/furnace_front_off.png')
    }
  },
  [BlockTypes.COAL_ORE]: {
    name: 'Coal Ore',
    solid: true,
    transparent: false,
    textures: {
      top: loadTexture('/assets/blocks/coal_ore.png'),
      bottom: loadTexture('/assets/blocks/coal_ore.png'),
      side: loadTexture('/assets/blocks/coal_ore.png')
    }
  },
  [BlockTypes.IRON_ORE]: {
    name: 'Iron Ore',
    solid: true,
    transparent: false,
    textures: {
      top: loadTexture('/assets/blocks/iron_ore.png'),
      bottom: loadTexture('/assets/blocks/iron_ore.png'),
      side: loadTexture('/assets/blocks/iron_ore.png')
    }
  },
  [BlockTypes.GOLD_ORE]: {
    name: 'Gold Ore',
    solid: true,
    transparent: false,
    textures: {
      top: loadTexture('/assets/blocks/gold_ore.png'),
      bottom: loadTexture('/assets/blocks/gold_ore.png'),
      side: loadTexture('/assets/blocks/gold_ore.png')
    }
  },
  [BlockTypes.LAPIS_ORE]: {
    name: 'Lapis Lazuli Ore',
    solid: true,
    transparent: false,
    textures: {
      top: loadTexture('/assets/blocks/lapis_ore.png'),
      bottom: loadTexture('/assets/blocks/lapis_ore.png'),
      side: loadTexture('/assets/blocks/lapis_ore.png')
    }
  },
  [BlockTypes.DIAMOND_ORE]: {
    name: 'Diamond Ore',
    solid: true,
    transparent: false,
    textures: {
      top: loadTexture('/assets/blocks/diamond_ore.png'),
      bottom: loadTexture('/assets/blocks/diamond_ore.png'),
      side: loadTexture('/assets/blocks/diamond_ore.png')
    }
  },
  [BlockTypes.EMERALD_ORE]: {
    name: 'Emerald Ore',
    solid: true,
    transparent: false,
    textures: {
      top: loadTexture('/assets/blocks/emerald_ore.png'),
      bottom: loadTexture('/assets/blocks/emerald_ore.png'),
      side: loadTexture('/assets/blocks/emerald_ore.png')
    }
  },
  [BlockTypes.REDSTONE_ORE]: {
    name: 'Redstone Ore',
    solid: true,
    transparent: false,
    textures: {
      top: loadTexture('/assets/blocks/redstone_ore.png'),
      bottom: loadTexture('/assets/blocks/redstone_ore.png'),
      side: loadTexture('/assets/blocks/redstone_ore.png')
    }
  }
}

// ============================================
// Item Properties
// ============================================
export const ItemData = {
  // Block items inherit from BlockData
  // Pure items:
  [ItemTypes.COAL]: {
    name: 'Coal',
    maxStack: 64,
    fuelValue: 80 // seconds of burn time
  },
  [ItemTypes.IRON_INGOT]: {
    name: 'Iron Ingot',
    maxStack: 64
  },
  [ItemTypes.GOLD_INGOT]: {
    name: 'Gold Ingot',
    maxStack: 64
  },
  [ItemTypes.DIAMOND]: {
    name: 'Diamond',
    maxStack: 64
  },
  [ItemTypes.EMERALD]: {
    name: 'Emerald',
    maxStack: 64
  },
  [ItemTypes.LAPIS_LAZULI]: {
    name: 'Lapis Lazuli',
    maxStack: 64
  },
  [ItemTypes.REDSTONE]: {
    name: 'Redstone',
    maxStack: 64
  },
  [ItemTypes.STICK]: {
    name: 'Stick',
    maxStack: 64,
    fuelValue: 5
  },
  [ItemTypes.APPLE]: {
    name: 'Apple',
    maxStack: 64
  }
}

// Get item name (works for both block items and pure items)
export function getItemName(itemType) {
  if (itemType < 100) {
    return BlockData[itemType]?.name || 'Unknown'
  }
  return ItemData[itemType]?.name || 'Unknown'
}

// Get max stack size for an item
export function getMaxStackSize(itemType) {
  if (itemType < 100) {
    return 64 // All blocks stack to 64
  }
  return ItemData[itemType]?.maxStack || 64
}

// Get fuel value (0 if not a fuel)
export function getFuelValue(itemType) {
  if (itemType < 100) {
    // Wood items are fuel
    if (itemType === BlockTypes.WOOD) return 15
    if (itemType === BlockTypes.PLANKS) return 15
    return 0
  }
  return ItemData[itemType]?.fuelValue || 0
}

// ============================================
// Material Creation
// ============================================
export function getBlockMaterial(blockType, face) {
  const data = BlockData[blockType]
  if (!data || !data.textures) return null

  const texture = data.textures[face] || data.textures.side
  const color = data.colors ? (data.colors[face] || data.colors.side || 0xffffff) : 0xffffff

  const material = new THREE.MeshLambertMaterial({
    map: texture,
    color: color,
    transparent: data.transparent || false,
    opacity: data.opacity || 1.0,
    side: THREE.FrontSide
  })
  return material
}

export function createBlockMaterials(blockType) {
  return [
    getBlockMaterial(blockType, 'side'),   // right (+x)
    getBlockMaterial(blockType, 'side'),   // left (-x)
    getBlockMaterial(blockType, 'top'),    // top (+y)
    getBlockMaterial(blockType, 'bottom'), // bottom (-y)
    getBlockMaterial(blockType, 'side'),   // front (+z)
    getBlockMaterial(blockType, 'side')    // back (-z)
  ]
}

// ============================================
// Display Textures for UI
// ============================================
const DisplayTextures = {
  // Block items
  [BlockTypes.GRASS]: { path: '/assets/blocks/grass_top.png', color: 0x55aa55 },
  [BlockTypes.DIRT]: { path: '/assets/blocks/dirt.png', color: 0xffffff },
  [BlockTypes.STONE]: { path: '/assets/blocks/stone.png', color: 0xffffff },
  [BlockTypes.WOOD]: { path: '/assets/blocks/log_oak_top.png', color: 0xffffff },
  [BlockTypes.LEAVES]: { path: '/assets/blocks/leaves_oak_carried.tga', color: 0x33aa33 },
  [BlockTypes.PLANKS]: { path: '/assets/blocks/planks_oak.png', color: 0xffffff },
  [BlockTypes.SAND]: { path: '/assets/blocks/sand.png', color: 0xffffff },
  [BlockTypes.COBBLESTONE]: { path: '/assets/blocks/cobblestone.png', color: 0xffffff },
  [BlockTypes.BEDROCK]: { path: '/assets/blocks/bedrock.png', color: 0xffffff },
  [BlockTypes.CRAFTING_TABLE]: { path: '/assets/blocks/crafting_table_top.png', color: 0xffffff },
  [BlockTypes.FURNACE]: { path: '/assets/blocks/furnace_front_off.png', color: 0xffffff },
  [BlockTypes.COAL_ORE]: { path: '/assets/blocks/coal_ore.png', color: 0xffffff },
  [BlockTypes.IRON_ORE]: { path: '/assets/blocks/iron_ore.png', color: 0xffffff },
  [BlockTypes.GOLD_ORE]: { path: '/assets/blocks/gold_ore.png', color: 0xffffff },
  [BlockTypes.LAPIS_ORE]: { path: '/assets/blocks/lapis_ore.png', color: 0xffffff },
  [BlockTypes.DIAMOND_ORE]: { path: '/assets/blocks/diamond_ore.png', color: 0xffffff },
  [BlockTypes.EMERALD_ORE]: { path: '/assets/blocks/emerald_ore.png', color: 0xffffff },
  [BlockTypes.REDSTONE_ORE]: { path: '/assets/blocks/redstone_ore.png', color: 0xffffff },

  // Pure items
  [ItemTypes.COAL]: { path: '/assets/items/coal.png', color: 0xffffff },
  [ItemTypes.IRON_INGOT]: { path: '/assets/items/iron_ingot.png', color: 0xffffff },
  [ItemTypes.GOLD_INGOT]: { path: '/assets/items/gold_ingot.png', color: 0xffffff },
  [ItemTypes.DIAMOND]: { path: '/assets/items/diamond.png', color: 0xffffff },
  [ItemTypes.EMERALD]: { path: '/assets/items/emerald.png', color: 0xffffff },
  [ItemTypes.LAPIS_LAZULI]: { path: '/assets/items/dye_powder_blue.png', color: 0xffffff },
  [ItemTypes.REDSTONE]: { path: '/assets/items/redstone_dust.png', color: 0xffffff },
  [ItemTypes.STICK]: { path: '/assets/items/stick.png', color: 0xffffff },
  [ItemTypes.APPLE]: { path: '/assets/items/apple.png', color: 0xffffff }
}

// Cache for processed display images
const displayImageCache = new Map()

// Get item display image URL (supports TGA and color tinting)
export function getItemDisplayImageURL(itemType) {
  if (displayImageCache.has(itemType)) {
    return displayImageCache.get(itemType)
  }

  const promise = new Promise((resolve) => {
    const displayInfo = DisplayTextures[itemType]
    if (!displayInfo) {
      resolve(null)
      return
    }

    const texturePath = displayInfo.path
    const colorHex = displayInfo.color

    // Parse color
    const r = (colorHex >> 16) & 0xff
    const g = (colorHex >> 8) & 0xff
    const b = colorHex & 0xff

    // If no tint needed and not TGA, just return the path directly
    if (colorHex === 0xffffff && !texturePath.endsWith('.tga')) {
      resolve(texturePath)
      return
    }

    if (texturePath.endsWith('.tga')) {
      // TGA texture - use TGALoader
      tgaLoader.load(texturePath, (texture) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = texture.image.width
        canvas.height = texture.image.height

        const imageData = ctx.createImageData(canvas.width, canvas.height)
        const pixels = texture.image.data

        for (let i = 0; i < pixels.length; i += 4) {
          imageData.data[i] = (pixels[i] * r) / 255
          imageData.data[i + 1] = (pixels[i + 1] * g) / 255
          imageData.data[i + 2] = (pixels[i + 2] * b) / 255
          imageData.data[i + 3] = pixels[i + 3]
        }

        ctx.putImageData(imageData, 0, 0)
        resolve(canvas.toDataURL())
      }, undefined, () => {
        resolve(null)
      })
    } else {
      // PNG texture - use Image
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = img.width
        canvas.height = img.height

        ctx.drawImage(img, 0, 0)

        // Apply color tint if not white
        if (colorHex !== 0xffffff) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const pixels = imageData.data

          for (let i = 0; i < pixels.length; i += 4) {
            pixels[i] = (pixels[i] * r) / 255
            pixels[i + 1] = (pixels[i + 1] * g) / 255
            pixels[i + 2] = (pixels[i + 2] * b) / 255
          }

          ctx.putImageData(imageData, 0, 0)
        }

        resolve(canvas.toDataURL())
      }
      img.onerror = () => {
        resolve(null)
      }
      img.src = texturePath
    }
  })

  displayImageCache.set(itemType, promise)
  return promise
}

// Backward compatibility alias
export const getBlockDisplayImageURL = getItemDisplayImageURL

// Get block display color for UI fallback
export function getBlockDisplayColor(blockType) {
  const data = BlockData[blockType]
  if (!data) return '#888'

  if (data.colors) {
    const colorHex = data.colors.top || data.colors.side || 0xffffff
    return '#' + colorHex.toString(16).padStart(6, '0')
  }

  switch (blockType) {
    case BlockTypes.GRASS: return '#55aa55'
    case BlockTypes.DIRT: return '#8b5a2b'
    case BlockTypes.STONE: return '#888888'
    case BlockTypes.WOOD: return '#8b6914'
    case BlockTypes.LEAVES: return '#33aa33'
    case BlockTypes.PLANKS: return '#c4a35a'
    case BlockTypes.WATER: return '#3366cc'
    case BlockTypes.SAND: return '#e8d48a'
    case BlockTypes.COBBLESTONE: return '#777777'
    case BlockTypes.BEDROCK: return '#333333'
    case BlockTypes.COAL_ORE: return '#333333'
    case BlockTypes.IRON_ORE: return '#d4a574'
    case BlockTypes.GOLD_ORE: return '#ffd700'
    case BlockTypes.LAPIS_ORE: return '#1a4fc9'
    case BlockTypes.DIAMOND_ORE: return '#40e0d0'
    case BlockTypes.EMERALD_ORE: return '#50c878'
    default: return '#888888'
  }
}

// Hotbar block selection - empty by default (kept for backward compatibility)
export const HotbarBlocks = [
  null, null, null, null, null, null, null, null, null
]
