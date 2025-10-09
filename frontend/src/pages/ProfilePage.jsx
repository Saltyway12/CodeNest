import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeOnboarding, deleteAccount } from "../lib/api";
import {
  CameraIcon,
  LoaderIcon,
  MapPinIcon,
  SaveIcon,
  ShuffleIcon,
  Trash2Icon,
} from "lucide-react";
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
    learningLanguage: authUser?.learningLanguage || "",
    location: authUser?.location || "",
    profilePic: authUser?.profilePic || "",
  });
  const [errors, setErrors] = useState({});

  const sortedLanguages = useMemo(
    () => [...LANGUAGES].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" })),
    []
  );

  const sortedProgrammingLanguages = useMemo(
    () => [...PROGRAMMING_LANGUAGES].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })),
    []
  );

  const isFormValid =
    formState.fullName.trim().length > 1 &&
    formState.bio.trim().length > 9 &&
    formState.nativeLanguage &&
    formState.learningLanguage &&
    formState.location.trim().length > 1 &&
    Boolean(formState.profilePic);

  // Mutation pour soumettre les données de configuration
  const { mutate: updateProfileMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success("Profil mis à jour avec succès");
      // Invalidation du cache pour forcer la mise à jour des données utilisateur
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      // Redirection vers la page d'accueil
      navigate("/");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Impossible de mettre à jour votre profil.");
    },
  });

  const { mutate: deleteAccountMutation, isPending: isDeletingAccount } = useMutation({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      toast.success("Votre compte a été supprimé.");

      await queryClient.cancelQueries({ queryKey: ["authUser"] });
      queryClient.setQueryData(["authUser"], null);
      queryClient.removeQueries({ queryKey: ["streamToken"] });

      navigate("/connexion", { replace: true });
      window.location.assign("/connexion");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Impossible de supprimer votre compte.");
    },
  });

  /**
   * Gestionnaire de soumission du formulaire
   * Valide et envoie les données de modification du profil
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = {};

    if (!formState.fullName.trim()) {
      validationErrors.fullName = "Le nom est obligatoire.";
    }

    if (formState.bio.trim().length < 10) {
      validationErrors.bio = "Ajoutez une bio d'au moins 10 caractères.";
    }

    if (!formState.nativeLanguage) {
      validationErrors.nativeLanguage = "Sélectionnez votre langue parlée.";
    }

    if (!formState.learningLanguage) {
      validationErrors.learningLanguage = "Sélectionnez votre langage en apprentissage.";
    }

    if (!formState.location.trim()) {
      validationErrors.location = "Indiquez votre localisation.";
    }

    if (!formState.profilePic) {
      validationErrors.profilePic = "Ajoutez une photo de profil.";
    }

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    updateProfileMutation(formState);
  };

  /**
   * Générateur d'avatar aléatoire
   * Utilise l'API Iran Avatar pour créer un avatar unique
   */
  const handleRandomAvatar = () => {
    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    setFormState({ ...formState, profilePic: randomAvatar });
    setErrors((prev) => ({ ...prev, profilePic: undefined }));
    toast.success("Nouvel avatar généré !");
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      "Cette action est irréversible. Voulez-vous vraiment supprimer votre compte ?"
    );

    if (!confirmed) return;

    deleteAccountMutation();
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
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleRandomAvatar} className="btn btn-accent">
                  <ShuffleIcon className="size-4 mr-2" />
                  Générer un avatar aléatoire
                </button>
              </div>
            </div>

            {errors.profilePic && (
              <p className="text-error text-sm" role="alert">
                {errors.profilePic}
              </p>
            )}

            {/* Champ nom d'utilisateur */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Nom d'utilisateur <span className="text-error" aria-hidden="true">*</span></span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formState.fullName}
                onChange={(e) => {
                  setFormState({ ...formState, fullName: e.target.value });
                  setErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                className={`input input-bordered w-full ${errors.fullName ? "input-error" : ""}`}
                placeholder="Votre nom"
                aria-invalid={Boolean(errors.fullName)}
                autoComplete="name"
              />
              {errors.fullName && (
                <p className="text-error text-sm mt-1" role="alert">
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Zone de texte pour la biographie */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Bio <span className="text-error" aria-hidden="true">*</span></span>
              </label>
              <textarea
                name="bio"
                value={formState.bio}
                onChange={(e) => {
                  setFormState({ ...formState, bio: e.target.value });
                  setErrors((prev) => ({ ...prev, bio: undefined }));
                }}
                className={`textarea textarea-bordered h-24 ${errors.bio ? "textarea-error" : ""}`}
                placeholder="Parlez-nous un peu de vous..."
                aria-invalid={Boolean(errors.bio)}
              />
              {errors.bio && (
                <p className="text-error text-sm mt-1" role="alert">
                  {errors.bio}
                </p>
              )}
            </div>

            {/* Sélecteurs de langues en grille responsive */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Langue native parlée */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Langue parlée <span className="text-error" aria-hidden="true">*</span></span>
                </label>
                <select
                  name="nativeLanguage"
                  value={formState.nativeLanguage}
                  onChange={(e) => {
                    setFormState({ ...formState, nativeLanguage: e.target.value });
                    setErrors((prev) => ({ ...prev, nativeLanguage: undefined }));
                  }}
                  className={`select select-bordered w-full ${errors.nativeLanguage ? "select-error" : ""}`}
                >
                  <option value="">Choisissez votre langue</option>
                  {sortedLanguages.map((lang) => (
                    <option key={`native-${lang}`} value={lang.toLowerCase()}>
                      {lang}
                    </option>
                  ))}
                </select>
                {errors.nativeLanguage && (
                  <p className="text-error text-sm mt-1" role="alert">
                    {errors.nativeLanguage}
                  </p>
                )}
              </div>

              {/* Langage de programmation en apprentissage */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Langage en apprentissage <span className="text-error" aria-hidden="true">*</span></span>
                </label>
                <select
                  name="learningLanguage"
                  value={formState.learningLanguage}
                  onChange={(e) => {
                    setFormState({ ...formState, learningLanguage: e.target.value });
                    setErrors((prev) => ({ ...prev, learningLanguage: undefined }));
                  }}
                  className={`select select-bordered w-full ${errors.learningLanguage ? "select-error" : ""}`}
                >
                  <option value="">Choisissez votre langage</option>
                  {sortedProgrammingLanguages.map((lang) => (
                    <option key={`learning-${lang}`} value={lang.toLowerCase()}>
                      {lang}
                    </option>
                  ))}
                </select>
                {errors.learningLanguage && (
                  <p className="text-error text-sm mt-1" role="alert">
                    {errors.learningLanguage}
                  </p>
                )}
              </div>
            </div>

            {/* Champ de localisation avec icône */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Localisation <span className="text-error" aria-hidden="true">*</span></span>
              </label>
              <div className="relative">
                <MapPinIcon className="absolute top-1/2 transform -translate-y-1/2 left-3 size-5 text-base-content opacity-70" />
                <input
                  type="text"
                  name="location"
                  value={formState.location}
                  onChange={(e) => {
                    setFormState({ ...formState, location: e.target.value });
                    setErrors((prev) => ({ ...prev, location: undefined }));
                  }}
                  className={`input input-bordered w-full pl-10 ${errors.location ? "input-error" : ""}`}
                  placeholder="Ville, Pays"
                  aria-invalid={Boolean(errors.location)}
                  autoComplete="address-level2"
                />
              </div>
              {errors.location && (
                <p className="text-error text-sm mt-1" role="alert">
                  {errors.location}
                </p>
              )}
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
                disabled={!isFormValid || isPending}
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

          <div className="mt-10 border-t border-base-300 pt-6">
            <h2 className="text-lg font-semibold text-error">Supprimer mon compte</h2>
            <p className="text-sm text-base-content/70 mt-1">
              La suppression de votre compte est définitive et entraînera la perte de vos données et
              connexions.
            </p>

            <button
              type="button"
              onClick={handleDeleteAccount}
              className="btn btn-error mt-4"
              disabled={isDeletingAccount}
            >
              {isDeletingAccount ? (
                <>
                  <LoaderIcon className="animate-spin size-5 mr-2" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2Icon className="size-5 mr-2" />
                  Supprimer mon compte
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
