import * as THREE from 'three'
import { BlockData } from './BlockTypes.js'

// Block-break particle system inspired by Minecraft.
// Spawns small textured cubes that fly out, fall with gravity, and shrink.
export class ParticleSystem {
  constructor(scene) {
    this.scene = scene
    this.particles = []
    this.geometry = new THREE.BoxGeometry(0.12, 0.12, 0.12)
    this.materialCache = new Map()
  }

  // Lazily build (and cache) a material for a given block type's particles.
  _getMaterial(blockType) {
    if (this.materialCache.has(blockType)) {
      return this.materialCache.get(blockType)
    }
    const data = BlockData[blockType]
    if (!data || !data.textures) return null

    const texture = data.textures.side || data.textures.top
    const color = data.colors ? (data.colors.side || data.colors.top || 0xffffff) : 0xffffff

    const useAlphaTest = data.alphaTest !== undefined && data.alphaTest > 0

    const material = new THREE.MeshLambertMaterial({
      map: texture,
      color: color,
      transparent: useAlphaTest ? false : (data.transparent || false),
      opacity: data.opacity || 1.0,
      alphaTest: data.alphaTest || 0,
      side: THREE.FrontSide
    })
    this.materialCache.set(blockType, material)
    return material
  }

  // Spawn break particles at the block's world coordinates.
  spawnBlockBreak(x, y, z, blockType) {
    const material = this._getMaterial(blockType)
    if (!material) return

    const count = 8 + Math.floor(Math.random() * 4)
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.geometry, material)

      // Start near the block center with a small random offset.
      mesh.position.set(
        x + 0.5 + (Math.random() - 0.5) * 0.5,
        y + 0.5 + (Math.random() - 0.5) * 0.5,
        z + 0.5 + (Math.random() - 0.5) * 0.5
      )

      // Outward + upward velocity, like Minecraft's burst.
      const angle = Math.random() * Math.PI * 2
      const horizontalSpeed = 1.5 + Math.random() * 1.5
      const velocity = new THREE.Vector3(
        Math.cos(angle) * horizontalSpeed,
        2.5 + Math.random() * 2.0,
        Math.sin(angle) * horizontalSpeed
      )

      // Random rotation axis for tumbling.
      const rotAxis = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize()
      const rotSpeed = (Math.random() * 2 + 2) * (Math.random() < 0.5 ? 1 : -1)

      this.scene.add(mesh)
      this.particles.push({
        mesh,
        velocity,
        rotAxis,
        rotSpeed,
        lifetime: 0.6 + Math.random() * 0.3,
        age: 0
      })
    }
  }

  update(deltaTime) {
    const gravity = 9.0
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.age += deltaTime

      if (p.age >= p.lifetime) {
        this.scene.remove(p.mesh)
        this.particles.splice(i, 1)
        continue
      }

      // Apply gravity to vertical velocity.
      p.velocity.y -= gravity * deltaTime

      // Integrate position.
      p.mesh.position.x += p.velocity.x * deltaTime
      p.mesh.position.y += p.velocity.y * deltaTime
      p.mesh.position.z += p.velocity.z * deltaTime

      // Tumble.
      p.mesh.rotateOnAxis(p.rotAxis, p.rotSpeed * deltaTime)

      // Shrink over the last 40% of life for a clean fade-out.
      const lifeRatio = p.age / p.lifetime
      if (lifeRatio > 0.6) {
        const scale = 1 - (lifeRatio - 0.6) / 0.4
        p.mesh.scale.setScalar(Math.max(0.01, scale))
      }
    }
  }
}
