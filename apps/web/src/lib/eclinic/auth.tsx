'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, tokenStore } from './api'

export type Role = 'admin' | 'doctor' | 'patient'

export interface AuthUser {
  id: number
  name: string
  email: string | null
  phone: string | null
  role: Role
  roles: { id: number; name: string }[]
  is_active: boolean
  two_factor_enabled?: boolean
  gender?: string | null
  date_of_birth?: string | null
  identity_card?: string | null
  address?: string | null
  insurance_code?: string | null
  avatar_url?: string | null
  doctor_id?: number
  doctor?: { id: number; price: string; description: string | null }
}

/** Where each role lands after login. */
export const homeFor = (role: Role) => `/eclinic/${role}/dashboard`

export type LoginResult =
  | { status: 'ok'; user: AuthUser }
  | { status: 'two_factor'; challengeToken: string }

interface AuthCtx {
  user: AuthUser | null
  ready: boolean // false until the stored token has been checked against the API
  login: (login: string, password: string) => Promise<LoginResult>
  completeTwoFactor: (challengeToken: string, code: string) => Promise<AuthUser>
  register: (payload: Record<string, unknown>) => Promise<AuthUser>
  /** Re-fetch /auth/profile (call after editing the profile). */
  refresh: () => Promise<AuthUser>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)
const USER_KEY = 'eclinic_user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)

  const persist = (token: string, u: AuthUser) => {
    tokenStore.set(token)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setUser(u)
  }
  const clear = useCallback(() => {
    tokenStore.clear()
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  // On first load: trust nothing stored — re-fetch the profile (role/status may have changed server-side).
  useEffect(() => {
    const token = tokenStore.get()
    if (!token) { setReady(true); return }
    api<AuthUser>('/auth/profile')
      .then((u) => { localStorage.setItem(USER_KEY, JSON.stringify(u)); setUser(u) })
      .catch(clear)
      .finally(() => setReady(true))
  }, [clear])

  const login: AuthCtx['login'] = async (loginValue, password) => {
    const data = await api<{ token?: string; user?: AuthUser; two_factor?: boolean; challenge_token?: string }>(
      '/auth/login', { method: 'POST', body: JSON.stringify({ login: loginValue, password }) },
    )
    if (data.two_factor && data.challenge_token) return { status: 'two_factor', challengeToken: data.challenge_token }
    persist(data.token!, data.user!)
    return { status: 'ok', user: data.user! }
  }

  const completeTwoFactor: AuthCtx['completeTwoFactor'] = async (challengeToken, code) => {
    const data = await api<{ token: string; user: AuthUser }>(
      '/auth/2fa/challenge', { method: 'POST', body: JSON.stringify({ challenge_token: challengeToken, code }) },
    )
    persist(data.token, data.user)
    return data.user
  }

  const register: AuthCtx['register'] = async (payload) => {
    const data = await api<{ token: string; user: AuthUser }>(
      '/auth/register', { method: 'POST', body: JSON.stringify(payload) },
    )
    persist(data.token, data.user)
    return data.user
  }

  const refresh: AuthCtx['refresh'] = async () => {
    const u = await api<AuthUser>('/auth/profile')
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setUser(u)
    return u
  }

  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }) } catch { /* token may already be invalid */ }
    clear()
  }

  const value = useMemo(() => ({ user, ready, login, completeTwoFactor, register, refresh, logout }), [user, ready]) // eslint-disable-line react-hooks/exhaustive-deps
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be used inside <AuthProvider>')
  return c
}
