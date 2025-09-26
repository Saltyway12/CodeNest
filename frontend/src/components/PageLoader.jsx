import { LoaderIcon } from "lucide-react"
import { useThemeStore } from "../store/useThemeStore";

/**
 * Composant de chargement global de page
 * Écran de chargement avec thème adaptatif pour les transitions d'application
 */
const PageLoader = () => {
    const { theme } = useThemeStore();
    return (
        <div className="min-h-screen flex items-center justify-center" data-theme={theme}>
            <LoaderIcon className="animate-spin size-10 text-primary"/>
        </div>
  )
}

export default PageLoader;