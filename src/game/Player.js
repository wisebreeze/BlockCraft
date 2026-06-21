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

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = 0; dy <= Math.ceil(this.height); dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const bx = Math.floor(x + dx * hw)
          const by = Math.floor(y + dy)
          const bz = Math.floor(z + dz * hw)

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

  update(deltaTime) {
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
      this.position.x = newX
    } else {
      this.velocity.x = 0
    }

    // Move Z
    const newZ = this.position.z + moveZ
    if (!this.checkCollision(this.position.x, this.position.y, newZ)) {
      this.position.z = newZ
    } else {
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
