import { useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

/**
 * Enveloppe structurelle qui expose la grille principale de l'application.
 * Permet d'activer la sidebar de navigation tout en conservant une barre
 * supérieure systématique. Les enfants sont rendus dans une zone scrollable
 * pour éviter que la navigation ne soit rechargée.
 *
 * @param {React.ReactNode} children - Contenu métier à afficher.
 * @param {boolean} showSidebar - Active le rendu de la navigation latérale.
 */
const Layout = ({ children, showSidebar = false }) => {
  const location = useLocation();
  const isChatRoute = location.pathname?.startsWith("/chat");

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        {showSidebar && <Sidebar />}

        <div className="flex-1 flex flex-col">
          <Navbar />

          {/* La conversation occupe l'intégralité du viewport sans double scrollbar. */}
          <main
            className={`flex-1 ${
              isChatRoute ? "overflow-hidden" : "overflow-y-auto"
            }`}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
