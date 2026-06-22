import { useRef, useState } from 'react'

function Joystick({ onMove, onStart, onEnd }) {
  const joystickRef = useRef(null)
  const [active, setActive] = useState(false)
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 })
  const touchIdRef = useRef(null)

  const joystickRadius = 50
  const joystickMaxRadius = 75

  const handleStart = (e) => {
    e.preventDefault()
    const touch = e.touches ? e.touches[0] : e
    touchIdRef.current = e.touches ? touch.identifier : 'mouse'
    setActive(true)
    onStart?.()
    updatePosition(touch)
  }

  const handleMove = (e) => {
    if (!active) return
    e.preventDefault()

    let touch
    if (e.touches) {
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === touchIdRef.current) {
          touch = e.touches[i]
          break
        }
      }
    } else {
      touch = e
    }

    if (!touch) return
    updatePosition(touch)
  }

  const handleEnd = (e) => {
    if (!active) return
    e.preventDefault()

    if (e.changedTouches) {
      let found = false
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          found = true
          break
        }
      }
      if (!found) return
    }

    setActive(false)
    setKnobPos({ x: 0, y: 0 })
    touchIdRef.current = null
    onEnd?.()
    onMove?.(0, 0, false)
  }

  const updatePosition = (touch) => {
    if (!joystickRef.current) return

    const rect = joystickRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    let dx = touch.clientX - centerX
    let dy = touch.clientY - centerY

    const dist = Math.sqrt(dx * dx + dy * dy)

    // Clamp to max radius
    if (dist > joystickMaxRadius) {
      dx = (dx / dist) * joystickMaxRadius
      dy = (dy / dist) * joystickMaxRadius
    }

    setKnobPos({ x: dx, y: dy })

    // Normalize based on normal radius
    const normalizedX = dx / joystickRadius
    const normalizedY = dy / joystickRadius
    const normalizedDist = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY)

    const sprinting = normalizedDist >= 1.0

    // Apply dead zone
    const deadzone = 0.12
    let finalX = normalizedX
    let finalY = normalizedY

    if (normalizedDist < deadzone) {
      finalX = 0
      finalY = 0
    } else {
      const scale = (normalizedDist - deadzone) / (1 - deadzone)
      finalX = (normalizedX / normalizedDist) * scale
      finalY = (normalizedY / normalizedDist) * scale
    }

    onMove?.(finalX, finalY, sprinting)
  }

  return (
    <div
      id="joystick-area"
      ref={joystickRef}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      <div id="joystick-frame" className="joystick-frame">
        <div
          id="joystick-knob"
          className="joystick-knob"
          style={{
            transform: `translate(calc(-50% + ${knobPos.x}px), calc(-50% + ${knobPos.y}px))`
          }}
        />
      </div>
    </div>
  )
}

export default Joystick
