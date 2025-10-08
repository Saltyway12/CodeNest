import { MessageSquareCode } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import useSignUp from "../hooks/useSignUp";

/**
 * Page d'inscription utilisateur
 * Formulaire de création de compte avec validation côté client
 * Interface responsive avec illustration promotionnelle et conditions d'utilisation
 */
const SignUpPage = () => {
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState({});

  const { isPending, error, signupMutation } = useSignUp();

  const emailRegex = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    []
  );

  const passwordRegex = useMemo(
    () => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/,
    []
  );

  const isFormValid =
    signupData.fullName.trim().length > 1 &&
    emailRegex.test(signupData.email) &&
    passwordRegex.test(signupData.password) &&
    hasAcceptedTerms;

  const validateForm = () => {
    const validationErrors = {};

    if (!signupData.fullName.trim()) {
      validationErrors.fullName = "Le nom complet est obligatoire.";
    }

    if (!emailRegex.test(signupData.email)) {
      validationErrors.email = "Veuillez saisir une adresse e-mail valide.";
    }

    if (!passwordRegex.test(signupData.password)) {
      validationErrors.password =
        "Le mot de passe doit contenir 6 caractères, dont majuscule, minuscule, chiffre et symbole.";
    }

    if (!hasAcceptedTerms) {
      validationErrors.terms = "Vous devez accepter les conditions d'utilisation.";
    }

    return validationErrors;
  };

  /**
   * Gestionnaire de soumission du formulaire d'inscription
   * Déclenche la mutation de création de compte avec validation des données
   */
  const handleSignup = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    signupMutation(signupData);
  };

  return (
    <div className="h-screen flex items-center justify-center p-4 sm:p-6 md:p-8" data-theme="autumn">
      <div className="border border-primary/25 flex flex-col lg:flex-row w-full max-w-5xl mx-auto bg-base-100 rounded-xl shadow-lg overflow-hidden">
        
        {/* Panneau de formulaire d'inscription gauche */}
        <div className="w-full lg:w-1/2 p-4 sm:p-8 flex flex-col">
          {/* Logo et branding de l'application */}
          <div className="mb-4 flex items-center justify-start gap-2">
            <MessageSquareCode className="size-9 text-primary" />
            <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
              CodeNest
            </span>
          </div>

          {/* Affichage conditionnel des erreurs de validation */}
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error?.response?.data?.message || "Une erreur est survenue lors de l'inscription."}</span>
            </div>
          )}

          {/* Formulaire principal d'inscription */}
          <div className="w-full">
            <form onSubmit={handleSignup}>

              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">Créez un compte</h2>
                  <p className="text-sm opacity-70">
                    Rejoins le nid, et fais évoluer ton code avec la communauté!
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Champ nom complet avec validation requise */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Nom complet <span className="text-error" aria-hidden="true">*</span></span>
                    </label>

                    <input
                      type="text"
                      placeholder="Prénom Nom"
                      className={`input input-bordered w-full ${errors.fullName ? "input-error" : ""}`}
                      value={signupData.fullName}
                      onChange={(e) => {
                        setSignupData({ ...signupData, fullName: e.target.value });
                        setErrors((prev) => ({ ...prev, fullName: undefined }));
                      }}
                      aria-invalid={Boolean(errors.fullName)}
                      autoComplete="name"
                    />
                    {errors.fullName && (
                      <p className="text-error text-sm mt-1" role="alert">
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Champ email avec validation HTML5 */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">E-mail <span className="text-error" aria-hidden="true">*</span></span>
                    </label>

                    <input
                      type="email"
                      placeholder="votremail@mail.com"
                      className={`input input-bordered w-full ${errors.email ? "input-error" : ""}`}
                      value={signupData.email}
                      onChange={(e) => {
                        setSignupData({ ...signupData, email: e.target.value });
                        setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      aria-invalid={Boolean(errors.email)}
                      autoComplete="email"
                    />
                    {errors.email && (
                      <p className="text-error text-sm mt-1" role="alert">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Champ mot de passe avec exigences de sécurité */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Mot de passe <span className="text-error" aria-hidden="true">*</span></span>
                    </label>

                    <input
                      type="password"
                      placeholder="********"
                      className={`input input-bordered w-full ${errors.password ? "input-error" : ""}`}
                      value={signupData.password}
                      onChange={(e) => {
                        setSignupData({ ...signupData, password: e.target.value });
                        setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      aria-invalid={Boolean(errors.password)}
                      autoComplete="new-password"
                    />
                    <p className="text-xs opacity-70 mt-1">
                      Le mot de passe doit contenir au moins 6 caractères dont 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial.
                    </p>
                    {errors.password && (
                      <p className="text-error text-sm mt-1" role="alert">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Acceptation des conditions d'utilisation */}
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={hasAcceptedTerms}
                        onChange={(e) => {
                          setHasAcceptedTerms(e.target.checked);
                          setErrors((prev) => ({ ...prev, terms: undefined }));
                        }}
                      />
                      <span className="text-xs leading-tight">
                        En créant un compte, vous acceptez nos {""}
                        <span className="text-primary hover:underline">Conditions d'utilisation</span> et notre {""}
                        <span className="text-primary hover:underline">Politique de confidentialité</span>
                      </span>
                    </label>
                    {errors.terms && (
                      <p className="text-error text-xs mt-1" role="alert">
                        {errors.terms}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bouton de soumission avec état de chargement */}
                <button className="btn btn-primary w-full" type="submit" disabled={!isFormValid || isPending}>
                  {isPending ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Inscription en cours...
                    </>
                  ) : (
                    "S'inscrire"
                  )}
                </button>

                {/* Lien vers la page de connexion pour utilisateurs existants */}
                <div className="text-center mt-4">
                  <p className="text-sm">
                    Vous avez déjà un compte? {""}
                    <Link to="/connexion" className="text-primary hover:underline">
                      Connectez-vous
                    </Link>
                  </p>
                </div>
              </div>
            </form>

          </div>
        </div>

        {/* Panneau promotionnel droit - visible sur desktop uniquement */}
        <div className="hidden lg:flex w-full lg:w-1/2 bg-primary/10 items-center justify-center">
          <div className="max-w-md p-8">
            {/* Illustration de la plateforme */}
            <div className="relative aspect-square max-w-sm mx-auto">
              <img
                src="/i.png"
                alt="Illustration d'inscription"
                className="w-full h-full"
              />
            </div>

            {/* Message de présentation de la plateforme */}
            <div className="text-center space-y-3 mt-6">
              <h2 className="text-xl font-semibold">Le nid où les développeurs apprennent et grandissent ensemble.</h2>
              <p className="opacity-70">
                Code, collabore et progresse dans tes compétences de développeur en communauté.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default SignUpPage;
