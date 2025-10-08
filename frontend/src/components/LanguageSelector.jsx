import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { LANGUAGE_VERSIONS } from "../constants/constants";

const languages = Object.entries(LANGUAGE_VERSIONS);

/**
 * Composant sélecteur de langage de programmation
 * Menu déroulant avec versions supportées pour l'éditeur de code
 * @param {string} language - Langage actuellement sélectionné
 * @param {Function} onSelect - Callback de changement de langage
 */
const LanguageSelector = ({ language, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const sortedLanguages = useMemo(
    () =>
      [...languages].sort(([langA], [langB]) =>
        langA.localeCompare(langB, "en", { sensitivity: "base" })
      ),
    []
  );

  return (
    <div className="ml-2 mb-4">
      <p className="mb-2 text-sm font-medium text-base-content/80 uppercase tracking-wide">Langage</p>

      <div className="relative">
        <button
          className="flex items-center justify-between w-full px-4 py-2 bg-base-300 text-base-content rounded-md border border-base-300 hover:bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
          onClick={() => setIsOpen(!isOpen)}
        >
          {language}
          <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-base-200 border border-base-300 rounded-md shadow-lg z-10 overflow-hidden">
            {sortedLanguages.map(([lang, version]) => (
              <button
                key={lang}
                className={`w-full px-4 py-2 text-left focus:outline-none transition-colors ${
                  lang === language
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-base-300 text-base-content'
                }`}
                onClick={() => {
                  onSelect(lang);
                  setIsOpen(false);
                }}
              >
                <span className="font-medium capitalize">{lang}</span>
                <span className="ml-2 text-xs text-base-content/70">
                  ({version})
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageSelector;
