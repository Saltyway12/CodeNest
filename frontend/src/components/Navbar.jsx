import { Link, useLocation } from 'react-router';
import { useStreamChat } from '../context/StreamChatContext'; // Import du contexte custom
import useAuthUser from '../hooks/useAuthUser';
import useLogout from '../hooks/useLogout';
import { useNotifications } from '../hooks/useNotifications';
import { BellIcon, LogOutIcon, MessageSquareCode } from 'lucide-react';
import ThemeSelector from "./ThemeSelector";
import NotificationBadge from "./NotificationBadge";

/**
 * Composant barre de navigation principale
 * Affiche le logo en mode chat, avatar utilisateur et contrôles globaux
 * Inclut une pastille de notifications en temps réel
 */
const Navbar = () => {
  const { authUser } = useAuthUser();
  const { logoutMutation } = useLogout();
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith('/chat');

  // Récupération du client Stream depuis le contexte global
  const { chatClient } = useStreamChat();

  // Hook personnalisé pour compter toutes les notifications
  const { totalCount } = useNotifications(chatClient);

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8 py-5 flex items-center">
        <div className="flex items-center justify-between w-full">
          {/* Logo visible uniquement en page de chat */}
          {isChatPage && (
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center gap-2.5">
                <MessageSquareCode className="size-9 text-primary" />
                <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
                  CodeNest
                </span>
              </Link>
            </div>
          )}

          {/* Contrôles à droite avec espacement uniforme */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Bouton Notifications avec pastille en temps réel */}
            <Link to="/notifications" className="relative">
              <button className="btn btn-ghost btn-circle">
                <BellIcon className="size-5 text-base-content opacity-70" />
                <NotificationBadge count={totalCount} />
              </button>
            </Link>

            {/* Sélecteur de thème */}
            <ThemeSelector />

            {/* Avatar utilisateur cliquable */}
            <Link to="/profil" className="avatar cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-9 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 ring-opacity-0 hover:ring-opacity-100 transition-all">
                <img src={authUser?.profilePic} alt="User Avatar" />
              </div>
            </Link>

            {/* Bouton de déconnexion */}
            <button className="btn btn-ghost btn-circle" onClick={logoutMutation}>
              <LogOutIcon className="size-5 text-base-content opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;