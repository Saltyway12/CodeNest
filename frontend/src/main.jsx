import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "stream-chat-react/dist/css/v2/index.css"
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom' // utilisation correcte de react-router

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

// Création du client global React Query
const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Active des vérifications supplémentaires en mode développement */}
    <BrowserRouter>
      {/* Fournit le client React Query à toute l'application */}
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
)
