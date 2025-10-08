import { useMemo, useState } from "react";
import { MessageSquareCode } from "lucide-react";
import { Link } from "react-router-dom";
import useLogin from "../hooks/useLogin";

/**
 * Page de connexion utilisateur
 * Interface d'authentification avec validation et gestion d'erreurs
 * Layout responsive avec illustration promotionnelle
 */
const LoginPage = () => {
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const { isPending, error, loginMutation } = useLogin();

  const emailRegex = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    []
  );

  const isFormValid =
    emailRegex.test(loginData.email) && loginData.password.trim().length >= 6;

  const validateForm = () => {
    const validationErrors = {};

    if (!emailRegex.test(loginData.email)) {
      validationErrors.email = "Adresse e-mail invalide.";
    }

    if (loginData.password.trim().length < 6) {
      validationErrors.password = "Le mot de passe doit contenir au moins 6 caractères.";
    }

    return validationErrors;
  };

  /**
   * Gestionnaire de soumission du formulaire de connexion
   * Déclenche la mutation d'authentification avec validation des données
   */
  const handleLogin = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    loginMutation(loginData);
  };

  return (
    <div className="h-screen flex items-center justify-center p-4 sm:p-6 md:p-8" data-theme="autumn">
      <div className="border border-primary/25 flex flex-col lg:flex-row w-full max-w-5xl mx-auto bg-base-100 rounded-xl shadow-lg overflow-hidden">
        
        {/* Panneau de connexion gauche */}
        <div className="w-full lg:w-1/2 p-4 sm:p-8 flex flex-col">
          
          {/* En-tête avec logo de l'application */}
          <div className="mb-4 flex items-center justify-start gap-2">
            <MessageSquareCode className="size-9 text-primary" />
            <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
              CodeNest
            </span>
          </div>

          {/* Affichage conditionnel des erreurs d'authentification */}
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error?.response?.data?.message || "Impossible de vous connecter. Vérifiez vos identifiants."}</span>
            </div>
          )}

          {/* Formulaire de connexion */}
          <div className="w-full">
            <form onSubmit={handleLogin}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">Bon retour!</h2>
                  <p className="text-sm opacity-70">
                    Connectez vous pour poursuivre votre aventure dans le nid!
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Champ email avec validation HTML5 */}
                  <div className="form-control w-full space-y-2">
                    <label className="label">
                      <span className="label-text font-medium">E-mail <span className="text-error" aria-hidden="true">*</span></span>
                    </label>
                    <input
                      type="email"
                      placeholder="votre.mail@exemple.com"
                      className={`input input-bordered w-full ${errors.email ? "input-error" : ""}`}
                      value={loginData.email}
                      onChange={(e) => {
                        setLoginData({ ...loginData, email: e.target.value });
                        setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      aria-invalid={Boolean(errors.email)}
                      autoComplete="email"
                    />
                    {errors.email && (
                      <p className="text-error text-sm" role="alert">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Champ mot de passe sécurisé */}
                  <div className="form-control w-full space-y-2">
                    <label className="label">
                      <span className="label-text font-medium">Mot de passe <span className="text-error" aria-hidden="true">*</span></span>
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className={`input input-bordered w-full ${errors.password ? "input-error" : ""}`}
                      value={loginData.password}
                      onChange={(e) => {
                        setLoginData({ ...loginData, password: e.target.value });
                        setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      aria-invalid={Boolean(errors.password)}
                      autoComplete="current-password"
                    />
                    {errors.password && (
                      <p className="text-error text-sm" role="alert">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Bouton de soumission avec état de chargement */}
                  <button type="submit" className="btn btn-primary w-full" disabled={!isFormValid || isPending}>
                    {isPending ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Connexion...
                      </>
                    ) : (
                      "Se connecter"
                    )}
                  </button>

                  {/* Lien vers la page d'inscription */}
                  <div className="text-center mt-4">
                    <p className="text-sm">
                      Pas encore de compte?{" "}
                      <Link to="/inscription" className="text-primary hover:underline">
                        Créez-en un ici!
                      </Link>
                    </p>
                  </div>

                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Panneau promotionnel droit - visible sur desktop uniquement */}
        <div className="hidden lg:flex w-full lg:w-1/2 bg-primary/10 items-center justify-center">
          <div className="max-w-md p-8">
            {/* Illustration promotionnelle */}
            <div className="relative aspect-square max-w-sm mx-auto">
              <img
                src="/i.png"
                alt="Illustration d'inscription"
                className="w-full h-full"
              />
            </div>

            {/* Message promotionnel de la plateforme */}
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

export default LoginPage;
