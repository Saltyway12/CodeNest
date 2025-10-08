import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import CallPage from "./pages/CallPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import OnborardingPage from "./pages/OnborardingPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import FeaturesPage from "./pages/FeaturesPage.jsx";

import { Toaster } from "react-hot-toast";
import PageLoader from "./components/PageLoader.jsx";
import useAuthUser from "./hooks/useAuthUser.js";
import Layout from "./components/Layout.jsx";
import { useThemeStore } from "./store/useThemeStore.js";
import { StreamChatProvider } from "./context/StreamChatContext.jsx";

/**
 * Point d'entrée de l'interface.
 * Centralise la configuration du routage côté client et les protections
 * conditionnelles en fonction de l'état d'authentification/onboarding issu du
 * hook `useAuthUser`.
 */
const App = () => {
  const { isLoading, authUser } = useAuthUser();
  const { theme } = useThemeStore();
  const isAuthenticated = Boolean(authUser);
  const isOnboarded = authUser?.isOnBoarded;

  if (isLoading) return <PageLoader />;

  return (
    <div className="min-h-screen" data-theme={theme}>
      <StreamChatProvider>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated && isOnboarded ? (
                <Layout showSidebar={true}>
                  <HomePage />
                </Layout>
              ) : (
                <Navigate to={!isAuthenticated ? "/connexion" : "/configuration-profil"} />
              )
            }
          />

          <Route
            path="/inscription"
            element={
              !isAuthenticated ? (
                <SignUpPage />
              ) : (
                <Navigate to={isOnboarded ? "/" : "/configuration-profil"} />
              )
            }
          />

          <Route
            path="/connexion"
            element={
              !isAuthenticated ? (
                <LoginPage />
              ) : (
                <Navigate to={isOnboarded ? "/" : "/configuration-profil"} />
              )
            }
          />

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

          <Route
            path="/fonctionnalites"
            element={
              isAuthenticated && isOnboarded ? (
                <Layout showSidebar={true}>
                  <FeaturesPage />
                </Layout>
              ) : (
                <Navigate to={!isAuthenticated ? "/connexion" : "/configuration-profil"} />
              )
            }
          />

          <Route
            path="/configuration-profil"
            element={
              isAuthenticated ? (
                !isOnboarded ? <OnborardingPage /> : <Navigate to="/" />
              ) : (
                <Navigate to="/connexion" />
              )
            }
          />

          <Route
            path="/profil"
            element={
              isAuthenticated ? (
                <Layout showSidebar={true}>
                  <ProfilePage />
                </Layout>
              ) : (
                <Navigate to="/connexion" />
              )
            }
          />
        </Routes>
      </StreamChatProvider>

      <Toaster />
    </div>
  );
};

export default App;
