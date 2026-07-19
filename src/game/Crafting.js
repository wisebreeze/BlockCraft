import { BlockTypes, ItemTypes } from './BlockTypes.js'

// Crafting recipes
// Each recipe has:
// - pattern: 2D array representing the crafting grid (null = empty, or item type)
// - result: { type: itemType, count: number }
// - size: 2 or 3 (2x2 or 3x3 grid)

// For shapeless recipes, we'll handle separately

// Shaped recipes (pattern must match exactly)
const shapedRecipes = [
  // 1 wood plank = 4 sticks (2 planks vertically)
  {
    size: 2,
    pattern: [
      [BlockTypes.PLANKS, null],
      [BlockTypes.PLANKS, null]
    ],
    result: { type: ItemTypes.STICK, count: 4 }
  },
  // Also horizontal (just in case)
  {
    size: 2,
    pattern: [
      [BlockTypes.PLANKS, BlockTypes.PLANKS],
      [null, null]
    ],
    result: { type: ItemTypes.STICK, count: 4 }
  },
  // 4 planks = 1 crafting table (fill 2x2)
  {
    size: 2,
    pattern: [
      [BlockTypes.PLANKS, BlockTypes.PLANKS],
      [BlockTypes.PLANKS, BlockTypes.PLANKS]
    ],
    result: { type: BlockTypes.CRAFTING_TABLE, count: 1 }
  },
  // 8 cobblestone = 1 furnace (fill 3x3 border)
  {
    size: 3,
    pattern: [
      [BlockTypes.COBBLESTONE, BlockTypes.COBBLESTONE, BlockTypes.COBBLESTONE],
      [BlockTypes.COBBLESTONE, null, BlockTypes.COBBLESTONE],
      [BlockTypes.COBBLESTONE, BlockTypes.COBBLESTONE, BlockTypes.COBBLESTONE]
    ],
    result: { type: BlockTypes.FURNACE, count: 1 }
  }
]

// Shapeless recipes (just count items)
const shapelessRecipes = [
  // 1 wood log = 4 wood planks
  {
    ingredients: [{ type: BlockTypes.WOOD, count: 1 }],
    result: { type: BlockTypes.PLANKS, count: 4 }
  }
]

// Check if a crafting grid matches a shaped recipe
function matchesShapedRecipe(grid, recipe) {
  const size = recipe.size
  const gridSize = grid.length

  // Try all positions in the grid where the recipe could fit
  for (let offsetX = 0; offsetX <= gridSize - size; offsetX++) {
    for (let offsetY = 0; offsetY <= gridSize - size; offsetY++) {
      let match = true
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const gridItem = grid[y + offsetY]?.[x + offsetX]?.type || null
          const recipeItem = recipe.pattern[y][x]
          if (gridItem !== recipeItem) {
            match = false
            break
          }
        }
        if (!match) break
      }
      if (match) {
        // Also check that there are no extra items outside the recipe area
        // Actually, for simplicity, we'll just check if the non-empty cells match
        // Let's also verify no extra items in the grid
        let hasExtra = false
        for (let y = 0; y < gridSize; y++) {
          for (let x = 0; x < gridSize; x++) {
            const inRecipe = x >= offsetX && x < offsetX + size &&
                             y >= offsetY && y < offsetY + size
            const gridItem = grid[y]?.[x]?.type || null
            if (!inRecipe && gridItem !== null) {
              hasExtra = true
              break
            }
          }
          if (hasExtra) break
        }
        if (!hasExtra) return true
      }
    }
  }
  return false
}

// Check if a crafting grid matches a shapeless recipe
function matchesShapelessRecipe(grid, recipe) {
  // Count items in grid
  const itemCounts = new Map()
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const item = grid[y][x]
      if (item && item.type !== null) {
        const count = itemCounts.get(item.type) || 0
        itemCounts.set(item.type, count + (item.count || 1))
      }
    }
  }

  // Check if all ingredients are present with correct counts
  for (const ingredient of recipe.ingredients) {
    const gridCount = itemCounts.get(ingredient.type) || 0
    if (gridCount < ingredient.count) return false
  }

  // Check that there are no extra items
  if (itemCounts.size !== recipe.ingredients.length) return false

  return true
}

// Get the crafting result for a given grid
export function getCraftingResult(grid) {
  const gridSize = grid.length

  // Check shaped recipes first
  for (const recipe of shapedRecipes) {
    if (recipe.size <= gridSize && matchesShapedRecipe(grid, recipe)) {
      return { ...recipe.result, recipe }
    }
  }

  // Check shapeless recipes
  for (const recipe of shapelessRecipes) {
    if (matchesShapelessRecipe(grid, recipe)) {
      return { ...recipe.result, recipe }
    }
  }

  return null
}

// Consume items from the crafting grid after crafting
// Returns the modified grid
export function consumeCraftingItems(grid) {
  const result = getCraftingResult(grid)
  if (!result) return grid

  const newGrid = grid.map(row => row.map(cell => ({ ...cell })))

  // For shapeless recipes, consume from first available slots
  if (result.recipe.ingredients) {
    for (const ingredient of result.recipe.ingredients) {
      let remaining = ingredient.count
      for (let y = 0; y < newGrid.length && remaining > 0; y++) {
        for (let x = 0; x < newGrid[y].length && remaining > 0; x++) {
          if (newGrid[y][x].type === ingredient.type && newGrid[y][x].count > 0) {
            const consume = Math.min(remaining, newGrid[y][x].count)
            newGrid[y][x].count -= consume
            remaining -= consume
            if (newGrid[y][x].count <= 0) {
              newGrid[y][x].type = null
              newGrid[y][x].count = 0
            }
          }
        }
      }
    }
  } else {
    // For shaped recipes, find the matching position and consume
    const size = result.recipe.size
    const gridSize = newGrid.length

    outer:
    for (let offsetY = 0; offsetY <= gridSize - size; offsetY++) {
      for (let offsetX = 0; offsetX <= gridSize - size; offsetX++) {
        // Check if this position matches
        let match = true
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const gridItem = newGrid[y + offsetY]?.[x + offsetX]?.type || null
            const recipeItem = result.recipe.pattern[y][x]
            if (gridItem !== recipeItem) {
              match = false
              break
            }
          }
          if (!match) break
        }

        if (match) {
          // Consume one from each non-empty slot in the pattern
          for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
              if (result.recipe.pattern[y][x] !== null) {
                const cell = newGrid[y + offsetY][x + offsetX]
                cell.count--
                if (cell.count <= 0) {
                  cell.type = null
                  cell.count = 0
                }
              }
            }
          }
          break outer
        }
      }
    }
  }

  return newGrid
}

// Smelting recipes (for furnace)
export const smeltingRecipes = {
  [BlockTypes.COBBLESTONE]: { result: BlockTypes.STONE, time: 10 },
  [BlockTypes.IRON_ORE]: { result: ItemTypes.IRON_INGOT, time: 10 },
  [BlockTypes.GOLD_ORE]: { result: ItemTypes.GOLD_INGOT, time: 10 }
}

// Fuel values (in seconds)
export const fuelValues = {
  [BlockTypes.WOOD]: 15,
  [BlockTypes.PLANKS]: 15,
  [ItemTypes.STICK]: 5,
  [ItemTypes.COAL]: 80
}

// Get fuel value for an item
export function getFuelValue(itemType) {
  return fuelValues[itemType] || 0
}

// Get smelting result for an item
export function getSmeltingResult(itemType) {
  return smeltingRecipes[itemType] || null
}
