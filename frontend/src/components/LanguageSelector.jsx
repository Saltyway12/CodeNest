import { useState } from "react";
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

  return (
    <div className="ml-2 mb-4">
      <p className="mb-2 text-lg">Language:</p>
      
      <div className="relative">
        <button
          className="flex items-center justify-between w-full px-4 py-2 bg-gray-800 text-white rounded-md border border-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={() => setIsOpen(!isOpen)}
        >
          {language}
          <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-600 rounded-md shadow-lg z-10">
            {languages.map(([lang, version]) => (
              <button
                key={lang}
                className={`w-full px-4 py-2 text-left hover:bg-gray-800 hover:text-blue-400 focus:outline-none focus:bg-gray-800 ${
                  lang === language 
                    ? 'bg-gray-800 text-blue-400' 
                    : 'text-white'
                }`}
                onClick={() => {
                  onSelect(lang);
                  setIsOpen(false);
                }}
              >
                {lang}
                &nbsp;
                <span className="text-gray-600 text-sm">
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