import { useState, useEffect } from 'react'

function Hotbar({ inventory, selectedSlot, onSlotSelect, game, onOpenInventory }) {
  const [previews, setPreviews] = useState({})

  useEffect(() => {
    if (!game) return
    const loadPreviews = async () => {
      const newPreviews = {}
      for (let i = 0; i < inventory.length; i++) {
        const item = inventory[i]
        if (item.type != null && game.getBlock3DPreviewURL) {
          try {
            const url = await game.getBlock3DPreviewURL(item.type)
            newPreviews[item.type] = url
          } catch (e) {
            console.error('Failed to load preview:', e)
          }
        }
      }
      setPreviews(newPreviews)
    }
    loadPreviews()
  }, [inventory, game])

  return (
    <div id="hotbar" className="hotbar">
      {inventory.map((item, index) => (
        <div
          key={index}
          className={`hotbar-slot ${selectedSlot === index ? 'selected' : ''}`}
          onClick={() => onSlotSelect(index)}
        >
          {item.type != null && previews[item.type] && (
            <img src={previews[item.type]} alt="" className="block-preview-3d" />
          )}
          <span className="slot-number">{index + 1}</span>
          {item.count > 1 && (
            <span className="slot-count">{item.count}</span>
          )}
        </div>
      ))}
      <div className="hotbar-more-btn" onClick={onOpenInventory}>
        <span>⋯</span>
      </div>
    </div>
  )
}

export default Hotbar
