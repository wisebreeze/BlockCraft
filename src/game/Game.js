import * as THREE from 'three'
import { World } from './World.js'
import { Player } from './Player.js'
import {
  HotbarBlocks, BlockTypes, BlockData,
  ItemTypes, isBlockItem, getItemBlockType,
  getBlockDisplayColor, getBlockDisplayImageURL,
  getItemDisplayImageURL, getMaxStackSize
} from './BlockTypes.js'

export class Game {
  constructor(canvas) {
    this.canvas = canvas
    this.running = false
    this.selectedBlockIndex = 0
    this.lastFlyUpTapTime = 0

    // Inventory system
    // Slots 0-8: hotbar (9 slots)
    // Slots 9-35: main inventory (27 slots, 3 rows × 9 columns)
    this.inventory = new Array(36).fill(null).map(() => ({ type: null, count: 0 }))

    // Block drop mapping (what item you get when you break a block)
    this.blockDrops = {
      [BlockTypes.STONE]: { type: BlockTypes.COBBLESTONE, count: 1 },
      [BlockTypes.COAL_ORE]: { type: ItemTypes.COAL, count: 1 },
      [BlockTypes.DIAMOND_ORE]: { type: ItemTypes.DIAMOND, count: 1 },
      [BlockTypes.EMERALD_ORE]: { type: ItemTypes.EMERALD, count: 1 },
      [BlockTypes.LAPIS_ORE]: { type: ItemTypes.LAPIS_LAZULI, count: 4 },
      [BlockTypes.REDSTONE_ORE]: { type: ItemTypes.REDSTONE, count: 4 },
      // Iron and gold ore drop themselves (need smelting)
      [BlockTypes.IRON_ORE]: { type: BlockTypes.IRON_ORE, count: 1 },
      [BlockTypes.GOLD_ORE]: { type: BlockTypes.GOLD_ORE, count: 1 }
      // All other blocks drop themselves
    }

    this.init()
    this.setupInput()

    // Give some initial items for testing
    this.addToInventory(BlockTypes.WOOD, 10)
    this.addToInventory(BlockTypes.COBBLESTONE, 20)
    this.addToInventory(ItemTypes.COAL, 5)
    this.addToInventory(BlockTypes.IRON_ORE, 5)

    // Auto-start game (UI handled by React)
    this.start()
  }

  init() {
    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87CEEB)
    this.scene.fog = new THREE.Fog(0x87CEEB, 16, 32)

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    this.scene.add(ambientLight)

    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x3d5c3d, 0.6)
    this.scene.add(hemisphereLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
    directionalLight.position.set(50, 100, 50)
    directionalLight.castShadow = false
    this.scene.add(directionalLight)

    // World
    this.world = new World(this.scene, 32)

    // Player
    this.player = new Player(this.camera, this.world)
    const spawnPos = this.world.getSpawnPosition()
    this.player.setPosition(spawnPos.x, spawnPos.y, spawnPos.z)

    // Load initial chunks around spawn
    this.world.updateChunks(spawnPos.x, spawnPos.z)

    // Block highlight - use EdgesGeometry to avoid face diagonals
    const highlightBox = new THREE.BoxGeometry(1.01, 1.01, 1.01)
    const highlightGeometry = new THREE.EdgesGeometry(highlightBox)
    const highlightMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5
    })
    this.blockHighlight = new THREE.LineSegments(highlightGeometry, highlightMaterial)
    this.blockHighlight.visible = false
    this.scene.add(this.blockHighlight)

    // Clock
    this.clock = new THREE.Clock()

    // Resize handler
    window.addEventListener('resize', () => this.onResize())
  }

  setupInput() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.player.handleKeyDown(e)

      // Hotbar selection
      if (e.code >= 'Digit1' && e.code <= 'Digit9') {
        const index = parseInt(e.code.slice(-1)) - 1
        this.selectBlock(index)
      }

      // Flight mode toggle
      if (e.code === 'KeyF') {
        this.toggleFlight()
      }
    })

    window.addEventListener('keyup', (e) => {
      this.player.handleKeyUp(e)
    })

    // Mouse
    this.canvas.addEventListener('click', () => {
      if (this.running && !this.player.pointerLocked) {
        this.canvas.requestPointerLock()
      }
    })

    document.addEventListener('pointerlockchange', () => {
      this.player.pointerLocked = document.pointerLockElement === this.canvas
    })

    document.addEventListener('mousemove', (e) => {
      this.player.handleMouseMove(e)
    })

    // Mouse buttons
    this.canvas.addEventListener('mousedown', (e) => {
      if (!this.player.pointerLocked) return

      if (e.button === 0) {
        this.breakBlock()
      } else if (e.button === 2) {
        // Try to interact first, then place block
        if (!this.tryInteract()) {
          this.placeBlock()
        }
      }
    })

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault()
    })

    // Scroll wheel for hotbar
    this.canvas.addEventListener('wheel', (e) => {
      if (!this.player.pointerLocked) return
      e.preventDefault()

      if (e.deltaY > 0) {
        this.selectBlock((this.selectedBlockIndex + 1) % 9)
      } else {
        this.selectBlock((this.selectedBlockIndex + 8) % 9)
      }
    })

    // Touch look (right side of screen) with tap to place and long press to break
    let lookTouchId = null
    let lastTouchPos = { x: 0, y: 0 }
    let touchStartTime = 0
    let touchStartPos = { x: 0, y: 0 }
    let hasMoved = false
    let longPressTimer = null
    const longPressDelay = 400 // ms for long press to break block
    const moveThreshold = 10 // pixels to count as movement

    function findTouchById(touchList, id) {
      for (let i = 0; i < touchList.length; i++) {
        if (touchList[i].identifier === id) return touchList[i]
      }
      return null
    }

    this.canvas.addEventListener('touchstart', (e) => {
      if (lookTouchId !== null) return

      // Find a touch on the right side of screen
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]
        // Only use right side of screen for look
        if (touch.clientX > window.innerWidth * 0.4) {
          lookTouchId = touch.identifier
          lastTouchPos = { x: touch.clientX, y: touch.clientY }
          touchStartTime = Date.now()
          touchStartPos = { x: touch.clientX, y: touch.clientY }
          hasMoved = false

          // Start long press timer for breaking blocks
          longPressTimer = setTimeout(() => {
            if (!hasMoved && lookTouchId === touch.identifier) {
              this.breakBlock()
            }
          }, longPressDelay)
          break
        }
      }
    })

    this.canvas.addEventListener('touchmove', (e) => {
      if (lookTouchId === null) return

      const touch = findTouchById(e.touches, lookTouchId)
      if (!touch) return

      e.preventDefault()

      // Check if movement exceeds threshold
      const dx = touch.clientX - touchStartPos.x
      const dy = touch.clientY - touchStartPos.y
      if (Math.abs(dx) > moveThreshold || Math.abs(dy) > moveThreshold) {
        hasMoved = true
        // Cancel long press if moved
        if (longPressTimer) {
          clearTimeout(longPressTimer)
          longPressTimer = null
        }
      }

      const moveDx = touch.clientX - lastTouchPos.x
      const moveDy = touch.clientY - lastTouchPos.y

      this.player.yaw -= moveDx * 0.005
      this.player.pitch -= moveDy * 0.005
      this.player.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.player.pitch))

      lastTouchPos = { x: touch.clientX, y: touch.clientY }
    })

    this.canvas.addEventListener('touchend', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === lookTouchId) {
          // Clear long press timer
          if (longPressTimer) {
            clearTimeout(longPressTimer)
            longPressTimer = null
          }

          // If it was a tap (short press, no movement), place block
          const touchDuration = Date.now() - touchStartTime
          if (!hasMoved && touchDuration < longPressDelay) {
            this.placeBlock()
          }

          lookTouchId = null
          break
        }
      }
    })

    this.canvas.addEventListener('touchcancel', (e) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        longPressTimer = null
      }
      lookTouchId = null
    })
  }

  toggleFlight() {
    this.player.flying = !this.player.flying
    if (this.player.flying) {
      this.player.velocity.y = 0
    }
    // Notify React UI of flight mode change
    this.onFlightChange?.(this.player.flying)
  }

  selectBlock(index) {
    this.selectedBlockIndex = index
    // Notify React UI
    this.onSlotChange?.(index)
  }

  getSelectedBlockType() {
    const slot = this.inventory[this.selectedBlockIndex]
    if (slot && slot.type !== null && slot.count > 0) {
      return slot.type
    }
    return null
  }

  addToInventory(itemType, count = 1) {
    const maxStack = getMaxStackSize(itemType)

    // First try to stack with existing slot of same type
    for (let i = 0; i < this.inventory.length; i++) {
      if (this.inventory[i].type === itemType && this.inventory[i].count < maxStack) {
        const canAdd = Math.min(count, maxStack - this.inventory[i].count)
        this.inventory[i].count += canAdd
        count -= canAdd
        if (count <= 0) {
          this.updateHotbarUI()
          return true
        }
      }
    }

    // Then try to find empty slot
    for (let i = 0; i < this.inventory.length; i++) {
      if (this.inventory[i].type === null || this.inventory[i].count === 0) {
        const canAdd = Math.min(count, maxStack)
        this.inventory[i].type = itemType
        this.inventory[i].count = canAdd
        count -= canAdd
        if (count <= 0) {
          this.updateHotbarUI()
          return true
        }
      }
    }

    // Inventory full (partial add)
    this.updateHotbarUI()
    return count <= 0
  }

  removeFromInventory(slotIndex) {
    if (slotIndex < 0 || slotIndex >= this.inventory.length) return false

    const slot = this.inventory[slotIndex]
    if (slot.type === null || slot.count <= 0) return false

    slot.count--
    if (slot.count <= 0) {
      slot.type = null
      slot.count = 0
    }

    this.updateHotbarUI()
    return true
  }

  // Generate 3D isometric preview of a block for hotbar display
  getBlock3DPreviewURL(blockType) {
    // Check cache
    if (this._blockPreviewCache?.has(blockType)) {
      return this._blockPreviewCache.get(blockType)
    }

    // Create cache if not exists
    if (!this._blockPreviewCache) {
      this._blockPreviewCache = new Map()
    }

    const promise = new Promise((resolve) => {
      const materials = this.world.materials[blockType]
      if (!materials) {
        resolve(null)
        return
      }

      // Create a small scene for preview
      const scene = new THREE.Scene()

      // Create orthographic camera for isometric view
      const size = 1.2
      const camera = new THREE.OrthographicCamera(-size, size, size, -size, 0.1, 100)
      camera.position.set(2, 1.5, 2)
      camera.lookAt(0, 0, 0)

      // Create cube
      const geometry = new THREE.BoxGeometry(1, 1, 1)
      const cube = new THREE.Mesh(geometry, materials)
      // Rotate slightly for better view
      cube.rotation.y = Math.PI / 4
      scene.add(cube)

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(5, 10, 7)
      scene.add(directionalLight)

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4)
      directionalLight2.position.set(-5, 5, -5)
      scene.add(directionalLight2)

      // Create renderer with transparent background
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false
      })
      renderer.setSize(64, 64)
      renderer.setPixelRatio(2) // Higher resolution for crispness
      renderer.outputColorSpace = THREE.SRGBColorSpace

      // Render
      renderer.render(scene, camera)

      // Get image URL
      const url = renderer.domElement.toDataURL()

      // Clean up
      geometry.dispose()
      renderer.dispose()

      resolve(url)
    })

    this._blockPreviewCache.set(blockType, promise)
    return promise
  }

  updateHotbarUI() {
    // Notify React UI of inventory change
    this.onInventoryChange?.(this.inventory)
  }

  breakBlock() {
    const direction = this.player.getLookDirection()
    const origin = new THREE.Vector3(
      this.player.position.x,
      this.player.position.y + this.player.eyeHeight,
      this.player.position.z
    )

    const result = this.world.raycast(origin, direction, 6)
    if (result.hit) {
      const blockType = this.world.getBlock(result.x, result.y, result.z)
      const blockData = BlockData[blockType]

      // Check if block is unbreakable (bedrock)
      if (blockData && blockData.unbreakable) {
        return
      }

      if (blockType !== BlockTypes.AIR) {
        this.world.setBlock(result.x, result.y, result.z, BlockTypes.AIR)

        // Get drop item from mapping, or drop block itself if not mapped
        const drop = this.blockDrops[blockType] || { type: blockType, count: 1 }
        this.addToInventory(drop.type, drop.count)
      }
    }
  }

  tryInteract() {
    const direction = this.player.getLookDirection()
    const origin = new THREE.Vector3(
      this.player.position.x,
      this.player.position.y + this.player.eyeHeight,
      this.player.position.z
    )

    const result = this.world.raycast(origin, direction, 6)
    if (!result.hit) return false

    const blockType = this.world.getBlock(result.x, result.y, result.z)

    // Check if it's an interactive block
    if (blockType === BlockTypes.CRAFTING_TABLE) {
      this.onOpenInteractive?.('crafting_table')
      return true
    } else if (blockType === BlockTypes.FURNACE) {
      this.onOpenInteractive?.('furnace')
      return true
    }

    return false
  }

  placeBlock() {
    const selectedType = this.getSelectedBlockType()
    if (selectedType === null) return

    // Only block items can be placed
    if (!isBlockItem(selectedType)) return

    const blockType = getItemBlockType(selectedType)

    const direction = this.player.getLookDirection()
    const origin = new THREE.Vector3(
      this.player.position.x,
      this.player.position.y + this.player.eyeHeight,
      this.player.position.z
    )

    const result = this.world.raycast(origin, direction, 6)
    if (result.hit) {
      const placeX = result.x + result.normal.x
      const placeY = result.y + result.normal.y
      const placeZ = result.z + result.normal.z

      // Don't place if it would collide with player
      const playerMin = {
        x: this.player.position.x - this.player.width / 2,
        y: this.player.position.y,
        z: this.player.position.z - this.player.width / 2
      }
      const playerMax = {
        x: this.player.position.x + this.player.width / 2,
        y: this.player.position.y + this.player.height,
        z: this.player.position.z + this.player.width / 2
      }

      const blockMin = { x: placeX, y: placeY, z: placeZ }
      const blockMax = { x: placeX + 1, y: placeY + 1, z: placeZ + 1 }

      const collides = playerMin.x < blockMax.x && playerMax.x > blockMin.x &&
                       playerMin.y < blockMax.y && playerMax.y > blockMin.y &&
                       playerMin.z < blockMax.z && playerMax.z > blockMin.z

      if (!collides) {
        // Remove from inventory first
        if (this.removeFromInventory(this.selectedBlockIndex)) {
          this.world.setBlock(placeX, placeY, placeZ, blockType)
        }
      }
    }
  }

  updateBlockHighlight() {
    const direction = this.player.getLookDirection()
    const origin = new THREE.Vector3(
      this.player.position.x,
      this.player.position.y + this.player.eyeHeight,
      this.player.position.z
    )

    const result = this.world.raycast(origin, direction, 6)
    if (result.hit) {
      this.blockHighlight.visible = true
      this.blockHighlight.position.set(
        result.x + 0.5,
        result.y + 0.5,
        result.z + 0.5
      )
    } else {
      this.blockHighlight.visible = false
    }
  }

  start() {
    this.running = true
    this.clock.start()
    this.animate()
  }

  stop() {
    this.running = false
  }

  animate() {
    if (!this.running) return

    requestAnimationFrame(() => this.animate())

    const deltaTime = Math.min(this.clock.getDelta(), 0.1)

    this.player.update(deltaTime)
    this.updateBlockHighlight()

    // Update chunks every frame for infinite world
    this.world.updateChunks(
      this.player.position.x,
      this.player.position.z
    )

    this.renderer.render(this.scene, this.camera)
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }
}
