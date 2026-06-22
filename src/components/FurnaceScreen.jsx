import { useState, useEffect, useRef } from 'react'
import { getSmeltingResult, getFuelValue } from '../game/Crafting.js'
import { isBlockItem, getItemDisplayImageURL } from '../game/BlockTypes.js'

function FurnaceScreen({ game, onClose }) {
  const [inventory, setInventory] = useState([])
  const [inputSlot, setInputSlot] = useState({ type: null, count: 0 })
  const [fuelSlot, setFuelSlot] = useState({ type: null, count: 0 })
  const [outputSlot, setOutputSlot] = useState({ type: null, count: 0 })
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [previews, setPreviews] = useState({})
  const [smeltProgress, setSmeltProgress] = useState(0) // 0-100
  const [fuelProgress, setFuelProgress] = useState(0) // 0-100
  const [currentFuelTime, setCurrentFuelTime] = useState(0)
  const [maxFuelTime, setMaxFuelTime] = useState(0)

  const animationRef = useRef(null)
  const lastTimeRef = useRef(0)

  useEffect(() => {
    if (game) {
      setInventory([...game.inventory])
    }
  }, [game])

  // Load item previews
  useEffect(() => {
    if (!game) return

    const loadPreviews = async () => {
      const newPreviews = {}
      const allItems = new Set()

      for (const item of inventory) {
        if (item.type != null) {
          allItems.add(item.type)
        }
      }

      if (inputSlot.type != null) allItems.add(inputSlot.type)
      if (fuelSlot.type != null) allItems.add(fuelSlot.type)
      if (outputSlot.type != null) allItems.add(outputSlot.type)

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
  }, [inventory, inputSlot, fuelSlot, outputSlot, game])

  // Smelting animation loop
  useEffect(() => {
    const animate = (time) => {
      if (!lastTimeRef.current) lastTimeRef.current = time
      const deltaTime = (time - lastTimeRef.current) / 1000 // seconds
      lastTimeRef.current = time

      // Check if we can smelt
      const canSmelt = inputSlot.type != null &&
                       inputSlot.count > 0 &&
                       getSmeltingResult(inputSlot.type) &&
                       (outputSlot.type == null ||
                        (outputSlot.type === getSmeltingResult(inputSlot.type).result &&
                         outputSlot.count < 64))

      const hasFuel = currentFuelTime > 0 || (fuelSlot.type != null && fuelSlot.count > 0)

      if (canSmelt && hasFuel) {
        // Consume fuel if needed
        if (currentFuelTime <= 0 && fuelSlot.type != null && fuelSlot.count > 0) {
          const fuelVal = getFuelValue(fuelSlot.type)
          if (fuelVal > 0) {
            setMaxFuelTime(fuelVal)
            setCurrentFuelTime(fuelVal)
            setFuelSlot(prev => {
              const newCount = prev.count - 1
              return {
                type: newCount > 0 ? prev.type : null,
                count: newCount
              }
            })
          }
        }

        // Burn fuel
        if (currentFuelTime > 0) {
          setCurrentFuelTime(prev => Math.max(0, prev - deltaTime))
          setFuelProgress(currentFuelTime > 0 ? (currentFuelTime / maxFuelTime) * 100 : 0)

          // Progress smelting
          const smeltTime = getSmeltingResult(inputSlot.type)?.time || 10
          setSmeltProgress(prev => {
            const newProgress = prev + (deltaTime / smeltTime) * 100
            if (newProgress >= 100) {
              // Complete smelting
              const result = getSmeltingResult(inputSlot.type)
              if (result) {
                setOutputSlot(prev => {
                  if (prev.type == null) {
                    return { type: result.result, count: 1 }
                  } else if (prev.type === result.result) {
                    return { ...prev, count: prev.count + 1 }
                  }
                  return prev
                })
                setInputSlot(prev => {
                  const newCount = prev.count - 1
                  return {
                    type: newCount > 0 ? prev.type : null,
                    count: newCount
                  }
                })
              }
              return 0
            }
            return newProgress
          })
        }
      } else {
        // Reset progress if can't smelt
        setSmeltProgress(0)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [inputSlot, fuelSlot, outputSlot, currentFuelTime, maxFuelTime])

  // Handle slot clicks
  const handleSlotClick = (slotType) => {
    if (selectedSlot === null) {
      // Pick up from furnace slot
      let item = null
      if (slotType === 'input') item = inputSlot
      else if (slotType === 'fuel') item = fuelSlot
      else if (slotType === 'output') item = outputSlot

      if (item?.type != null) {
        setSelectedSlot({ type: slotType })
      }
    } else if (selectedSlot.type === 'inventory') {
      // Move from inventory to furnace slot
      const inventoryItem = inventory[selectedSlot.index]
      let targetSlot = null
      let setTarget = null

      if (slotType === 'input') {
        targetSlot = inputSlot
        setTarget = setInputSlot
      } else if (slotType === 'fuel') {
        // Only fuel items can go in fuel slot
        if (getFuelValue(inventoryItem.type) <= 0) {
          setSelectedSlot(null)
          return
        }
        targetSlot = fuelSlot
        setTarget = setFuelSlot
      } else if (slotType === 'output') {
        // Can't put items into output slot
        setSelectedSlot(null)
        return
      }

      if (targetSlot.type == null) {
        setTarget({ ...inventoryItem })
        const newInventory = [...inventory]
        newInventory[selectedSlot.index] = { type: null, count: 0 }
        setInventory(newInventory)
        if (game) {
          game.inventory = newInventory
          game.updateHotbarUI()
        }
      } else if (targetSlot.type === inventoryItem.type) {
        // Same type - swap for simplicity
        const temp = { ...targetSlot }
        setTarget({ ...inventoryItem })
        const newInventory = [...inventory]
        newInventory[selectedSlot.index] = temp
        setInventory(newInventory)
        if (game) {
          game.inventory = newInventory
          game.updateHotbarUI()
        }
      } else {
        // Different type - swap
        const temp = { ...targetSlot }
        setTarget({ ...inventoryItem })
        const newInventory = [...inventory]
        newInventory[selectedSlot.index] = temp
        setInventory(newInventory)
        if (game) {
          game.inventory = newInventory
          game.updateHotbarUI()
        }
      }

      setSelectedSlot(null)
    } else {
      // Swap within furnace slots (simplified)
      setSelectedSlot(null)
    }
  }

  const handleInventorySlotClick = (index) => {
    if (selectedSlot === null) {
      if (inventory[index].type != null) {
        setSelectedSlot({ type: 'inventory', index })
      }
    } else if (selectedSlot.type === 'inventory') {
      if (selectedSlot.index !== index) {
        const newInventory = [...inventory]
        const temp = { ...newInventory[index] }
        newInventory[index] = { ...newInventory[selectedSlot.index] }
        newInventory[selectedSlot.index] = temp
        setInventory(newInventory)
        if (game) {
          game.inventory = newInventory
          game.updateHotbarUI()
        }
      }
      setSelectedSlot(null)
    } else {
      // Move from furnace to inventory
      let furnaceItem = null
      let setFurnaceSlot = null

      if (selectedSlot.type === 'input') {
        furnaceItem = inputSlot
        setFurnaceSlot = setInputSlot
      } else if (selectedSlot.type === 'fuel') {
        furnaceItem = fuelSlot
        setFurnaceSlot = setFuelSlot
      } else if (selectedSlot.type === 'output') {
        furnaceItem = outputSlot
        setFurnaceSlot = setOutputSlot
      }

      if (!furnaceItem) {
        setSelectedSlot(null)
        return
      }

      if (inventory[index].type == null) {
        const newInventory = [...inventory]
        newInventory[index] = { ...furnaceItem }
        setInventory(newInventory)
        setFurnaceSlot({ type: null, count: 0 })
        if (game) {
          game.inventory = newInventory
          game.updateHotbarUI()
        }
      } else {
        // Swap
        const temp = { ...inventory[index] }
        const newInventory = [...inventory]
        newInventory[index] = { ...furnaceItem }
        setInventory(newInventory)
        setFurnaceSlot(temp)
        if (game) {
          game.inventory = newInventory
          game.updateHotbarUI()
        }
      }

      setSelectedSlot(null)
    }
  }

  const mainInventory = inventory.slice(9, 36)
  const hotbarSlots = inventory.slice(0, 9)

  return (
    <div className="inventory-overlay" onClick={onClose}>
      <div className="inventory-screen furnace-screen" onClick={e => e.stopPropagation()}>
        <div className="inventory-header">
          <h2>Furnace</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Furnace UI */}
        <div className="furnace-section">
          <div className="furnace-layout">
            {/* Input slot */}
            <div
              className={`inventory-slot furnace-input-slot ${
                selectedSlot?.type === 'input' ? 'selected' : ''
              }`}
              onClick={() => handleSlotClick('input')}
            >
              {inputSlot.type != null && previews[inputSlot.type] && (
                <img src={previews[inputSlot.type]} alt="" className="item-preview" />
              )}
              {inputSlot.count > 1 && (
                <span className="slot-count">{inputSlot.count}</span>
              )}
            </div>

            {/* Arrow/progress */}
            <div className="furnace-progress">
              <div
                className="furnace-progress-fill"
                style={{ width: `${smeltProgress}%` }}
              />
              <span className="furnace-arrow">→</span>
            </div>

            {/* Output slot */}
            <div
              className={`inventory-slot furnace-output-slot ${
                selectedSlot?.type === 'output' ? 'selected' : ''
              }`}
              onClick={() => handleSlotClick('output')}
            >
              {outputSlot.type != null && previews[outputSlot.type] && (
                <img src={previews[outputSlot.type]} alt="" className="item-preview" />
              )}
              {outputSlot.count > 1 && (
                <span className="slot-count">{outputSlot.count}</span>
              )}
            </div>
          </div>

          {/* Fuel slot */}
          <div className="furnace-fuel-row">
            <div
              className={`inventory-slot furnace-fuel-slot ${
                selectedSlot?.type === 'fuel' ? 'selected' : ''
              }`}
              onClick={() => handleSlotClick('fuel')}
            >
              {fuelSlot.type != null && previews[fuelSlot.type] && (
                <img src={previews[fuelSlot.type]} alt="" className="item-preview" />
              )}
              {fuelSlot.count > 1 && (
                <span className="slot-count">{fuelSlot.count}</span>
              )}
            </div>
            <div className="furnace-fuel-bar">
              <div
                className="furnace-fuel-fill"
                style={{ height: `${fuelProgress}%` }}
              />
            </div>
          </div>
        </div>

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

export default FurnaceScreen
