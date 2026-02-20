"use client"

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { VAT_RATE } from "@/lib/constants"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CartItem {
  productId: string
  productName: string
  sku: string
  price: number
  quantity: number
  color: string
  size: string
  image: string
}

interface CartState {
  items: CartItem[]
  isHydrated: boolean
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { productId: string; color: string; size: string } }
  | { type: "UPDATE_QTY"; payload: { productId: string; color: string; size: string; quantity: number } }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; payload: CartItem[] }

/* ------------------------------------------------------------------ */
/*  Reducer                                                            */
/* ------------------------------------------------------------------ */

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const idx = state.items.findIndex(
        (i) =>
          i.productId === action.payload.productId &&
          i.color === action.payload.color &&
          i.size === action.payload.size
      )
      if (idx >= 0) {
        const updated = [...state.items]
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + action.payload.quantity,
        }
        return { ...state, items: updated }
      }
      return { ...state, items: [...state.items, action.payload] }
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter(
          (i) =>
            !(
              i.productId === action.payload.productId &&
              i.color === action.payload.color &&
              i.size === action.payload.size
            )
        ),
      }
    case "UPDATE_QTY": {
      const updated = state.items.map((i) =>
        i.productId === action.payload.productId &&
        i.color === action.payload.color &&
        i.size === action.payload.size
          ? { ...i, quantity: action.payload.quantity }
          : i
      )
      return { ...state, items: updated }
    }
    case "CLEAR":
      return { ...state, items: [] }
    case "HYDRATE":
      return { ...state, items: action.payload, isHydrated: true }
    default:
      return state
  }
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotal: number
  vat: number
  total: number
  addItem: (item: CartItem) => void
  removeItem: (productId: string, color: string, size: string) => void
  updateQuantity: (productId: string, color: string, size: string, qty: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = "lenor-cart"

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isHydrated: false,
  })

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        dispatch({ type: "HYDRATE", payload: JSON.parse(stored) })
      } else {
        dispatch({ type: "HYDRATE", payload: [] })
      }
    } catch {
      dispatch({ type: "HYDRATE", payload: [] })
    }
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (state.isHydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    }
  }, [state.items, state.isHydrated])

  const addItem = useCallback(
    (item: CartItem) => dispatch({ type: "ADD_ITEM", payload: item }),
    []
  )

  const removeItem = useCallback(
    (productId: string, color: string, size: string) =>
      dispatch({ type: "REMOVE_ITEM", payload: { productId, color, size } }),
    []
  )

  const updateQuantity = useCallback(
    (productId: string, color: string, size: string, quantity: number) =>
      dispatch({ type: "UPDATE_QTY", payload: { productId, color, size, quantity } }),
    []
  )

  const clearCart = useCallback(() => dispatch({ type: "CLEAR" }), [])

  const itemCount = state.items.reduce((s, i) => s + i.quantity, 0)
  const subtotal = state.items.reduce((s, i) => s + i.price * i.quantity, 0)
  const vat = subtotal * VAT_RATE
  const total = subtotal + vat

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        itemCount,
        subtotal,
        vat,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
