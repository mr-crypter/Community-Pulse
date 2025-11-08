import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { setAuthToken } from '../services/api'

/**
 * Custom hook to sync Auth0 token with API service
 * Call this in your App component or root layout
 */
export const useApiAuth = () => {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0()

  useEffect(() => {
    const syncToken = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: import.meta.env.VITE_AUTH0_AUDIENCE || 'https://api.community-pulse.com',
            },
          })
          setAuthToken(token)
        } catch (error) {
          console.error('Error getting access token:', error)
        }
      } else {
        setAuthToken(null)
      }
    }

    syncToken()
  }, [isAuthenticated, getAccessTokenSilently])
}

