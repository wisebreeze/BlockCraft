import * as THREE from 'three'

export class Player {
  constructor(camera, world) {
    this.camera = camera
    this.world = world

    // Position and movement
    this.position = new THREE.Vector3(0, 10, 0)
    this.velocity = new THREE.Vector3(0, 0, 0)
    this.onGround = false

    // Rotation
    this.yaw = 0
    this.pitch = 0

    // Movement settings
    this.speed = 5
    this.sprintSpeed = 8
    this.jumpForce = 8
    this.gravity = 20
    this.sensitivity = 0.002

    // Player dimensions
    this.width = 0.6
    this.height = 1.8
    this.eyeHeight = 1.62
    this.baseEyeHeight = 1.62
    this.sneakEyeHeight = 1.45 // Lower eye height when sneaking

    // Sneak toggle (for mobile)
    this.sneakToggled = false

    // Input state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      sneak: false,
      sprint: false
    }

    // Mobile input
    this.joystick = {
      active: false,
      x: 0,
      y: 0
    }

    // Flying mode
    this.flying = false
    this.flySpeed = 10

    // Pointer lock
    this.pointerLocked = false
  }

  setPosition(x, y, z) {
    this.position.set(x, y, z)
    this.updateCamera()
  }

  updateCamera() {
    this.camera.position.set(
      this.position.x,
      this.position.y + this.eyeHeight,
      this.position.z
    )
    this.camera.rotation.order = 'YXZ'
    this.camera.rotation.y = this.yaw
    this.camera.rotation.x = this.pitch
  }

  handleMouseMove(e) {
    if (!this.pointerLocked) return

    this.yaw -= e.movementX * this.sensitivity
    this.pitch -= e.movementY * this.sensitivity

    // Clamp pitch
    this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch))
  }

  handleKeyDown(e) {
    switch (e.code) {
      case 'KeyW':
        this.keys.forward = true
        break
      case 'KeyS':
        this.keys.backward = true
        break
      case 'KeyA':
        this.keys.left = true
        break
      case 'KeyD':
        this.keys.right = true
        break
      case 'Space':
        this.keys.jump = true
        e.preventDefault()
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sneak = true
        break
      case 'ControlLeft':
      case 'ControlRight':
        this.keys.sprint = true
        break
      case 'KeyF':
        this.flying = !this.flying
        if (this.flying) {
          this.velocity.y = 0
        }
        break
    }
  }

  handleKeyUp(e) {
    switch (e.code) {
      case 'KeyW':
        this.keys.forward = false
        break
      case 'KeyS':
        this.keys.backward = false
        break
      case 'KeyA':
        this.keys.left = false
        break
      case 'KeyD':
        this.keys.right = false
        break
      case 'Space':
        this.keys.jump = false
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sneak = false
        break
      case 'ControlLeft':
      case 'ControlRight':
        this.keys.sprint = false
        break
    }
  }

  getForwardVector() {
    const vector = new THREE.Vector3(
      -Math.sin(this.yaw),
      0,
      -Math.cos(this.yaw)
    )
    return vector.normalize()
  }

  getRightVector() {
    const vector = new THREE.Vector3(
      Math.cos(this.yaw),
      0,
      -Math.sin(this.yaw)
    )
    return vector.normalize()
  }

  checkCollision(x, y, z) {
    const hw = this.width / 2

    // Calculate block range to check
    const minX = Math.floor(x - hw)
    const maxX = Math.floor(x + hw)
    const minY = Math.floor(y)
    const maxY = Math.floor(y + this.height)
    const minZ = Math.floor(z - hw)
    const maxZ = Math.floor(z + hw)

    for (let bx = minX; bx <= maxX; bx++) {
      for (let by = minY; by <= maxY; by++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
          if (this.world.isSolid(bx, by, bz)) {
            // Check AABB overlap
            const blockMin = { x: bx, y: by, z: bz }
            const blockMax = { x: bx + 1, y: by + 1, z: bz + 1 }
            const playerMin = { x: x - hw, y: y, z: z - hw }
            const playerMax = { x: x + hw, y: y + this.height, z: z + hw }

            if (playerMin.x < blockMax.x && playerMax.x > blockMin.x &&
                playerMin.y < blockMax.y && playerMax.y > blockMin.y &&
                playerMin.z < blockMax.z && playerMax.z > blockMin.z) {
              return true
            }
          }
        }
      }
    }
    return false
  }

  // Check if player has ground support at given position (for sneak edge detection)
  hasGroundSupport(x, z) {
    const hw = this.width / 2
    const feetY = Math.floor(this.position.y - 0.01) // Just below player feet

    // Check all four corners of player's base
    const corners = [
      { x: x - hw + 0.01, z: z - hw + 0.01 },
      { x: x + hw - 0.01, z: z - hw + 0.01 },
      { x: x - hw + 0.01, z: z + hw - 0.01 },
      { x: x + hw - 0.01, z: z + hw - 0.01 }
    ]

    for (const corner of corners) {
      const bx = Math.floor(corner.x)
      const bz = Math.floor(corner.z)
      if (this.world.isSolid(bx, feetY, bz)) {
        return true
      }
    }

    return false
  }

  update(deltaTime) {
    // Update eye height based on sneak state
    const isSneaking = this.keys.sneak || this.sneakToggled
    const targetEyeHeight = isSneaking ? this.sneakEyeHeight : this.baseEyeHeight
    // Smooth transition
    this.eyeHeight += (targetEyeHeight - this.eyeHeight) * Math.min(1, deltaTime * 10)

    if (this.flying) {
      this.updateFlying(deltaTime)
    } else {
      this.updateNormal(deltaTime)
    }
    this.updateCamera()
  }

  updateNormal(deltaTime) {
    const speed = this.keys.sprint ? this.sprintSpeed : this.speed
    const forward = this.getForwardVector()
    const right = this.getRightVector()

    // Calculate movement direction
    const moveDir = new THREE.Vector3(0, 0, 0)

    // Keyboard input (binary)
    if (this.keys.forward) moveDir.add(forward)
    if (this.keys.backward) moveDir.sub(forward)
    if (this.keys.left) moveDir.sub(right)
    if (this.keys.right) moveDir.add(right)

    // Joystick input (analog) - uses actual joystick values for smooth direction control
    const joystickDeadzone = 0.12
    if (this.joystick.active) {
      const jx = Math.abs(this.joystick.x) > joystickDeadzone ? this.joystick.x : 0
      const jy = Math.abs(this.joystick.y) > joystickDeadzone ? this.joystick.y : 0

      if (jx !== 0 || jy !== 0) {
        // Joystick Y: negative = forward, positive = backward
        // Joystick X: positive = right, negative = left
        moveDir.addScaledVector(forward, -jy)
        moveDir.addScaledVector(right, jx)
      }
    }

    // Normalize direction if moving
    if (moveDir.length() > 0) {
      moveDir.normalize()
    }

    // Calculate speed multiplier
    let speedMultiplier = 1.0
    if (this.joystick.active) {
      const magnitude = Math.min(1, Math.sqrt(this.joystick.x ** 2 + this.joystick.y ** 2))
      if (magnitude > joystickDeadzone) {
        speedMultiplier = (magnitude - joystickDeadzone) / (1 - joystickDeadzone)
      } else {
        speedMultiplier = 0
      }
    }

    // Apply gravity
    this.velocity.y -= this.gravity * deltaTime

    // Jump
    if (this.keys.jump && this.onGround) {
      this.velocity.y = this.jumpForce
      this.onGround = false
    }

    // Apply movement
    const moveX = moveDir.x * speed * speedMultiplier * deltaTime
    const moveZ = moveDir.z * speed * speedMultiplier * deltaTime
    const moveY = this.velocity.y * deltaTime

    // Move X
    const newX = this.position.x + moveX
    if (!this.checkCollision(newX, this.position.y, this.position.z)) {
      // Sneak edge protection: don't walk off edges when sneaking and on ground
      if ((this.keys.sneak || this.sneakToggled) && this.onGround) {
        if (this.hasGroundSupport(newX, this.position.z)) {
          this.position.x = newX
        }
      } else {
        this.position.x = newX
      }
    } else {
      // Auto step up 1 block when on ground and not sneaking
      if (this.onGround && !(this.keys.sneak || this.sneakToggled)) {
        const maxStep = 1.01
        // Find the highest step we can make
        for (let step = maxStep; step > 0.1; step -= 0.1) {
          const stepY = this.position.y + step
          if (!this.checkCollision(newX, stepY, this.position.z)) {
            this.position.x = newX
            // Small initial lift to avoid getting stuck
            this.position.y += 0.05
            // Jump velocity for natural step climbing animation
            this.velocity.y = 6.5
            this.onGround = false
            break
          }
        }
      }
      this.velocity.x = 0
    }

    // Move Z
    const newZ = this.position.z + moveZ
    if (!this.checkCollision(this.position.x, this.position.y, newZ)) {
      // Sneak edge protection: don't walk off edges when sneaking and on ground
      if ((this.keys.sneak || this.sneakToggled) && this.onGround) {
        if (this.hasGroundSupport(this.position.x, newZ)) {
          this.position.z = newZ
        }
      } else {
        this.position.z = newZ
      }
    } else {
      // Auto step up 1 block when on ground and not sneaking
      if (this.onGround && !(this.keys.sneak || this.sneakToggled)) {
        const maxStep = 1.01
        // Find the highest step we can make
        for (let step = maxStep; step > 0.1; step -= 0.1) {
          const stepY = this.position.y + step
          if (!this.checkCollision(this.position.x, stepY, newZ)) {
            this.position.z = newZ
            // Small initial lift to avoid getting stuck
            this.position.y += 0.05
            // Jump velocity for natural step climbing animation
            this.velocity.y = 6.5
            this.onGround = false
            break
          }
        }
      }
      this.velocity.z = 0
    }

    // Move Y
    const newY = this.position.y + moveY
    if (!this.checkCollision(this.position.x, newY, this.position.z)) {
      this.position.y = newY
      this.onGround = false
    } else {
      if (moveY < 0) {
        this.onGround = true
      }
      this.velocity.y = 0
    }

    // Check if fallen out of world
    if (this.position.y < -10) {
      const spawn = this.world.getSpawnPosition()
      this.setPosition(spawn.x, spawn.y, spawn.z)
      this.velocity.set(0, 0, 0)
    }
  }

  updateFlying(deltaTime) {
    const speed = this.flySpeed
    const forward = this.getForwardVector()
    const right = this.getRightVector()

    const moveDir = new THREE.Vector3(0, 0, 0)

    // Keyboard input (binary)
    if (this.keys.forward) moveDir.add(forward)
    if (this.keys.backward) moveDir.sub(forward)
    if (this.keys.left) moveDir.sub(right)
    if (this.keys.right) moveDir.add(right)

    // Joystick input (analog) - uses actual joystick values for smooth direction control
    const joystickDeadzone = 0.12
    if (this.joystick.active) {
      const jx = Math.abs(this.joystick.x) > joystickDeadzone ? this.joystick.x : 0
      const jy = Math.abs(this.joystick.y) > joystickDeadzone ? this.joystick.y : 0

      if (jx !== 0 || jy !== 0) {
        moveDir.addScaledVector(forward, -jy)
        moveDir.addScaledVector(right, jx)
      }
    }

    // Normalize horizontal direction
    if (moveDir.length() > 0) {
      moveDir.normalize()
    }

    // Calculate speed multiplier for joystick
    let speedMultiplier = 1.0
    if (this.joystick.active) {
      const magnitude = Math.min(1, Math.sqrt(this.joystick.x ** 2 + this.joystick.y ** 2))
      if (magnitude > joystickDeadzone) {
        speedMultiplier = (magnitude - joystickDeadzone) / (1 - joystickDeadzone)
      } else {
        speedMultiplier = 0
      }
    }

    // Vertical movement
    if (this.keys.jump) {
      moveDir.y = 1
    }
    if (this.keys.sneak) {
      moveDir.y = -1
    }

    // Apply movement with collision detection
    const moveX = moveDir.x * speed * speedMultiplier * deltaTime
    const moveZ = moveDir.z * speed * speedMultiplier * deltaTime
    const moveY = moveDir.y * speed * deltaTime

    // Move X
    const newX = this.position.x + moveX
    if (!this.checkCollision(newX, this.position.y, this.position.z)) {
      this.position.x = newX
    }

    // Move Z
    const newZ = this.position.z + moveZ
    if (!this.checkCollision(this.position.x, this.position.y, newZ)) {
      this.position.z = newZ
    }

    // Move Y
    const newY = this.position.y + moveY
    if (!this.checkCollision(this.position.x, newY, this.position.z)) {
      this.position.y = newY
    }

    // Check if fallen out of world
    if (this.position.y < -10) {
      const spawn = this.world.getSpawnPosition()
      this.setPosition(spawn.x, spawn.y, spawn.z)
    }
  }

  getLookDirection() {
    const direction = new THREE.Vector3(0, 0, -1)
    direction.applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'))
    return direction.normalize()
  }
}
