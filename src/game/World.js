import * as THREE from 'three'
import { BlockTypes, BlockData, createBlockMaterials } from './BlockTypes.js'

export class World {
  constructor(scene, size = 32, height = 32) {
    this.scene = scene
    this.size = size
    this.height = height
    this.blocks = new Map()
    this.meshes = new Map()
    this.geometry = new THREE.BoxGeometry(1, 1, 1)
    this.viewDistance = 24 // Render distance in blocks

    // Pre-create materials for each block type
    this.materials = {}
    for (const type of Object.values(BlockTypes)) {
      if (type !== BlockTypes.AIR) {
        this.materials[type] = createBlockMaterials(type)
      }
    }
  }

  getKey(x, y, z) {
    return `${x},${y},${z}`
  }

  getBlock(x, y, z) {
    return this.blocks.get(this.getKey(x, y, z)) || BlockTypes.AIR
  }

  setBlock(x, y, z, type) {
    const key = this.getKey(x, y, z)

    if (type === BlockTypes.AIR) {
      this.blocks.delete(key)
      this.removeBlockMesh(x, y, z)
      // Update neighbors to show newly exposed faces
      this.updateNeighbors(x, y, z)
    } else {
      this.blocks.set(key, type)
      this.updateBlockMesh(x, y, z, type)
    }
  }

  isSolid(x, y, z) {
    const block = this.getBlock(x, y, z)
    const data = BlockData[block]
    return data ? data.solid : false
  }

  isExposed(x, y, z) {
    // Check if any face is exposed (adjacent to air or transparent block)
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

  updateBlockMesh(x, y, z, type) {
    const key = this.getKey(x, y, z)

    // Remove existing mesh
    this.removeBlockMesh(x, y, z)

    // Only create mesh if block is exposed
    if (!this.isExposed(x, y, z)) return

    const materials = this.materials[type]
    if (!materials) return

    const mesh = new THREE.Mesh(this.geometry, materials)
    mesh.position.set(x + 0.5, y + 0.5, z + 0.5)
    mesh.userData = { x, y, z, type }
    this.scene.add(mesh)
    this.meshes.set(key, mesh)

    // Update neighboring blocks (they may now be hidden or exposed)
    this.updateNeighbors(x, y, z)
  }

  removeBlockMesh(x, y, z) {
    const key = this.getKey(x, y, z)
    const mesh = this.meshes.get(key)
    if (mesh) {
      this.scene.remove(mesh)
      this.meshes.delete(key)
    }
  }

  updateNeighbors(x, y, z) {
    const directions = [
      [1, 0, 0], [-1, 0, 0],
      [0, 1, 0], [0, -1, 0],
      [0, 0, 1], [0, 0, -1]
    ]

    for (const [dx, dy, dz] of directions) {
      const nx = x + dx
      const ny = y + dy
      const nz = z + dz
      const blockType = this.getBlock(nx, ny, nz)

      if (blockType !== BlockTypes.AIR) {
        const key = this.getKey(nx, ny, nz)
        const hasMesh = this.meshes.has(key)
        const exposed = this.isExposed(nx, ny, nz)

        if (exposed && !hasMesh) {
          const materials = this.materials[blockType]
          if (materials) {
            const mesh = new THREE.Mesh(this.geometry, materials)
            mesh.position.set(nx + 0.5, ny + 0.5, nz + 0.5)
            mesh.userData = { x: nx, y: ny, z: nz, type: blockType }
            this.scene.add(mesh)
            this.meshes.set(key, mesh)
          }
        } else if (!exposed && hasMesh) {
          this.removeBlockMesh(nx, ny, nz)
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

  generateTerrain() {
    const halfSize = Math.floor(this.size / 2)

    for (let x = -halfSize; x < halfSize; x++) {
      for (let z = -halfSize; z < halfSize; z++) {
        const height = this.getHeight(x, z)

        // Bedrock layer at y=0
        this.setBlock(x, 0, z, BlockTypes.BEDROCK)

        for (let y = 1; y < height; y++) {
          let blockType
          if (y === height - 1) {
            blockType = BlockTypes.GRASS
          } else if (y > height - 4) {
            blockType = BlockTypes.DIRT
          } else {
            blockType = BlockTypes.STONE
          }
          this.setBlock(x, y, z, blockType)
        }

        // Add some trees
        if (this.noise2D(x * 0.08, z * 0.08) > 0.96 && height > 5) {
          this.generateTree(x, height, z)
        }
      }
    }

    // Add some water in low areas
    for (let x = -halfSize; x < halfSize; x++) {
      for (let z = -halfSize; z < halfSize; z++) {
        const height = this.getHeight(x, z)
        if (height < 3) {
          for (let y = height; y < 3; y++) {
            this.setBlock(x, y, z, BlockTypes.WATER)
          }
        }
      }
    }
  }

  generateTree(x, y, z) {
    // Tree trunk
    const trunkHeight = 4 + Math.floor(this.noise2D(x, z) * 2)
    for (let ty = 0; ty < trunkHeight; ty++) {
      this.setBlock(x, y + ty, z, BlockTypes.WOOD)
    }

    // Tree leaves
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

  // Update block visibility based on player position (view distance culling)
  updateVisibility(playerX, playerY, playerZ) {
    const viewDist = this.viewDistance
    const viewDistSq = viewDist * viewDist

    for (const [key, mesh] of this.meshes) {
      const dx = mesh.position.x - playerX
      const dy = mesh.position.y - playerY
      const dz = mesh.position.z - playerZ
      const distSq = dx * dx + dy * dy + dz * dz

      mesh.visible = distSq <= viewDistSq
    }
  }
}
