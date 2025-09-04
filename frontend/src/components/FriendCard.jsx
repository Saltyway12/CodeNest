import { Link } from "react-router";
import { LANGUAGE_TO_FLAG, PROGRAMMING_LANGUAGE_TO_ICON } from "../constants";

const FriendCard = ({ friend }) => {
    return (
        <div className="card bg-base-200 hover:shadow-md transition-shadow">
            <div className="card-body p-4">
                {/* USER INFO */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="avatar size-12">
                        <img src={friend.profilePic} alt={friend.fullName} />
                    </div>
                    <h3 className="font-semibold truncate">{friend.fullName}</h3>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="badge badge-secondary text-xs">
                        {getLanguageFlag(friend.nativeLanguage)}
                        Langue parlée: {friend.nativeLanguage}
                    </span>
                    <span className="badge badge-outline text-xs">
                        {getProgrammingLogo(friend.learningLanguage)}
                        Apprenant: {friend.learningLanguage}
                    </span>
                </div>
                <Link to={`/chat/${friend._id}`} className="btn btn-outline w-full">
                    Envoyer un message
                </Link>
            </div>
        </div>
    );
};
export default FriendCard;

// eslint-disable-next-line react-refresh/only-export-components
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
// eslint-disable-next-line react-refresh/only-export-components
export function getProgrammingLogo(language) {
    // alias pour gérer les cas spéciaux
    const LANGUAGE_ALIASES = {
        "c++": "c++",
        "c#": "c#",
        "f#": "f#",
        "objective-c": "objective-c",
        "objective c": "objective-c",
        objc: "objective-c",
    };
    if (!language) return null;

    let langLower = language.toLowerCase().trim();

    // corrige si c’est un alias connu
    if (LANGUAGE_ALIASES[langLower]) {
        langLower = LANGUAGE_ALIASES[langLower];
    }

    const logoUrl = PROGRAMMING_LANGUAGE_TO_ICON[langLower];
    if (logoUrl) {
        return (
        <img
            src={logoUrl}
            alt={`${langLower} logo`}
            className="h-3 mr-1 inline-block"
        />
        );
    }

    return null;
}
