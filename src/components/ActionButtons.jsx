import { useRef } from 'react'

function ActionButtons({ isFlying, onJump, onJumpEnd, onSneak, onSneakEnd, onDoubleTapJump, sneakToggled }) {
  const lastTapRef = useRef(0)

  const handleJumpStart = (e) => {
    e.preventDefault()
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      onDoubleTapJump?.()
    }
    lastTapRef.current = now
    onJump?.()
  }

  const handleJumpEnd = (e) => {
    e.preventDefault()
    onJumpEnd?.()
  }

  const handleSneakStart = (e) => {
    e.preventDefault()
    onSneak?.()
  }

  const handleSneakEnd = (e) => {
    e.preventDefault()
    onSneakEnd?.()
  }

  return (
    <div id="action-buttons" className="action-buttons">
      <button
        className={`action-btn ${isFlying ? 'btn-fly-up' : 'btn-jump'}`}
        onTouchStart={handleJumpStart}
        onTouchEnd={handleJumpEnd}
        onTouchCancel={handleJumpEnd}
        onMouseDown={handleJumpStart}
        onMouseUp={handleJumpEnd}
        onMouseLeave={handleJumpEnd}
      />
      <button
        className={`action-btn ${isFlying ? 'btn-fly-down' : 'btn-sneak'} ${sneakToggled ? 'sneak-active' : ''}`}
        onTouchStart={handleSneakStart}
        onTouchEnd={handleSneakEnd}
        onTouchCancel={handleSneakEnd}
        onMouseDown={handleSneakStart}
        onMouseUp={handleSneakEnd}
        onMouseLeave={handleSneakEnd}
      />
    </div>
  )
}

export default ActionButtons
