import * as THREE from 'three'
import { BlockTypes, BlockData, createBlockMaterials } from './BlockTypes.js'
import { Chunk } from './Chunk.js'

export class World {
  constructor(scene, height = 32) {
    this.scene = scene
    this.height = height
    this.chunkSize = 16
    this.chunks = new Map() // key: "chunkX,chunkZ"
    this.viewDistance = 2 // Chunk render distance (2 = 5x5 chunks)

    // Chunk loading queues for staggered loading (prevents frame drops)
    this._loadQueue = [] // Chunks waiting to be generated
    this._buildQueue = [] // Chunks waiting to have meshes built
    this._dirtyChunks = new Set() // Chunks needing rebuild (from block edits)
    this._chunksPerFrame = 2 // Number of chunks to process per frame

    // Track last player chunk to avoid redundant updates
    this._lastPlayerChunkX = null
    this._lastPlayerChunkZ = null

    this.geometry = new THREE.BoxGeometry(1, 1, 1)

    // Pre-create materials for each block type
    this.materials = {}
    for (const type of Object.values(BlockTypes)) {
      if (type !== BlockTypes.AIR) {
        this.materials[type] = createBlockMaterials(type)
      }
    }
  }

  getChunkKey(chunkX, chunkZ) {
    return `${chunkX},${chunkZ}`
  }

  getChunk(chunkX, chunkZ) {
    return this.chunks.get(this.getChunkKey(chunkX, chunkZ))
  }

  // Get block at world coordinates (raw, no cross-chunk for face culling)
  getBlockRaw(x, y, z) {
    if (y < 0 || y >= this.height) return BlockTypes.AIR

    const chunkX = Math.floor(x / this.chunkSize)
    const chunkZ = Math.floor(z / this.chunkSize)
    const chunk = this.getChunk(chunkX, chunkZ)
    if (!chunk) return BlockTypes.AIR

    const localX = x - chunkX * this.chunkSize
    const localZ = z - chunkZ * this.chunkSize
    return chunk.blocks.get(chunk.getKey(localX, y, localZ)) || BlockTypes.AIR
  }

  // Get block at world coordinates
  getBlock(x, y, z) {
    if (y < 0 || y >= this.height) return BlockTypes.AIR

    const chunkX = Math.floor(x / this.chunkSize)
    const chunkZ = Math.floor(z / this.chunkSize)
    const chunk = this.getChunk(chunkX, chunkZ)
    if (!chunk) return BlockTypes.AIR

    const localX = x - chunkX * this.chunkSize
    const localZ = z - chunkZ * this.chunkSize
    return chunk.getBlock(localX, y, localZ)
  }

  // Set block at world coordinates
  setBlock(x, y, z, type) {
    if (y < 0 || y >= this.height) return

    const chunkX = Math.floor(x / this.chunkSize)
    const chunkZ = Math.floor(z / this.chunkSize)
    const chunk = this.getChunk(chunkX, chunkZ)
    if (!chunk) return

    const localX = x - chunkX * this.chunkSize
    const localZ = z - chunkZ * this.chunkSize
    chunk.setBlock(localX, y, localZ, type)
    chunk.built = false
    this._dirtyChunks.add(chunk)

    // If on chunk edge, mark neighboring chunks as dirty
    if (localX === 0 || localX === this.chunkSize - 1 ||
        localZ === 0 || localZ === this.chunkSize - 1) {
      this.markNeighborsDirty(chunkX, chunkZ)
    }
  }

  // Mark neighboring chunks as needing rebuild
  markNeighborsDirty(chunkX, chunkZ) {
    const neighbors = [
      [1, 0], [-1, 0],
      [0, 1], [0, -1]
    ]
    for (const [dx, dz] of neighbors) {
      const neighbor = this.getChunk(chunkX + dx, chunkZ + dz)
      if (neighbor) {
        neighbor.built = false
        this._dirtyChunks.add(neighbor)
      }
    }
  }

  isSolid(x, y, z) {
    const block = this.getBlock(x, y, z)
    const data = BlockData[block]
    return data ? data.solid : false
  }

  // Unload a chunk
  unloadChunk(chunkX, chunkZ) {
    const chunk = this.getChunk(chunkX, chunkZ)
    if (!chunk) return

    chunk.dispose()
    this.chunks.delete(this.getChunkKey(chunkX, chunkZ))
  }

  // Update loaded chunks based on player position
  // Only call this when the player crosses a chunk boundary to avoid per-frame overhead
  updateChunks(playerX, playerZ) {
    const playerChunkX = Math.floor(playerX / this.chunkSize)
    const playerChunkZ = Math.floor(playerZ / this.chunkSize)

    // Skip if player hasn't moved to a new chunk since last update
    if (this._lastPlayerChunkX === playerChunkX && this._lastPlayerChunkZ === playerChunkZ) {
      return
    }
    this._lastPlayerChunkX = playerChunkX
    this._lastPlayerChunkZ = playerChunkZ

    const viewDist = this.viewDistance

    // Collect needed chunks
    const neededChunks = new Set()
    const newChunksToLoad = []

    for (let dx = -viewDist; dx <= viewDist; dx++) {
      for (let dz = -viewDist; dz <= viewDist; dz++) {
        const cx = playerChunkX + dx
        const cz = playerChunkZ + dz
        const key = this.getChunkKey(cx, cz)
        neededChunks.add(key)

        // Check if this chunk needs to be loaded
        if (!this.chunks.has(key) && !this._isInQueue(cx, cz)) {
          // Calculate distance for priority sorting
          const dist = Math.abs(dx) + Math.abs(dz)
          newChunksToLoad.push({ cx, cz, dist })
        }
      }
    }

    // Sort by distance (closer first)
    newChunksToLoad.sort((a, b) => a.dist - b.dist)

    // Add new chunks to load queue
    for (const chunk of newChunksToLoad) {
      this._loadQueue.push({ cx: chunk.cx, cz: chunk.cz })
    }

    // Unload unneeded chunks (immediate, unloading is fast)
    for (const [key, chunk] of this.chunks) {
      if (!neededChunks.has(key)) {
        this._dirtyChunks.delete(chunk)
        this.unloadChunk(chunk.chunkX, chunk.chunkZ)
      }
    }

    // Also remove unneeded chunks from queues
    this._loadQueue = this._loadQueue.filter(item => {
      const key = this.getChunkKey(item.cx, item.cz)
      return neededChunks.has(key)
    })
    this._buildQueue = this._buildQueue.filter(item => {
      const key = this.getChunkKey(item.cx, item.cz)
      return neededChunks.has(key)
    })
  }

  // Process chunk loading queues - call this every frame for smooth staggered loading
  processQueues() {
    let buildsProcessed = 0
    let loadsProcessed = 0
    const maxPerFrame = this._chunksPerFrame

    // First process build queue (faster, just mesh building)
    while (buildsProcessed < maxPerFrame && this._buildQueue.length > 0) {
      const item = this._buildQueue.shift()
      const chunk = this.getChunk(item.cx, item.cz)
      if (chunk && !chunk.built) {
        chunk.buildMeshes()
        this._dirtyChunks.delete(chunk)
        buildsProcessed++
      }
    }

    // Then process load queue (slower, terrain generation)
    while (loadsProcessed < maxPerFrame && this._loadQueue.length > 0) {
      const item = this._loadQueue.shift()
      this._doLoadChunk(item.cx, item.cz)
      loadsProcessed++
    }

    // Also rebuild any dirty chunks (from block edits) using the dirty set
    if (buildsProcessed < maxPerFrame && this._dirtyChunks.size > 0) {
      const toRebuild = []
      for (const chunk of this._dirtyChunks) {
        if (!chunk.built) {
          toRebuild.push(chunk)
        }
      }
      for (const chunk of toRebuild) {
        if (buildsProcessed >= maxPerFrame) break
        chunk.buildMeshes()
        this._dirtyChunks.delete(chunk)
        buildsProcessed++
      }
    }
  }

  // Check if a chunk is already in any queue
  _isInQueue(chunkX, chunkZ) {
    for (const item of this._loadQueue) {
      if (item.cx === chunkX && item.cz === chunkZ) return true
    }
    for (const item of this._buildQueue) {
      if (item.cx === chunkX && item.cz === chunkZ) return true
    }
    return false
  }

  // Actually load and generate a chunk
  _doLoadChunk(chunkX, chunkZ) {
    if (this.getChunk(chunkX, chunkZ)) return

    const chunk = new Chunk(chunkX, chunkZ, this)
    chunk.generate()
    this.chunks.set(this.getChunkKey(chunkX, chunkZ), chunk)

    // Generate trees for this chunk
    this.generateTreesForChunk(chunk)

    // Clear spawn area if this is the spawn chunk
    if (chunkX === 0 && chunkZ === 0) {
      this.clearSpawnArea()
    }

    // Add to build queue for mesh construction
    this._buildQueue.push({ cx: chunkX, cz: chunkZ })
  }

  // Generate trees for a chunk with proper 3x3 spacing (cross-chunk consistent)
  generateTreesForChunk(chunk) {
    const spawnClearRadius = 5
    const treeSpacing = 3 // 3x3 grid spacing

    // Only generate trees whose trunk position is within this chunk
    // This ensures consistent spacing across chunk boundaries
    for (let x = 0; x < this.chunkSize; x++) {
      for (let z = 0; z < this.chunkSize; z++) {
        const worldX = chunk.chunkX * this.chunkSize + x
        const worldZ = chunk.chunkZ * this.chunkSize + z

        // Skip near spawn
        if (Math.abs(worldX) <= spawnClearRadius && Math.abs(worldZ) <= spawnClearRadius) {
          continue
        }

        // Only consider positions that are the "center" of a 3x3 grid cell
        // This ensures exactly one tree per 3x3 area, consistent across chunks
        const gridX = Math.floor(worldX / treeSpacing)
        const gridZ = Math.floor(worldZ / treeSpacing)
        const cellCenterX = gridX * treeSpacing + 1 // Center of 3x3 cell
        const cellCenterZ = gridZ * treeSpacing + 1

        if (worldX !== cellCenterX || worldZ !== cellCenterZ) {
          continue
        }

        const height = this.getHeight(worldX, worldZ)

        // Tree placement noise - use grid cell coordinates for deterministic result
        if (this.noise2D(gridX * 0.5, gridZ * 0.5) > 0.75 && height > 5) {
          this.generateTree(worldX, height, worldZ)
        }
      }
    }
  }

  // Generate a tree at world coordinates
  generateTree(x, y, z) {
    // Tree trunk
    const trunkHeight = 4 + Math.floor(this.noise2D(x, z) * 2)
    for (let ty = 0; ty < trunkHeight; ty++) {
      this.setBlock(x, y + ty, z, BlockTypes.WOOD)
    }

    // Tree leaves (can cross chunk boundaries)
    const leafStart = y + trunkHeight - 2
    for (let lx = -2; lx <= 2; lx++) {
      for (let ly = 0; ly <= 3; ly++) {
        for (let lz = -2; lz <= 2; lz++) {
          const dist = Math.abs(lx) + Math.abs(ly) + Math.abs(lz)
          if (dist <= 4 && !(lx === 0 && lz === 0 && ly < 2)) {
            const wx = x + lx
            const wy = leafStart + ly
            const wz = z + lz
            if (this.getBlock(wx, wy, wz) === BlockTypes.AIR) {
              this.setBlock(wx, wy, wz, BlockTypes.LEAVES)
            }
          }
        }
      }
    }
  }

  // Clear spawn area
  clearSpawnArea() {
    const spawnAreaClearRadius = 2
    const spawnGroundY = this.getHeight(0, 0)

    for (let x = -spawnAreaClearRadius; x <= spawnAreaClearRadius; x++) {
      for (let z = -spawnAreaClearRadius; z <= spawnAreaClearRadius; z++) {
        for (let y = spawnGroundY; y < this.height; y++) {
          if (this.getBlock(x, y, z) !== BlockTypes.AIR) {
            this.setBlock(x, y, z, BlockTypes.AIR)
          }
        }
      }
    }
  }

  // Simple 2D noise function for terrain generation
  noise2D(x, z) {
    const seed = 12345
    const n = Math.sin(x * 12.9898 + z * 78.233 + seed) * 43758.5453
    return n - Math.floor(n)
  }

  // Simple 3D noise function for ore generation
  noise3D(x, y, z) {
    const seed = 54321
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453
    return n - Math.floor(n)
  }

  // Smooth 3D noise
  smoothNoise3D(x, y, z) {
    // Sample neighbors and average for smoothness
    let sum = 0
    let count = 0
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          sum += this.noise3D(x + dx, y + dy, z + dz)
          count++
        }
      }
    }
    return sum / count
  }

  smoothNoise(x, z) {
    const corners = (this.noise2D(x - 1, z - 1) + this.noise2D(x + 1, z - 1) +
                     this.noise2D(x - 1, z + 1) + this.noise2D(x + 1, z + 1)) / 16
    const sides = (this.noise2D(x - 1, z) + this.noise2D(x + 1, z) +
                   this.noise2D(x, z - 1) + this.noise2D(x, z + 1)) / 8
    const center = this.noise2D(x, z) / 4
    return corners + sides + center
  }

  interpolatedNoise(x, z) {
    const intX = Math.floor(x)
    const fracX = x - intX
    const intZ = Math.floor(z)
    const fracZ = z - intZ

    const v1 = this.smoothNoise(intX, intZ)
    const v2 = this.smoothNoise(intX + 1, intZ)
    const v3 = this.smoothNoise(intX, intZ + 1)
    const v4 = this.smoothNoise(intX + 1, intZ + 1)

    const i1 = v1 * (1 - fracX) + v2 * fracX
    const i2 = v3 * (1 - fracX) + v4 * fracX
    return i1 * (1 - fracZ) + i2 * fracZ
  }

  getHeight(x, z) {
    let height = 0
    let amplitude = 1
    let frequency = 0.05
    for (let i = 0; i < 4; i++) {
      height += this.interpolatedNoise(x * frequency, z * frequency) * amplitude
      amplitude *= 0.5
      frequency *= 2
    }
    return Math.floor(height * 8) + 4
  }

  getSpawnPosition() {
    const height = this.getHeight(0, 0)
    return { x: 0.5, y: height + 2, z: 0.5 }
  }

  raycast(origin, direction, maxDistance = 10) {
    const step = 0.1
    let distance = 0
    let lastX = null
    let lastY = null
    let lastZ = null

    while (distance < maxDistance) {
      const x = Math.floor(origin.x + direction.x * distance)
      const y = Math.floor(origin.y + direction.y * distance)
      const z = Math.floor(origin.z + direction.z * distance)

      if (this.isSolid(x, y, z)) {
        return {
          hit: true,
          x, y, z,
          distance,
          normal: {
            x: lastX !== null ? lastX - x : 0,
            y: lastY !== null ? lastY - y : 0,
            z: lastZ !== null ? lastZ - z : 0
          }
        }
      }

      lastX = x
      lastY = y
      lastZ = z
      distance += step
    }

    return { hit: false }
  }

  // Legacy method - now handled by chunk loading
  updateVisibility(playerX, playerY, playerZ) {
    // No-op for backward compatibility
    // Chunk loading/unloading handles visibility now
  }
}
