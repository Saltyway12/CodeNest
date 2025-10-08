import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

/**
 * Composant de mise en page principal de l'application
 * Structure avec sidebar optionnelle et navbar fixe
 * @param {React.ReactNode} children - Contenu principal à afficher
 * @param {boolean} showSidebar - Affichage conditionnel de la sidebar
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
