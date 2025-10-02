import { Navigate, Route, Routes } from "react-router";
import HomePage from "./pages/HomePage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import CallPage from "./pages/CallPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import OnborardingPage from "./pages/OnborardingPage.jsx";

import { Toaster } from "react-hot-toast";
import PageLoader from "./components/PageLoader.jsx";
import useAuthUser from "./hooks/useAuthUser.js";
import Layout from "./components/Layout.jsx";
import { useThemeStore } from "./store/useThemeStore.js";

/**
 * Composant racine de l'application
 * Gère le routage principal et la logique d'authentification
 * Applique les redirections basées sur le statut utilisateur
 */
const App = () => {
  const { isLoading, authUser } = useAuthUser();
  const { theme } = useThemeStore();
  const isAuthenticated = Boolean(authUser);
  const isOnboarded = authUser?.isOnBoarded;

  // Affichage du loader pendant la vérification d'authentification
  if (isLoading) return <PageLoader />;

  return (
    <div className="min-h-screen" data-theme={theme}>
      <Routes>
        {/* Route principale - accueil pour utilisateurs connectés et configurés */}
        <Route
          path="/"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <HomePage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated? "/connexion": "/configuration-profil"} />
            )
          }
        />

        {/* Route d'inscription - accessible uniquement aux non-connectés */}
        <Route path="/inscription" element={
            !isAuthenticated ? <SignUpPage /> : <Navigate to={isOnboarded ? "/" : "/configuration-profil"} />
          }
        />

        {/* Route de connexion - accessible uniquement aux non-connectés */}
        <Route path="/connexion" element={
            !isAuthenticated ? <LoginPage /> : <Navigate to={isOnboarded ? "/" : "/configuration-profil"} />
          }
        />

        {/* Route des notifications - utilisateurs connectés et configurés uniquement */}
        <Route
          path="/notifications"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <NotificationsPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/connexion" : "/configuration-profil"} />
            )
          }
        />

        {/* Route d'appel vidéo - sans sidebar pour interface plein écran */}
        <Route
          path="/appel/:id"
          element={
            isAuthenticated && isOnboarded ? (
              <CallPage />
            ) : (
              <Navigate to={!isAuthenticated ? "/connexion" : "/configuration-profil"} />
            )
          }
        />

        {/* Route de chat - sidebar désactivée pour maximiser l'espace de conversation */}
        <Route
          path="/chat/:id"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={false}>
                <ChatPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/connexion" : "/configuration-profil"} />
            )
          }
        />

        {/* Route de configuration initiale du profil - obligatoire après inscription */}
        <Route
          path="/configuration-profil"
          element={
            isAuthenticated ? (
              !isOnboarded ? (
                <OnborardingPage />
              ) : (
                <Navigate to="/" />
              )
            ) : (
              <Navigate to="/connexion" />
            )
          }
        />
        {/* Route de modification du profil - accessible après onboarding */}
        <Route
          path="/profil"
          element={
          isAuthenticated ? (
            <ProfilePage />
          ) : (
            <Navigate to="/connexion" />
          )
          }
        />
      </Routes>

      {/* Composant global pour les notifications toast */}
      <Toaster/>
    </div>
  )
}

export default App