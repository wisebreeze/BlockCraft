function StartScreen({ onStart }) {
  return (
    <div id="start-screen" className="start-screen">
      <div className="start-content">
        <h1 className="game-title">BlockCraft</h1>
        <p className="game-subtitle">A Minecraft-inspired voxel game</p>
        <button className="start-button" onClick={onStart}>
          Click to Start
        </button>
        <div className="controls-info">
          <p><strong>Desktop:</strong> WASD to move, Mouse to look, Click to break/place</p>
          <p><strong>Mobile:</strong> Joystick to move, Touch to look, Tap to place, Long press to break</p>
        </div>
      </div>
    </div>
  )
}

export default StartScreen
