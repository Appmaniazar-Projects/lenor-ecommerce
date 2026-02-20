"use client"

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface QuoteBasketItem {
  productId: string
  productName: string
  sku: string
  price: number
  quantity: number
  color: string
  size: string
  image: string
  brandingNotes: string
  brandingPosition: string
}

interface QuoteState {
  items: QuoteBasketItem[]
  isHydrated: boolean
}

type QuoteAction =
  | { type: "ADD_ITEM"; payload: QuoteBasketItem }
  | { type: "REMOVE_ITEM"; payload: { productId: string; color: string; size: string } }
  | { type: "UPDATE_ITEM"; payload: Partial<QuoteBasketItem> & { productId: string; color: string; size: string } }
  | { type: "UPDATE_QTY"; payload: { productId: string; color: string; size: string; quantity: number } }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; payload: QuoteBasketItem[] }

/* ------------------------------------------------------------------ */
/*  Reducer                                                            */
/* ------------------------------------------------------------------ */

function quoteReducer(state: QuoteState, action: QuoteAction): QuoteState {
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
    case "UPDATE_ITEM": {
      const updated = state.items.map((i) =>
        i.productId === action.payload.productId &&
        i.color === action.payload.color &&
        i.size === action.payload.size
          ? { ...i, ...action.payload }
          : i
      )
      return { ...state, items: updated }
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

interface QuoteContextValue {
  items: QuoteBasketItem[]
  itemCount: number
  estimatedSubtotal: number
  addItem: (item: QuoteBasketItem) => void
  removeItem: (productId: string, color: string, size: string) => void
  updateItem: (update: Partial<QuoteBasketItem> & { productId: string; color: string; size: string }) => void
  updateQuantity: (productId: string, color: string, size: string, qty: number) => void
  clearQuote: () => void
}

const QuoteContext = createContext<QuoteContextValue | null>(null)

const STORAGE_KEY = "lenor-quote"

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quoteReducer, {
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
    (item: QuoteBasketItem) => dispatch({ type: "ADD_ITEM", payload: item }),
    []
  )

  const removeItem = useCallback(
    (productId: string, color: string, size: string) =>
      dispatch({ type: "REMOVE_ITEM", payload: { productId, color, size } }),
    []
  )

  const updateItem = useCallback(
    (update: Partial<QuoteBasketItem> & { productId: string; color: string; size: string }) =>
      dispatch({ type: "UPDATE_ITEM", payload: update }),
    []
  )

  const updateQuantity = useCallback(
    (productId: string, color: string, size: string, quantity: number) =>
      dispatch({ type: "UPDATE_QTY", payload: { productId, color, size, quantity } }),
    []
  )

  const clearQuote = useCallback(() => dispatch({ type: "CLEAR" }), [])

  const itemCount = state.items.reduce((s, i) => s + i.quantity, 0)
  const estimatedSubtotal = state.items.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <QuoteContext.Provider
      value={{
        items: state.items,
        itemCount,
        estimatedSubtotal,
        addItem,
        removeItem,
        updateItem,
        updateQuantity,
        clearQuote,
      }}
    >
      {children}
    </QuoteContext.Provider>
  )
}

export function useQuote() {
  const ctx = useContext(QuoteContext)
  if (!ctx) throw new Error("useQuote must be used within QuoteProvider")
  return ctx
}
