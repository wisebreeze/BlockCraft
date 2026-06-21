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
  return texture
}

// Block type definitions
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
  BEDROCK: 10
}

// Block properties
export const BlockData = {
  [BlockTypes.AIR]: {
    name: 'Air',
    solid: false,
    transparent: true
  },
  [BlockTypes.GRASS]: {
    name: 'Grass',
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
    name: 'Wood',
    solid: true,
    transparent: false,
    textures: {
      top: loadTexture('/assets/blocks/log_oak_top.png'),
      bottom: loadTexture('/assets/blocks/log_oak_top.png'),
      side: loadTexture('/assets/blocks/log_oak.png')
    }
  },
  [BlockTypes.LEAVES]: {
    name: 'Leaves',
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
    name: 'Planks',
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
      top: loadTexture('/assets/blocks/cauldron_water.png'),
      bottom: loadTexture('/assets/blocks/cauldron_water.png'),
      side: loadTexture('/assets/blocks/cauldron_water.png')
    },
    colors: {
      top: 0xe8d48a,
      bottom: 0xe8d48a,
      side: 0xe8d48a
    }
  },
  [BlockTypes.COBBLESTONE]: {
    name: 'Cobblestone',
    solid: true,
    transparent: false,
    textures: {
      top: loadTexture('/assets/blocks/water_placeholder.png'),
      bottom: loadTexture('/assets/blocks/water_placeholder.png'),
      side: loadTexture('/assets/blocks/water_placeholder.png')
    },
    colors: {
      top: 0x888888,
      bottom: 0x888888,
      side: 0x888888
    }
  }
}

// Hotbar block selection - empty by default
export const HotbarBlocks = [
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null
]

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

// Get block display color for UI (fallback if texture can't be displayed)
export function getBlockDisplayColor(blockType) {
  const data = BlockData[blockType]
  if (!data) return '#888'
  
  if (data.colors) {
    const colorHex = data.colors.top || data.colors.side || 0xffffff
    return '#' + colorHex.toString(16).padStart(6, '0')
  }
  
  // Default colors based on block type
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
    default: return '#888888'
  }
}

// Display texture paths for UI (hotbar, inventory)
const BlockDisplayTextures = {
  [BlockTypes.GRASS]: { path: '/assets/blocks/grass_top.png', color: 0x55aa55 },
  [BlockTypes.DIRT]: { path: '/assets/blocks/dirt.png', color: 0xffffff },
  [BlockTypes.STONE]: { path: '/assets/blocks/stone.png', color: 0xffffff },
  [BlockTypes.WOOD]: { path: '/assets/blocks/log_oak_top.png', color: 0xffffff },
  [BlockTypes.LEAVES]: { path: '/assets/blocks/leaves_oak_carried.tga', color: 0x33aa33 },
  [BlockTypes.PLANKS]: { path: '/assets/blocks/planks_oak.png', color: 0xffffff },
  [BlockTypes.WATER]: { path: '/assets/blocks/water_still.png', color: 0x3366cc },
  [BlockTypes.SAND]: { path: '/assets/blocks/cauldron_water.png', color: 0xe8d48a },
  [BlockTypes.COBBLESTONE]: { path: '/assets/blocks/water_placeholder.png', color: 0x888888 },
  [BlockTypes.BEDROCK]: { path: '/assets/blocks/bedrock.png', color: 0xffffff }
}

// Cache for processed display images
const displayImageCache = new Map()

// Get block display image URL (supports TGA and color tinting)
export function getBlockDisplayImageURL(blockType) {
  if (displayImageCache.has(blockType)) {
    return displayImageCache.get(blockType)
  }
  
  const promise = new Promise((resolve) => {
    const displayInfo = BlockDisplayTextures[blockType]
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
          // Apply color tint (multiply)
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
  
  displayImageCache.set(blockType, promise)
  return promise
}
