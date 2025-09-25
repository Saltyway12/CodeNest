import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "stream-chat-react/dist/css/v2/index.css"
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

// Configuration du client React Query pour la gestion d'état et cache
const queryClient = new QueryClient()

/**
 * Point d'entrée principal de l'application React
 * Configure les providers globaux et monte l'application
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Mode strict React pour vérifications supplémentaires en développement */}
    <BrowserRouter>
      {/* Routeur pour la navigation SPA */}
      <QueryClientProvider client={queryClient}>
        {/* Provider React Query pour gestion d'état serveur */}
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
)