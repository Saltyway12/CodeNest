import { Link } from "react-router-dom";

import { LANGUAGE_TO_FLAG, PROGRAMMING_LANGUAGE_TO_ICON } from "../constants";
import { capitalize } from "../lib/utils";

const LANGUAGE_ALIASES = {
  "c++": "c++",
  "c#": "c#",
  "f#": "f#",
  "objective-c": "objective-c",
  "objective c": "objective-c",
  objc: "objective-c",
};

/**
 * Composant carte d'affichage d'un ami
 * Affiche les informations utilisateur et un lien vers la conversation
 * @param {Object} friend - Objet utilisateur ami avec profil et langues
 */
const FriendCard = ({ friend }) => {
  return (
    <div className="card bg-base-200 hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        {/* Informations utilisateur */}
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar size-12">
            <img src={friend.profilePic} alt={friend.fullName} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{friend.fullName}</h3>
            {friend.bio && (
              <p className="text-xs text-base-content/70 line-clamp-2">
                {friend.bio}
              </p>
            )}
          </div>
        </div>

        {/* Badges de langues */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="badge badge-secondary text-xs">
            {getLanguageFlag(friend.nativeLanguage)}
            Langue parlée: {capitalize(friend.nativeLanguage)}
          </span>
          <span className="badge badge-outline text-xs">
            {getProgrammingLogo(friend.learningLanguage)}
            Apprenant: {capitalize(friend.learningLanguage)}
          </span>
        </div>

        {/* Lien vers la conversation */}
        <Link to={`/chat/${friend._id}`} className="btn btn-outline w-full">
          Envoyer un message
        </Link>
      </div>
    </div>
  );
};

export default FriendCard;

/**
 * Génère l'icône du drapeau correspondant à une langue naturelle
 * @param {string} language - Nom de la langue en format texte
 * @returns {JSX.Element|null} Image du drapeau ou null si non trouvé
 */
export function getLanguageFlag(language) {
  if (!language) return null;

  const langLower = language.toLowerCase();
  const countryCode = LANGUAGE_TO_FLAG[langLower];

  if (countryCode) {
    return (
      <img
        src={`https://flagcdn.com/24x18/${countryCode}.png`}
        alt={`${langLower} flag`}
        className="h-3 mr-1 inline-block"
      />
    );
  }
  return null;
}

/**
 * Génère l'icône du logo correspondant à un langage de programmation
 * Gère les alias et cas spéciaux de nommage
 * @param {string} language - Nom du langage de programmation
 * @returns {JSX.Element|null} Image du logo ou null si non trouvé
 */
export function getProgrammingLogo(language) {
  if (!language) return null;

  let langLower = language.toLowerCase().trim();
  if (LANGUAGE_ALIASES[langLower]) {
    langLower = LANGUAGE_ALIASES[langLower];
  }

  const logoUrl = PROGRAMMING_LANGUAGE_TO_ICON[langLower];
  if (!logoUrl) {
    return null;
  }

  return (
    <img
      src={logoUrl}
      alt={`${langLower} logo`}
      className="h-3 mr-1 inline-block"
    />
  );
}
