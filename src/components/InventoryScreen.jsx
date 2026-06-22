import { useState, useEffect, useMemo } from 'react'
import { getCraftingResult, consumeCraftingItems } from '../game/Crafting.js'
import { isBlockItem, getItemDisplayImageURL, getBlockDisplayImageURL } from '../game/BlockTypes.js'

function InventoryScreen({ game, onClose }) {
  const [inventory, setInventory] = useState([])
  const [craftingGrid, setCraftingGrid] = useState([
    [{ type: null, count: 0 }, { type: null, count: 0 }],
    [{ type: null, count: 0 }, { type: null, count: 0 }]
  ])
  const [selectedSlot, setSelectedSlot] = useState(null) // For moving items
  const [previews, setPreviews] = useState({})

  // Load inventory from game
  useEffect(() => {
    if (game) {
      setInventory([...game.inventory])
    }
  }, [game])

  // Calculate crafting result
  const craftingResult = useMemo(() => {
    return getCraftingResult(craftingGrid)
  }, [craftingGrid])

  // Load item previews
  useEffect(() => {
    if (!game) return

    const loadPreviews = async () => {
      const newPreviews = {}
      const allItems = new Set()

      // Add inventory items
      for (const item of inventory) {
        if (item.type != null) {
          allItems.add(item.type)
        }
      }

      // Add crafting grid items
      for (const row of craftingGrid) {
        for (const item of row) {
          if (item.type != null) {
            allItems.add(item.type)
          }
        }
      }

      // Add result
      if (craftingResult?.type) {
        allItems.add(craftingResult.type)
      }

      for (const itemType of allItems) {
        try {
          if (isBlockItem(itemType) && game.getBlock3DPreviewURL) {
            const url = await game.getBlock3DPreviewURL(itemType)
            newPreviews[itemType] = url
          } else {
            const url = getItemDisplayImageURL(itemType)
            if (url) {
              newPreviews[itemType] = url
            }
          }
        } catch (e) {
          console.error('Failed to load preview:', e)
        }
      }

      setPreviews(newPreviews)
    }

    loadPreviews()
  }, [inventory, craftingGrid, craftingResult, game])

  // Handle slot click - move items between inventory and crafting
  const handleInventorySlotClick = (index) => {
    if (selectedSlot === null) {
      // Pick up item
      if (inventory[index].type != null) {
        setSelectedSlot({ type: 'inventory', index })
      }
    } else if (selectedSlot.type === 'inventory') {
      // Swap or move between inventory slots
      if (selectedSlot.index !== index) {
        const newInventory = [...inventory]
        const temp = { ...newInventory[index] }
        newInventory[index] = { ...newInventory[selectedSlot.index] }
        newInventory[selectedSlot.index] = temp
        setInventory(newInventory)
        // Update game inventory
        if (game) {
          game.inventory = newInventory
          game.updateHotbarUI()
        }
      }
      setSelectedSlot(null)
    } else if (selectedSlot.type === 'crafting') {
      // Move from crafting to inventory
      const newInventory = [...inventory]
      const craftingItem = craftingGrid[selectedSlot.row][selectedSlot.col]

      if (newInventory[index].type == null) {
        // Empty slot - move whole stack
        newInventory[index] = { ...craftingItem }
        const newGrid = craftingGrid.map(row => row.map(cell => ({ ...cell })))
        newGrid[selectedSlot.row][selectedSlot.col] = { type: null, count: 0 }
        setCraftingGrid(newGrid)
      } else if (newInventory[index].type === craftingItem.type) {
        // Same type - add to stack
        // For simplicity, just swap for now
        const temp = { ...newInventory[index] }
        newInventory[index] = { ...craftingItem }
        const newGrid = craftingGrid.map(row => row.map(cell => ({ ...cell })))
        newGrid[selectedSlot.row][selectedSlot.col] = temp
        setCraftingGrid(newGrid)
      } else {
        // Different type - swap
        const temp = { ...newInventory[index] }
        newInventory[index] = { ...craftingItem }
        const newGrid = craftingGrid.map(row => row.map(cell => ({ ...cell })))
        newGrid[selectedSlot.row][selectedSlot.col] = temp
        setCraftingGrid(newGrid)
      }

      setInventory(newInventory)
      if (game) {
        game.inventory = newInventory
        game.updateHotbarUI()
      }
      setSelectedSlot(null)
    }
  }

  // Handle crafting grid click
  const handleCraftingSlotClick = (row, col) => {
    if (selectedSlot === null) {
      // Pick up item from crafting
      if (craftingGrid[row][col].type != null) {
        setSelectedSlot({ type: 'crafting', row, col })
      }
    } else if (selectedSlot.type === 'inventory') {
      // Move from inventory to crafting
      const inventoryItem = inventory[selectedSlot.index]
      const newGrid = craftingGrid.map(r => r.map(cell => ({ ...cell })))

      if (newGrid[row][col].type == null) {
        // Empty slot
        newGrid[row][col] = { ...inventoryItem }
        const newInventory = [...inventory]
        newInventory[selectedSlot.index] = { type: null, count: 0 }
        setInventory(newInventory)
        if (game) {
          game.inventory = newInventory
          game.updateHotbarUI()
        }
      } else if (newGrid[row][col].type === inventoryItem.type) {
        // Same type - swap for simplicity
        const temp = { ...newGrid[row][col] }
        newGrid[row][col] = { ...inventoryItem }
        const newInventory = [...inventory]
        newInventory[selectedSlot.index] = temp
        setInventory(newInventory)
        if (game) {
          game.inventory = newInventory
          game.updateHotbarUI()
        }
      } else {
        // Different type - swap
        const temp = { ...newGrid[row][col] }
        newGrid[row][col] = { ...inventoryItem }
        const newInventory = [...inventory]
        newInventory[selectedSlot.index] = temp
        setInventory(newInventory)
        if (game) {
          game.inventory = newInventory
          game.updateHotbarUI()
        }
      }

      setCraftingGrid(newGrid)
      setSelectedSlot(null)
    } else if (selectedSlot.type === 'crafting') {
      // Swap within crafting grid
      if (selectedSlot.row !== row || selectedSlot.col !== col) {
        const newGrid = craftingGrid.map(r => r.map(cell => ({ ...cell })))
        const temp = { ...newGrid[row][col] }
        newGrid[row][col] = { ...newGrid[selectedSlot.row][selectedSlot.col] }
        newGrid[selectedSlot.row][selectedSlot.col] = temp
        setCraftingGrid(newGrid)
      }
      setSelectedSlot(null)
    }
  }

  // Handle crafting result click
  const handleCraftingResultClick = () => {
    if (!craftingResult) return

    // Try to add result to inventory
    const newInventory = [...inventory]
    let added = false

    // First try to stack
    for (let i = 0; i < newInventory.length; i++) {
      if (newInventory[i].type === craftingResult.type) {
        newInventory[i].count += craftingResult.count
        added = true
        break
      }
    }

    // Then try empty slot
    if (!added) {
      for (let i = 0; i < newInventory.length; i++) {
        if (newInventory[i].type == null) {
          newInventory[i] = { type: craftingResult.type, count: craftingResult.count }
          added = true
          break
        }
      }
    }

    if (added) {
      // Consume crafting items
      const newGrid = consumeCraftingItems(craftingGrid)
      setCraftingGrid(newGrid)
      setInventory(newInventory)
      if (game) {
        game.inventory = newInventory
        game.updateHotbarUI()
      }
    }
  }

  // Get main inventory slots (9-35)
  const mainInventory = inventory.slice(9, 36)
  const hotbarSlots = inventory.slice(0, 9)

  return (
    <div className="inventory-overlay" onClick={onClose}>
      <div className="inventory-screen" onClick={e => e.stopPropagation()}>
        <div className="inventory-header">
          <h2>Inventory</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Crafting area */}
        <div className="crafting-section">
          <div className="crafting-grid-2x2">
            {craftingGrid.map((row, rowIndex) => (
              row.map((item, colIndex) => (
                <div
                  key={`craft-${rowIndex}-${colIndex}`}
                  className={`inventory-slot crafting-slot ${
                    selectedSlot?.type === 'crafting' &&
                    selectedSlot.row === rowIndex &&
                    selectedSlot.col === colIndex ? 'selected' : ''
                  }`}
                  onClick={() => handleCraftingSlotClick(rowIndex, colIndex)}
                >
                  {item.type != null && previews[item.type] && (
                    <img src={previews[item.type]} alt="" className="item-preview" />
                  )}
                  {item.count > 1 && (
                    <span className="slot-count">{item.count}</span>
                  )}
                </div>
              ))
            ))}
          </div>

          <div className="crafting-arrow">→</div>

          <div
            className={`inventory-slot result-slot ${craftingResult ? 'has-result' : ''}`}
            onClick={handleCraftingResultClick}
          >
            {craftingResult && previews[craftingResult.type] && (
              <img src={previews[craftingResult.type]} alt="" className="item-preview" />
            )}
            {craftingResult && craftingResult.count > 1 && (
              <span className="slot-count">{craftingResult.count}</span>
            )}
          </div>
        </div>

        {/* Main inventory */}
        <div className="main-inventory-section">
          <h3>Inventory</h3>
          <div className="inventory-grid-3x9">
            {mainInventory.map((item, index) => (
              <div
                key={`inv-${index}`}
                className={`inventory-slot ${
                  selectedSlot?.type === 'inventory' &&
                  selectedSlot.index === index + 9 ? 'selected' : ''
                }`}
                onClick={() => handleInventorySlotClick(index + 9)}
              >
                {item.type != null && previews[item.type] && (
                  <img src={previews[item.type]} alt="" className="item-preview" />
                )}
                {item.count > 1 && (
                  <span className="slot-count">{item.count}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hotbar */}
        <div className="hotbar-section">
          <h3>Hotbar</h3>
          <div className="inventory-grid-1x9">
            {hotbarSlots.map((item, index) => (
              <div
                key={`hotbar-${index}`}
                className={`inventory-slot ${
                  selectedSlot?.type === 'inventory' &&
                  selectedSlot.index === index ? 'selected' : ''
                }`}
                onClick={() => handleInventorySlotClick(index)}
              >
                {item.type != null && previews[item.type] && (
                  <img src={previews[item.type]} alt="" className="item-preview" />
                )}
                <span className="slot-number">{index + 1}</span>
                {item.count > 1 && (
                  <span className="slot-count">{item.count}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default InventoryScreen
