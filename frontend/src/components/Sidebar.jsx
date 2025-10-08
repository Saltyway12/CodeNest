import { Link, useLocation } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { Bell as BellIcon, Home as HomeIcon, MessageSquareCode, Sparkles as SparklesIcon } from "lucide-react";

/**
 * Navigation latérale persistante affichée sur les écrans larges (≥ lg).
 * Expose la signalétique produit, les entrées de navigation principales et un
 * rappel du profil connecté en s'appuyant sur les informations fournies par
 * `useAuthUser`.
 */
const Sidebar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <aside className="w-64 bg-base-200 border-r border-base-300 hidden lg:flex flex-col h-screen sticky top-0">
      {/* Marque et retour à l'accueil */}
      <div className="p-5 border-b border-base-300">
        <Link to="/" className="flex items-center gap-2.5">
          <MessageSquareCode className="size-9 text-primary" />
          <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
            CodeNest
          </span>
        </Link>
      </div>
    
      {/* Liens principaux avec état actif basé sur le chemin courant */}
      <nav className="flex-1 p-4 space-y-1">
        <Link
          to="/"
          className={
            `btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${currentPath === "/" ? "btn-active" : "" }`
          }
        >
          <HomeIcon className="size-5 text-base-content opacity-70" />
          <span>Accueil</span>
        </Link>

        <Link
          to="/fonctionnalites"
          className={
            `btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${currentPath === "/fonctionnalites" ? "btn-active" : "" }`
          }
        >
          <SparklesIcon className="size-5 text-base-content opacity-70" />
          <span>Fonctionnalités</span>
        </Link>

        <Link
          to="/notifications"
          className={
            `btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${currentPath === "/notifications" ? "btn-active" : "" }`
          }
        >
          <BellIcon className="size-5 text-base-content opacity-70" />
          <span>Notifications</span>
        </Link>
      </nav>

      {/* Résumé du profil connecté */}
      <div className="p-4 border-t border-base-300 mt-auto">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img src={authUser?.profilePic} alt="User Avatar" />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{authUser?.fullName}</p>
            <p className="text-xs text-success flex items-center gap-1">
              <span className="size-2 rounded-full bg-success inline-block" />
              Actif
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
