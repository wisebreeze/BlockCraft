import * as THREE from 'three'
import { World } from './World.js'
import { Player } from './Player.js'
import { HotbarBlocks, BlockTypes, BlockData, getBlockDisplayColor, getBlockDisplayImageURL } from './BlockTypes.js'

export class Game {
  constructor(canvas) {
    this.canvas = canvas
    this.running = false
    this.selectedBlockIndex = 0
    this.lastFlyUpTapTime = 0

    // Inventory system - 9 slots for hotbar
    this.inventory = new Array(9).fill(null).map(() => ({ type: null, count: 0 }))

    this.init()
    this.setupInput()
    this.setupUI()
  }

  init() {
    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87CEEB)
    this.scene.fog = new THREE.Fog(0x87CEEB, 12, 24)

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
    this.world = new World(this.scene, 48, 32)
    this.world.generateTerrain()

    // Player
    this.player = new Player(this.camera, this.world)
    const spawnPos = this.world.getSpawnPosition()
    this.player.setPosition(spawnPos.x, spawnPos.y, spawnPos.z)

    // Initial visibility culling
    this.world.updateVisibility(spawnPos.x, spawnPos.y + this.player.eyeHeight, spawnPos.z)

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
        this.placeBlock()
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
  }

  setupUI() {
    // Start button (kept for reference, but game auto-starts now)
    const startBtn = document.getElementById('start-btn')
    const startScreen = document.getElementById('start-screen')

    startBtn.addEventListener('click', () => {
      startScreen.classList.add('hidden')
      this.start()
      this.canvas.requestPointerLock()
    })

    // Auto-start game
    startScreen.classList.add('hidden')
    this.start()

    // Hotbar slots
    const slots = document.querySelectorAll('.hotbar-slot')
    slots.forEach((slot, index) => {
      slot.addEventListener('click', () => {
        this.selectBlock(index)
      })
    })

    // Initialize hotbar UI
    this.updateHotbarUI()

    // Mobile controls
    this.setupMobileControls()
  }

  setupMobileControls() {
    // Joystick
    const joystickArea = document.getElementById('joystick-area')
    const joystickKnob = document.getElementById('joystick-knob')
    const joystickFrame = document.getElementById('joystick-frame')

    let joystickTouchId = null
    let joystickCenter = { x: 0, y: 0 }
    const joystickRadius = 50

    function findTouchById(touchList, id) {
      for (let i = 0; i < touchList.length; i++) {
        if (touchList[i].identifier === id) return touchList[i]
      }
      return null
    }

    joystickArea.addEventListener('touchstart', (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (joystickTouchId !== null) return

      const touch = e.changedTouches[0]
      joystickTouchId = touch.identifier
      this.player.joystick.active = true

      const rect = joystickFrame.getBoundingClientRect()
      joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      }
    })

    joystickArea.addEventListener('touchmove', (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (joystickTouchId === null) return

      const touch = findTouchById(e.touches, joystickTouchId)
      if (!touch) return

      let dx = touch.clientX - joystickCenter.x
      let dy = touch.clientY - joystickCenter.y

      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > joystickRadius) {
        dx = (dx / dist) * joystickRadius
        dy = (dy / dist) * joystickRadius
      }

      joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`

      this.player.joystick.x = dx / joystickRadius
      this.player.joystick.y = dy / joystickRadius
    })

    joystickArea.addEventListener('touchend', (e) => {
      e.preventDefault()
      e.stopPropagation()
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joystickTouchId) {
          joystickTouchId = null
          this.player.joystick.active = false
          this.player.joystick.x = 0
          this.player.joystick.y = 0
          joystickKnob.style.transform = 'translate(-50%, -50%)'
          break
        }
      }
    })

    joystickArea.addEventListener('touchcancel', (e) => {
      e.preventDefault()
      e.stopPropagation()
      joystickTouchId = null
      this.player.joystick.active = false
      this.player.joystick.x = 0
      this.player.joystick.y = 0
      joystickKnob.style.transform = 'translate(-50%, -50%)'
    })

    // Action buttons (merged: jump/fly-up and sneak/fly-down)
    const btnActionUp = document.getElementById('btn-action-up')
    const btnActionDown = document.getElementById('btn-action-down')
    let lastUpTapTime = 0

    // Update button styles based on flight mode
    const updateActionButtons = () => {
      if (this.player.flying) {
        btnActionUp.classList.remove('btn-jump')
        btnActionUp.classList.add('btn-fly-up')
        btnActionDown.classList.remove('btn-sneak')
        btnActionDown.classList.add('btn-fly-down')
      } else {
        btnActionUp.classList.remove('btn-fly-up')
        btnActionUp.classList.add('btn-jump')
        btnActionDown.classList.remove('btn-fly-down')
        btnActionDown.classList.add('btn-sneak')
      }
    }

    // Up button (jump / fly-up)
    btnActionUp.addEventListener('touchstart', (e) => {
      e.preventDefault()
      e.stopPropagation()
      btnActionUp.classList.add('pressed')

      const now = Date.now()
      // Double tap to toggle flight mode
      if (now - lastUpTapTime < 300) {
        this.player.flying = !this.player.flying
        updateActionButtons()
        if (!this.player.flying) {
          this.player.keys.jump = false
        }
        lastUpTapTime = 0
      } else {
        if (this.player.flying) {
          this.player.keys.jump = true
        } else {
          this.player.keys.jump = true
        }
        lastUpTapTime = now
      }
    })
    btnActionUp.addEventListener('touchend', (e) => {
      e.preventDefault()
      e.stopPropagation()
      btnActionUp.classList.remove('pressed')
      this.player.keys.jump = false
    })
    btnActionUp.addEventListener('touchcancel', (e) => {
      e.preventDefault()
      e.stopPropagation()
      btnActionUp.classList.remove('pressed')
      this.player.keys.jump = false
    })

    // Down button (sneak / fly-down)
    btnActionDown.addEventListener('touchstart', (e) => {
      e.preventDefault()
      e.stopPropagation()
      btnActionDown.classList.add('pressed')
      this.player.keys.sneak = true
      if (this.player.flying) {
        // Already handled by sneak key in flight mode
      }
    })
    btnActionDown.addEventListener('touchend', (e) => {
      e.preventDefault()
      e.stopPropagation()
      btnActionDown.classList.remove('pressed')
      this.player.keys.sneak = false
    })
    btnActionDown.addEventListener('touchcancel', (e) => {
      e.preventDefault()
      e.stopPropagation()
      btnActionDown.classList.remove('pressed')
      this.player.keys.sneak = false
    })

    // Build buttons
    const btnBreak = document.getElementById('btn-break')
    const btnPlace = document.getElementById('btn-place')

    btnBreak.addEventListener('touchstart', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.breakBlock()
    })
    btnBreak.addEventListener('touchend', (e) => {
      e.preventDefault()
      e.stopPropagation()
    })

    btnPlace.addEventListener('touchstart', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.placeBlock()
    })
    btnPlace.addEventListener('touchend', (e) => {
      e.preventDefault()
      e.stopPropagation()
    })

    // Touch look (right side of screen)
    let lookTouchId = null
    let lastTouchPos = { x: 0, y: 0 }

    this.canvas.addEventListener('touchstart', (e) => {
      if (lookTouchId !== null) return

      // Find a touch on the right side of screen that isn't already handled
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]
        // Only use right side of screen for look, and avoid left side joystick area
        if (touch.clientX > window.innerWidth * 0.4) {
          lookTouchId = touch.identifier
          lastTouchPos = { x: touch.clientX, y: touch.clientY }
          break
        }
      }
    })

    this.canvas.addEventListener('touchmove', (e) => {
      if (lookTouchId === null) return

      const touch = findTouchById(e.touches, lookTouchId)
      if (!touch) return

      e.preventDefault()

      const dx = touch.clientX - lastTouchPos.x
      const dy = touch.clientY - lastTouchPos.y

      this.player.yaw -= dx * 0.005
      this.player.pitch -= dy * 0.005
      this.player.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.player.pitch))

      lastTouchPos = { x: touch.clientX, y: touch.clientY }
    })

    this.canvas.addEventListener('touchend', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === lookTouchId) {
          lookTouchId = null
          break
        }
      }
    })

    this.canvas.addEventListener('touchcancel', (e) => {
      lookTouchId = null
    })
  }

  selectBlock(index) {
    this.selectedBlockIndex = index

    // Update UI
    const slots = document.querySelectorAll('.hotbar-slot')
    slots.forEach((slot, i) => {
      if (i === index) {
        slot.classList.add('selected')
      } else {
        slot.classList.remove('selected')
      }
    })
  }

  getSelectedBlockType() {
    const slot = this.inventory[this.selectedBlockIndex]
    if (slot && slot.type !== null && slot.count > 0) {
      return slot.type
    }
    return null
  }

  addToInventory(blockType) {
    // First try to stack with existing slot of same type
    for (let i = 0; i < this.inventory.length; i++) {
      if (this.inventory[i].type === blockType) {
        this.inventory[i].count++
        this.updateHotbarUI()
        return true
      }
    }

    // Then try to find empty slot
    for (let i = 0; i < this.inventory.length; i++) {
      if (this.inventory[i].type === null || this.inventory[i].count === 0) {
        this.inventory[i].type = blockType
        this.inventory[i].count = 1
        this.updateHotbarUI()
        return true
      }
    }

    // Inventory full
    return false
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
    const slots = document.querySelectorAll('.hotbar-slot')
    slots.forEach((slot, index) => {
      const item = this.inventory[index]
      const img = slot.querySelector('img')
      const countEl = slot.querySelector('.slot-count')

      if (item.type !== null && item.count > 0) {
        // Get block data
        const displayColor = getBlockDisplayColor(item.type)

        // Set background color as fallback
        slot.style.backgroundColor = displayColor + '33'

        // Use 3D isometric preview of the block
        this.getBlock3DPreviewURL(item.type).then(url => {
          if (url) {
            img.src = url
            img.style.display = 'block'
            img.style.width = '44px'
            img.style.height = '44px'
            slot.style.backgroundColor = ''
          } else {
            // Fallback to 2D processed image
            getBlockDisplayImageURL(item.type).then(url2 => {
              if (url2) {
                img.src = url2
                img.style.display = 'block'
                img.style.width = '36px'
                img.style.height = '36px'
                slot.style.backgroundColor = ''
              } else {
                // Fallback to color block
                img.style.display = 'none'
                slot.style.backgroundColor = displayColor
              }
            })
          }
        })

        // Show count if more than 1
        if (item.count > 1) {
          if (!countEl) {
            const newCountEl = document.createElement('span')
            newCountEl.className = 'slot-count'
            newCountEl.textContent = item.count
            slot.appendChild(newCountEl)
          } else {
            countEl.textContent = item.count
            countEl.style.display = 'block'
          }
        } else if (countEl) {
          countEl.style.display = 'none'
        }
      } else {
        // Empty slot
        img.style.display = 'none'
        slot.style.backgroundColor = ''
        if (countEl) {
          countEl.style.display = 'none'
        }
      }
    })
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
        // Add to inventory
        this.addToInventory(blockType)
      }
    }
  }

  placeBlock() {
    const selectedType = this.getSelectedBlockType()
    if (selectedType === null) return

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

      // Check if player is not in the way
      const blockType = selectedType

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

    // Update visibility culling every 2 frames for performance
    this._visibilityFrame = (this._visibilityFrame || 0) + 1
    if (this._visibilityFrame >= 2) {
      this._visibilityFrame = 0
      this.world.updateVisibility(
        this.player.position.x,
        this.player.position.y + this.player.eyeHeight,
        this.player.position.z
      )
    }

    this.renderer.render(this.scene, this.camera)
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }
}
