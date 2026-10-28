"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import * as api from "@/lib/api"

/* ------------------------------------------------------------------ */
/*  Context types                                                      */
/* ------------------------------------------------------------------ */

interface AuthContextValue {
  user: api.SessionUser | null
  isAuthenticated: boolean
  isLoading: boolean
  /** Resolves to null on success, or an error message to show. */
  login: (email: string, password: string) => Promise<string | null>
  register: (data: api.RegisterData) => Promise<string | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const message = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Please try again."

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<api.SessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // The session lives in an HttpOnly cookie; ask the server who we are.
  useEffect(() => {
    // Older builds kept a fake user in localStorage.
    try {
      localStorage.removeItem("lenor-auth")
    } catch {
      // ignore
    }

    api
      .getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      setUser(await api.login(email, password))
      return null
    } catch (error) {
      return message(error)
    }
  }, [])

  const registerFn = useCallback(async (data: api.RegisterData) => {
    try {
      setUser(await api.register(data))
      return null
    } catch (error) {
      return message(error)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } finally {
      setUser(null)
      // Reload so server-rendered pages drop prices straight away.
      window.location.assign("/")
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register: registerFn,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
