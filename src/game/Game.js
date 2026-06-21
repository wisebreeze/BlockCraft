import * as THREE from 'three'
import { World } from './World.js'
import { Player } from './Player.js'
import { HotbarBlocks, BlockTypes } from './BlockTypes.js'

export class Game {
  constructor(canvas) {
    this.canvas = canvas
    this.running = false
    this.selectedBlockIndex = 0

    this.init()
    this.setupInput()
    this.setupUI()
  }

  init() {
    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87CEEB)
    this.scene.fog = new THREE.Fog(0x87CEEB, 20, 60)

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

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
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

    // Block highlight
    const highlightGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01)
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    })
    this.blockHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial)
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
    // Start button
    const startBtn = document.getElementById('start-btn')
    const startScreen = document.getElementById('start-screen')

    startBtn.addEventListener('click', () => {
      startScreen.classList.add('hidden')
      this.start()
      this.canvas.requestPointerLock()
    })

    // Hotbar slots
    const slots = document.querySelectorAll('.hotbar-slot')
    slots.forEach((slot, index) => {
      slot.addEventListener('click', () => {
        this.selectBlock(index)
      })
    })

    // Mobile controls
    this.setupMobileControls()
  }

  setupMobileControls() {
    // Joystick
    const joystickArea = document.getElementById('joystick-area')
    const joystickKnob = document.getElementById('joystick-knob')
    const joystickFrame = document.getElementById('joystick-frame')

    let joystickActive = false
    let joystickCenter = { x: 0, y: 0 }
    const joystickRadius = 50

    function getTouchPos(e) {
      const touch = e.touches[0]
      const rect = joystickFrame.getBoundingClientRect()
      return {
        x: touch.clientX - rect.left - rect.width / 2,
        y: touch.clientY - rect.top - rect.height / 2
      }
    }

    joystickArea.addEventListener('touchstart', (e) => {
      e.preventDefault()
      joystickActive = true
      this.player.joystick.active = true

      const rect = joystickFrame.getBoundingClientRect()
      joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      }
    })

    joystickArea.addEventListener('touchmove', (e) => {
      e.preventDefault()
      if (!joystickActive) return

      const touch = e.touches[0]
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
      joystickActive = false
      this.player.joystick.active = false
      this.player.joystick.x = 0
      this.player.joystick.y = 0
      joystickKnob.style.transform = 'translate(-50%, -50%)'
    })

    // Action buttons
    const btnJump = document.getElementById('btn-jump')
    const btnSneak = document.getElementById('btn-sneak')
    const btnFlyUp = document.getElementById('btn-fly-up')
    const btnFlyDown = document.getElementById('btn-fly-down')

    btnJump.addEventListener('touchstart', (e) => {
      e.preventDefault()
      this.player.keys.jump = true
    })
    btnJump.addEventListener('touchend', (e) => {
      e.preventDefault()
      this.player.keys.jump = false
    })

    btnSneak.addEventListener('touchstart', (e) => {
      e.preventDefault()
      this.player.keys.sneak = true
    })
    btnSneak.addEventListener('touchend', (e) => {
      e.preventDefault()
      this.player.keys.sneak = false
    })

    btnFlyUp.addEventListener('touchstart', (e) => {
      e.preventDefault()
      this.player.flying = true
      this.player.keys.jump = true
    })
    btnFlyUp.addEventListener('touchend', (e) => {
      e.preventDefault()
      this.player.keys.jump = false
    })

    btnFlyDown.addEventListener('touchstart', (e) => {
      e.preventDefault()
      this.player.flying = true
      this.player.keys.sneak = true
    })
    btnFlyDown.addEventListener('touchend', (e) => {
      e.preventDefault()
      this.player.keys.sneak = false
    })

    // Build buttons
    const btnBreak = document.getElementById('btn-break')
    const btnPlace = document.getElementById('btn-place')

    btnBreak.addEventListener('touchstart', (e) => {
      e.preventDefault()
      this.breakBlock()
    })

    btnPlace.addEventListener('touchstart', (e) => {
      e.preventDefault()
      this.placeBlock()
    })

    // Touch look (right side of screen)
    let touchLookActive = false
    let lastTouchPos = { x: 0, y: 0 }

    this.canvas.addEventListener('touchstart', (e) => {
      // Only use right side of screen for look
      const touch = e.touches[0]
      if (touch.clientX > window.innerWidth * 0.5) {
        touchLookActive = true
        lastTouchPos = { x: touch.clientX, y: touch.clientY }
      }
    })

    this.canvas.addEventListener('touchmove', (e) => {
      if (!touchLookActive) return
      e.preventDefault()

      const touch = e.touches[0]
      const dx = touch.clientX - lastTouchPos.x
      const dy = touch.clientY - lastTouchPos.y

      this.player.yaw -= dx * 0.005
      this.player.pitch -= dy * 0.005
      this.player.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.player.pitch))

      lastTouchPos = { x: touch.clientX, y: touch.clientY }
    })

    this.canvas.addEventListener('touchend', (e) => {
      touchLookActive = false
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
    return HotbarBlocks[this.selectedBlockIndex]
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
      this.world.setBlock(result.x, result.y, result.z, BlockTypes.AIR)
    }
  }

  placeBlock() {
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
      const blockType = this.getSelectedBlockType()

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
        this.world.setBlock(placeX, placeY, placeZ, blockType)
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

    this.renderer.render(this.scene, this.camera)
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }
}
