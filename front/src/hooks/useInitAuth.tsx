import { useEffect } from 'react'
import { useAuth } from '../store/useAuth'

import { MeEndpoint } from '../api/endpoints/auth'

export const useInitAuth = () => {
  const setAuth = useAuth((s) => s.setAuth)
  const clearAuth = useAuth((s) => s.clearAuth)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        
        const res = await MeEndpoint()
        setAuth(res.user, '')

      } catch {
        clearAuth()  // 401 or network error → clear, but isInitialized → true
      }
    }

    fetchUser()
  }, [setAuth, clearAuth])  // ← empty deps, run once on mount only
}