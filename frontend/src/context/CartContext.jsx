import { createContext, useContext, useEffect, useMemo, useState } from 'react'

/*
 * CartContext keeps the shopping cart in localStorage so a page refresh (or a
 * trip to another page) does not lose the basket.
 *
 * The cart holds a *reference* to each medicine plus a quantity:
 *   { medicineId, name, price, quantity, stockQuantity }
 *
 * It stores the price only so the UI can show a running total immediately.
 * The backend recalculates everything on POST /api/orders, so a tampered
 * localStorage cannot change what is actually charged.
 */

const CartContext = createContext(null)
const STORAGE_KEY = 'cart'

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (medicine, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((i) => i.medicineId === medicine.id)

      if (existing) {
        // Never let the cart exceed what the pharmacy actually has in stock.
        const nextQuantity = Math.min(
          existing.quantity + quantity,
          medicine.stockQuantity,
        )
        return current.map((i) =>
          i.medicineId === medicine.id ? { ...i, quantity: nextQuantity } : i,
        )
      }

      return [
        ...current,
        {
          medicineId: medicine.id,
          name: medicine.name,
          category: medicine.category,
          price: Number(medicine.price),
          stockQuantity: medicine.stockQuantity,
          quantity: Math.min(quantity, medicine.stockQuantity),
        },
      ]
    })
  }

  const updateQuantity = (medicineId, quantity) => {
    setItems((current) =>
      current.map((item) =>
        item.medicineId === medicineId
          ? {
              ...item,
              quantity: Math.max(1, Math.min(quantity, item.stockQuantity)),
            }
          : item,
      ),
    )
  }

  const removeItem = (medicineId) => {
    setItems((current) => current.filter((i) => i.medicineId !== medicineId))
  }

  const clearCart = () => setItems([])

  // Backend wants this shape: [{ medicineId, quantity }]
  const toOrderItems = () =>
    items.map((item) => ({
      medicineId: item.medicineId,
      quantity: item.quantity,
    }))

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )

  const value = useMemo(
    () => ({
      items,
      itemCount,
      total,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      toOrderItems,
    }),
    [items, itemCount, total],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used inside <CartProvider>')
  }
  return context
}