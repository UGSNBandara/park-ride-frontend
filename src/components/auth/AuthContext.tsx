import React, {createContext, useContext, useEffect, useState} from 'react'

type User = { username: string; role?: 'manager'|'fireofficer'; profile?: any } | null

type LoginResult = { success: boolean; message?: string; profile?: any }

type AuthContextType = {
  user: User
  login: (username: string, password: string, role?: 'manager'|'fireofficer') => Promise<LoginResult>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user, setUser] = useState<User>(() => {
    try {
      const raw = localStorage.getItem('park_user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) localStorage.setItem('park_user', JSON.stringify(user))
    else localStorage.removeItem('park_user')
  }, [user])

  const login = async (username: string, password: string, role: 'manager'|'fireofficer' = 'fireofficer'): Promise<LoginResult> => {
    if (!username || !password) return { success: false, message: 'Username and password are required' }

    // choose endpoint and payload depending on role
    const url = role === 'manager'
      ? 'http://localhost:3000/admin/login'
      : 'http://localhost:3000/officer/login'
    const payload = role === 'manager'
      ? { admin_id: username, password }
      : { officer_id: username, password }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        // parse error message if provided
        let msg = 'Invalid credentials'
        try { const errBody = await res.json(); if (errBody?.message) msg = errBody.message } catch {}
        return { success: false, message: msg }
      }

      const data = await res.json()
      // server returns either { message, officer } or { message, admin }
      const profile = (data.admin ?? data.officer) || null
      setUser({ username, role, profile })
      return { success: true, profile }
    } catch (err) {
      // Network error or backend unreachable — do NOT accept login silently.
      return { success: false, message: 'Unable to reach authentication server' }
    }
  }

  const logout = () => setUser(null)

  return <AuthContext.Provider value={{user, login, logout}}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
