import * as THREE from 'three'

const textureLoader = new THREE.TextureLoader()

function loadTexture(path) {
  const texture = textureLoader.load(path)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
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
  COBBLESTONE: 9
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
      bottom: loadTexture('/assets/blocks/grass_side_carried.png'),
      side: loadTexture('/assets/blocks/grass_carried.png')
    }
  },
  [BlockTypes.DIRT]: {
    name: 'Dirt',
    solid: true,
    transparent: false,
    textures: {
      top: loadTexture('/assets/blocks/grass_side_carried.png'),
      bottom: loadTexture('/assets/blocks/grass_side_carried.png'),
      side: loadTexture('/assets/blocks/grass_side_carried.png')
    }
  },
  [BlockTypes.STONE]: {
    name: 'Stone',
    solid: true,
    transparent: false,
    textures: {
      top: loadTexture('/assets/blocks/cauldron_water_placeholder.png'),
      bottom: loadTexture('/assets/blocks/cauldron_water_placeholder.png'),
      side: loadTexture('/assets/blocks/cauldron_water_placeholder.png')
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
    }
  }
}

// Hotbar block selection
export const HotbarBlocks = [
  BlockTypes.GRASS,
  BlockTypes.PLANKS,
  BlockTypes.WOOD,
  BlockTypes.LEAVES,
  BlockTypes.WATER,
  BlockTypes.DIRT,
  BlockTypes.STONE,
  BlockTypes.SAND,
  BlockTypes.COBBLESTONE
]

export function getBlockMaterial(blockType, face) {
  const data = BlockData[blockType]
  if (!data || !data.textures) return null

  const texture = data.textures[face] || data.textures.side
  const material = new THREE.MeshLambertMaterial({
    map: texture,
    transparent: data.transparent || false,
    opacity: data.opacity || 1.0
  })

  return material
}

export function createBlockMaterials(blockType) {
  return [
    getBlockMaterial(blockType, 'side'),   // right
    getBlockMaterial(blockType, 'side'),   // left
    getBlockMaterial(blockType, 'top'),    // top
    getBlockMaterial(blockType, 'bottom'), // bottom
    getBlockMaterial(blockType, 'side'),   // front
    getBlockMaterial(blockType, 'side')    // back
  ]
}
