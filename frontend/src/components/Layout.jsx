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
  return (
    <div className="min-h-screen">
      <div className="flex">
        {showSidebar && <Sidebar />}

        <div className="flex-1 flex flex-col">
          <Navbar />

          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
