import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeOnboarding } from "../lib/api";
import { CameraIcon, LoaderIcon, MapPinIcon, SaveIcon, ShuffleIcon } from "lucide-react";
import { LANGUAGES, PROGRAMMING_LANGUAGES } from "../constants";

/**
 * Page de modification du profil utilisateur
 * Accessible après l'onboarding pour mettre à jour les informations
 */
const ProfilePage = () => {
  
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // État du formulaire avec données utilisateur existantes comme valeurs par défaut
  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    nativeLanguage: authUser?.nativeLanguage || "",
    learningLanguages: authUser?.learningLanguages || [], // Tableau au lieu de string
    location: authUser?.location || "",
    profilePic: authUser?.profilePic || "",
  });

  // Mutation pour soumettre les données de configuration
  const { mutate: updateProfileMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success("Profil mis à jour avec succès");
      // Invalidation du cache pour forcer la mise à jour des données utilisateur
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      // Redirection vers la page d'accueil après la mise à jour
      navigate("/");
    },
    onError: (error) => { 
      toast.error(error.response.data.message);
    },
  });

  /**
   * Gère la sélection/désélection des langages d'apprentissage
   */
  const toggleLearningLanguage = (language) => {
    const normalizedLang = language.toLowerCase();
    const currentLanguages = formState.learningLanguages || [];
    
    if (currentLanguages.includes(normalizedLang)) {
      // Retirer le langage s'il est déjà sélectionné
      setFormState({
        ...formState,
        learningLanguages: currentLanguages.filter(lang => lang !== normalizedLang)
      });
    } else {
      // Ajouter le langage
      setFormState({
        ...formState,
        learningLanguages: [...currentLanguages, normalizedLang]
      });
    }
  };

  /**
   * Gestionnaire de soumission du formulaire
   * Valide et envoie les données de modification du profil
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation(formState);
  }

  /**
   * Générateur d'avatar aléatoire
   * Utilise l'API Iran Avatar pour créer un avatar unique
   */
  const handleRandomAvatar = () => {
    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    setFormState({ ...formState, profilePic: randomAvatar });
    toast.success("Nouvel avatar généré !");
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="card bg-base-200 w-full max-w-3xl shadow-xl">
        <div className="card-body p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">
            Modifier votre profil
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section de gestion de la photo de profil */}
            <div className="flex flex-col items-center justify-center space-y-4">
              {/* Prévisualisation de l'avatar */}
              <div className="size-32 rounded-full bg-base-300 overflow-hidden">
                {formState.profilePic ? (
                  <img
                    src={formState.profilePic}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <CameraIcon className="size-12 text-base-content opacity-40" />
                  </div>
                )}
              </div>

              {/* Bouton de génération d'avatar aléatoire */}
              <div className="flex items-centre gap-2">
                <button type="button" onClick={handleRandomAvatar} className="btn btn-accent">
                  <ShuffleIcon className="size-4 mr-2" />
                  Générer un avatar aléatoire
                </button>
              </div>
            </div>

            {/* Champ nom d'utilisateur */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Nom d'utilisateur</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formState.fullName}
                onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                className="input input-bordered w-full"
                placeholder="Votre nom"
              />
            </div>

            {/* Zone de texte pour la biographie */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Bio</span>
              </label>
              <textarea
                name="bio"
                value={formState.bio}
                onChange={(e) => setFormState({ ...formState, bio: e.target.value })}
                className="textarea textarea-bordered h-24"
                placeholder="Parlez-nous un peu de vous..."
              />
            </div>

            {/* Sélecteurs de langues en grille responsive */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Langue native parlée */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Langue parlée</span>
                </label>
                <select
                  name="nativeLanguage"
                  value={formState.nativeLanguage}
                  onChange={(e) => setFormState({ ...formState, nativeLanguage: e.target.value })}
                  className="select select-bordered w-full"
                >
                  <option value="">Choisissez votre langue</option>
                  {LANGUAGES.map((lang) => (
                    <option key={`native-${lang}`} value={lang.toLowerCase()}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Langages de programmation en apprentissage - sélection multiple */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Langages en apprentissage</span>
                <span className="label-text-alt text-base-content opacity-60">
                  Sélectionnez un ou plusieurs langages
                </span>
              </label>
              <div className="flex flex-wrap gap-2 p-4 bg-base-300 rounded-lg min-h-[100px]">
                {PROGRAMMING_LANGUAGES.map((lang) => {
                  const isSelected = formState.learningLanguages?.includes(lang.toLowerCase());
                  return (
                    <button
                      key={`learning-${lang}`}
                      type="button"
                      onClick={() => toggleLearningLanguage(lang)}
                      className={`badge badge-lg gap-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'badge-primary' 
                          : 'badge-outline hover:badge-primary hover:badge-outline'
                      }`}
                    >
                      {lang}
                      {isSelected && <span className="text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
              {formState.learningLanguages?.length > 0 && (
                <div className="label">
                  <span className="label-text-alt text-primary">
                    {formState.learningLanguages.length} langage(s) sélectionné(s)
                  </span>
                </div>
              )}
            </div>

            {/* Champ de localisation avec icône */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Localisation</span>
              </label>
              <div className="relative">
                <MapPinIcon className="absolute top-1/2 transform -translate-y-1/2 left-3 size-5 text-base-content opacity-70" />
                <input
                  type="text"
                  name="location"
                  value={formState.location}
                  onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                  className="input input-bordered w-full pl-10"
                  placeholder="Ville, Pays"
                />
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 mt-2">
              {/* Bouton Quitter sans sauvegarder */}
              <button 
                type="button" 
                onClick={() => navigate("/")} 
                className="btn btn-ghost flex-1"
                disabled={isPending}
              >
                Quitter sans sauvegarder
              </button>

              {/* Bouton Enregistrer */}
              <button 
                type="submit" 
                className="btn btn-primary flex-1" 
                disabled={isPending}
              >
                {!isPending ? (
                  <>
                    <SaveIcon className="size-5 mr-2" />
                    Enregistrer
                  </>
                ) : (
                  <>
                    <LoaderIcon className="animate-spin size-5 mr-2" />
                    Enregistrement...
                  </>
                )}
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  )
}

export default ProfilePage