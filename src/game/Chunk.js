import * as THREE from 'three'
import { BlockTypes, BlockData } from './BlockTypes.js'

export class Chunk {
  constructor(chunkX, chunkZ, world) {
    this.chunkX = chunkX
    this.chunkZ = chunkZ
    this.world = world
    this.size = 16
    this.height = world.height
    this.blocks = new Map() // key: "x,y,z" (local coordinates)
    this.meshes = new Map() // key: "x,y,z", value: THREE.Mesh
    this.generated = false
    this.built = false
  }

  getKey(x, y, z) {
    return `${x},${y},${z}`
  }

  // Get block at local coordinates
  getBlock(x, y, z) {
    if (y < 0 || y >= this.height) return BlockTypes.AIR

    // For blocks outside chunk bounds, query world
    if (x < 0 || x >= this.size || z < 0 || z >= this.size) {
      const worldX = this.chunkX * this.size + x
      const worldZ = this.chunkZ * this.size + z
      return this.world.getBlockRaw(worldX, y, worldZ)
    }

    return this.blocks.get(this.getKey(x, y, z)) || BlockTypes.AIR
  }

  // Set block at local coordinates
  setBlock(x, y, z, type) {
    if (y < 0 || y >= this.height) return

    if (x < 0 || x >= this.size || z < 0 || z >= this.size) {
      // Out of bounds, delegate to world
      const worldX = this.chunkX * this.size + x
      const worldZ = this.chunkZ * this.size + z
      this.world.setBlock(worldX, y, worldZ, type)
      return
    }

    const key = this.getKey(x, y, z)
    if (type === BlockTypes.AIR) {
      this.blocks.delete(key)
    } else {
      this.blocks.set(key, type)
    }
    this.built = false
  }

  // Check if any face is exposed
  isExposed(x, y, z) {
    const directions = [
      [1, 0, 0], [-1, 0, 0],
      [0, 1, 0], [0, -1, 0],
      [0, 0, 1], [0, 0, -1]
    ]

    for (const [dx, dy, dz] of directions) {
      const neighbor = this.getBlock(x + dx, y + dy, z + dz)
      if (neighbor === BlockTypes.AIR || BlockData[neighbor]?.transparent) {
        return true
      }
    }
    return false
  }

  // Generate terrain for this chunk
  generate() {
    for (let x = 0; x < this.size; x++) {
      for (let z = 0; z < this.size; z++) {
        const worldX = this.chunkX * this.size + x
        const worldZ = this.chunkZ * this.size + z
        const height = this.world.getHeight(worldX, worldZ)

        // Bedrock layer
        this.setBlock(x, 0, z, BlockTypes.BEDROCK)

        // Terrain layers
        for (let y = 1; y < height; y++) {
          let blockType
          if (y === height - 1) {
            blockType = BlockTypes.GRASS
          } else if (y > height - 4) {
            blockType = BlockTypes.DIRT
          } else {
            blockType = BlockTypes.STONE
          }
          this.blocks.set(this.getKey(x, y, z), blockType)
        }

        // Water in low areas
        if (height < 3) {
          for (let y = height; y < 3; y++) {
            this.blocks.set(this.getKey(x, y, z), BlockTypes.WATER)
          }
        }
      }
    }

    // Generate ore veins
    this.generateOres()

    this.generated = true
  }

  // Generate ore veins in stone
  generateOres() {
    // Ore definitions: type, minY, maxY, threshold, frequency
    // Ordered from rarest to most common
    const oreDefs = [
      { type: BlockTypes.EMERALD_ORE, minY: 1, maxY: 12, threshold: 0.85, freq: 0.08 },
      { type: BlockTypes.DIAMOND_ORE, minY: 1, maxY: 8, threshold: 0.8, freq: 0.08 },
      { type: BlockTypes.LAPIS_ORE, minY: 1, maxY: 12, threshold: 0.78, freq: 0.08 },
      { type: BlockTypes.GOLD_ORE, minY: 1, maxY: 12, threshold: 0.75, freq: 0.08 },
      { type: BlockTypes.REDSTONE_ORE, minY: 1, maxY: 8, threshold: 0.7, freq: 0.06 },
      { type: BlockTypes.IRON_ORE, minY: 1, maxY: 24, threshold: 0.65, freq: 0.05 },
      { type: BlockTypes.COAL_ORE, minY: 1, maxY: 28, threshold: 0.55, freq: 0.04 }
    ]

    for (let x = 0; x < this.size; x++) {
      for (let z = 0; z < this.size; z++) {
        const worldX = this.chunkX * this.size + x
        const worldZ = this.chunkZ * this.size + z
        const height = this.world.getHeight(worldX, worldZ)

        // Only replace stone blocks (below dirt layer)
        const stoneMaxY = height - 4
        if (stoneMaxY <= 1) continue

        for (let y = 1; y < stoneMaxY; y++) {
          const key = this.getKey(x, y, z)
          const currentBlock = this.blocks.get(key)

          // Only replace stone
          if (currentBlock !== BlockTypes.STONE) continue

          // Check each ore type
          for (const ore of oreDefs) {
            if (y < ore.minY || y > ore.maxY) continue

            const noiseVal = this.world.noise3D(
              worldX * ore.freq,
              y * ore.freq,
              worldZ * ore.freq
            )

            if (noiseVal > ore.threshold) {
              this.blocks.set(key, ore.type)
              break // Only one ore type per block
            }
          }
        }
      }
    }
  }

  // Build all block meshes with face culling
  buildMeshes() {
    // Remove old meshes
    for (const [key, mesh] of this.meshes) {
      this.world.scene.remove(mesh)
    }
    this.meshes.clear()

    const geometry = this.world.geometry
    const materials = this.world.materials

    for (const [key, blockType] of this.blocks) {
      const [x, y, z] = key.split(',').map(Number)

      if (!this.isExposed(x, y, z)) continue

      const mat = materials[blockType]
      if (!mat) continue

      const mesh = new THREE.Mesh(geometry, mat)
      const worldX = this.chunkX * this.size + x
      const worldZ = this.chunkZ * this.size + z
      mesh.position.set(worldX + 0.5, y + 0.5, worldZ + 0.5)
      mesh.userData = { x: worldX, y, z: worldZ, type: blockType, chunk: this }
      this.world.scene.add(mesh)
      this.meshes.set(key, mesh)
    }

    this.built = true
  }

  // Dispose chunk and remove all meshes
  dispose() {
    for (const [key, mesh] of this.meshes) {
      this.world.scene.remove(mesh)
    }
    this.meshes.clear()
    this.blocks.clear()
  }
}
