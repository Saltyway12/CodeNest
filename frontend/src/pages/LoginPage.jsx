import { useState } from "react";
import { MessageSquareCode } from 'lucide-react';
import { Link } from "react-router";
import useLogin from "../hooks/useLogin";

const LoginPage = () => {
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const { isPending, error, loginMutation } = useLogin();

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation(loginData);
  };

  return (
    <div className="h-screen flex items-center justify-center p-4 sm:p-6 md:p-8" data-theme="autumn">
      <div className="border border-primary/25 flex flex-col lg:flex-row w-full max-w-5xl mx-auto bg-base-100 rounded-xl shadow-lg overflow-hidden">
        
        {/* Formulaire de connexion - Côté Gauche */}
        
        <div className="w-full lg:w-1/2 p-4 sm:p-8 flex flex-col">
          
          {/* LOGO */}
          <div className="mb-4 flex items-center justify-start gap-2">
            <MessageSquareCode className="size-9 text-primary" />
            <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
              CodeNest
            </span>
          </div>

          {/* MESSAGE D'ERREUR */}
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error.response.data.message}</span>
            </div>
          )}

          {/* FORMULAIRE */}
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
                  <div className="form-control w-full space-y-2">
                    <label className="label">
                      <span className="label-text">E-mail</span>
                    </label>
                    <input
                      type="email"
                      placeholder="votre.mail@exemple.com"
                      className="input input-bordered w-full"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-control w-full space-y-2">
                    <label className="label">
                      <span className="label-text">Mot de passe</span>
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="input input-bordered w-full"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />

                  </div>

                  <button type="submit" className="btn btn-primary w-full" disabled={isPending}>
                    {isPending ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Connexion...
                      </>
                    ) : (
                      "Se connecter"
                    )}
                  </button>

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
        {/* Formulaire d'inscription- Côté droit */}
        <div className="hidden lg:flex w-full lg:w-1/2 bg-primary/10 items-center justify-center">
          <div className="max-w-md p-8">
            {/* image */}
            {/* TODO voir pour une équivalence en format tablette */}
            <div className="relative aspect-square max-w-sm mx-auto">
              <img
                src="/i.png"
                alt="Illustration d'inscription"
                className="w_full h-full"
              />
            </div>

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

export default LoginPage