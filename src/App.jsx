import { useState, useEffect } from 'react'
import Hotbar from './components/Hotbar.jsx'
import Joystick from './components/Joystick.jsx'
import ActionButtons from './components/ActionButtons.jsx'
import Crosshair from './components/Crosshair.jsx'

function App({ game }) {
  const [inventory, setInventory] = useState(
    Array(9).fill(null).map(() => ({ type: null, count: 0 }))
  )
  const [selectedSlot, setSelectedSlot] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isFlying, setIsFlying] = useState(false)
  const [sneakToggled, setSneakToggled] = useState(false)

  useEffect(() => {
    // Check if mobile
    setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0)

    if (!game) return

    // Set up callbacks
    game.onInventoryChange = (inv) => {
      setInventory(inv.map(item => ({ ...item })))
    }

    game.onSlotChange = (slot) => {
      setSelectedSlot(slot)
    }

    game.onFlightChange = (flying) => {
      setIsFlying(flying)
      if (flying) {
        setSneakToggled(false)
      }
    }

    // Initial state
    setInventory(game.inventory.map(item => ({ ...item })))
    setSelectedSlot(game.selectedSlot ?? game.selectedBlockIndex ?? 0)
    setIsFlying(game.player?.flying || false)
  }, [game])

  // Poll sneak toggled state
  useEffect(() => {
    if (!game) return
    const interval = setInterval(() => {
      if (game.player) {
        setSneakToggled(game.player.sneakToggled || false)
      }
    }, 100)
    return () => clearInterval(interval)
  }, [game])

  const handleSlotSelect = (index) => {
    if (game) {
      game.selectBlock?.(index)
    }
  }

  const handleJoystickMove = (x, y, sprinting) => {
    if (game?.player) {
      game.player.joystick.x = x
      game.player.joystick.y = y
      game.player.joystick.sprint = sprinting
    }
  }

  const handleJoystickStart = () => {
    if (game?.player) {
      game.player.joystick.active = true
    }
  }

  const handleJoystickEnd = () => {
    if (game?.player) {
      game.player.joystick.active = false
      game.player.joystick.x = 0
      game.player.joystick.y = 0
      game.player.joystick.sprint = false
    }
  }

  const handleJump = () => {
    if (game?.player) {
      game.player.keys.jump = true
    }
  }

  const handleJumpEnd = () => {
    if (game?.player) {
      game.player.keys.jump = false
    }
  }

  const handleSneak = () => {
    if (game?.player) {
      if (game.player.flying) {
        game.player.keys.sneak = true
      } else {
        game.player.sneakToggled = !game.player.sneakToggled
        setSneakToggled(game.player.sneakToggled)
      }
    }
  }

  const handleSneakEnd = () => {
    if (game?.player) {
      if (game.player.flying) {
        game.player.keys.sneak = false
      }
    }
  }

  const handleDoubleTapJump = () => {
    if (game) {
      game.toggleFlight?.()
    }
  }

  return (
    <>
      <Crosshair />
      <Hotbar
        inventory={inventory}
        selectedSlot={selectedSlot}
        onSlotSelect={handleSlotSelect}
        game={game}
      />

      {isMobile && (
        <>
          <Joystick
            onMove={handleJoystickMove}
            onStart={handleJoystickStart}
            onEnd={handleJoystickEnd}
          />
          <ActionButtons
            isFlying={isFlying}
            onJump={handleJump}
            onJumpEnd={handleJumpEnd}
            onSneak={handleSneak}
            onSneakEnd={handleSneakEnd}
            onDoubleTapJump={handleDoubleTapJump}
            sneakToggled={sneakToggled}
          />
        </>
      )}
    </>
  )
}

export default App
