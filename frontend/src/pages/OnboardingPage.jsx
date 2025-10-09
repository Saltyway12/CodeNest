import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  CameraIcon,
  LoaderIcon,
  MapPinIcon,
  SaveIcon,
  ShuffleIcon,
} from "lucide-react";

import useAuthUser from "../hooks/useAuthUser";
import { completeOnboarding } from "../lib/api";
import { LANGUAGES, PROGRAMMING_LANGUAGES } from "../constants";

/**
 * Page de configuration initiale du profil utilisateur
 * Formulaire obligatoire après inscription pour compléter les informations
 * Génération d'avatar aléatoire et validation des champs requis
 */
const OnboardingPage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

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
    () =>
      [...LANGUAGES].sort((a, b) =>
        a.localeCompare(b, "fr", { sensitivity: "base" }),
      ),
    [],
  );

  const sortedProgrammingLanguages = useMemo(
    () =>
      [...PROGRAMMING_LANGUAGES].sort((a, b) =>
        a.localeCompare(b, "en", { sensitivity: "base" }),
      ),
    [],
  );

  const isFormValid =
    formState.fullName.trim().length > 1 &&
    formState.bio.trim().length > 9 &&
    formState.nativeLanguage &&
    formState.learningLanguage &&
    formState.location.trim().length > 1 &&
    Boolean(formState.profilePic);

  // Mutation pour soumettre les données de configuration
  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success("Profil mis à jour avec succès");
      // Invalidation du cache pour forcer la mise à jour des données utilisateur
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          "Impossible d'enregistrer votre profil pour le moment.",
      );
    },
  });

  /**
   * Gestionnaire de soumission du formulaire
   * Valide et envoie les données de configuration du profil
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = {};

    if (!formState.fullName.trim()) {
      validationErrors.fullName = "Le nom est obligatoire.";
    }

    if (formState.bio.trim().length < 10) {
      validationErrors.bio =
        "Ajoutez une bio d'au moins 10 caractères pour mieux vous présenter.";
    }

    if (!formState.nativeLanguage) {
      validationErrors.nativeLanguage = "Sélectionnez votre langue parlée.";
    }

    if (!formState.learningLanguage) {
      validationErrors.learningLanguage =
        "Sélectionnez votre langage en apprentissage.";
    }

    if (!formState.location.trim()) {
      validationErrors.location = "Indiquez votre localisation.";
    }

    if (!formState.profilePic) {
      validationErrors.profilePic =
        "Ajoutez une photo de profil pour être reconnu par la communauté.";
    }

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    onboardingMutation(formState);
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

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="card bg-base-200 w-full max-w-3xl shadow-xl">
        <div className="card-body p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Complétez votre profil
          </h1>
          <div className="alert alert-info mb-6" role="status">
            <div>
              <span className="font-semibold">Avant de collaborer</span>
              <p className="text-sm opacity-80 mt-1">
                Ce dernier pas nous permet d’adapter l’expérience et de
                débloquer l’accès à l’accueil, au chat et à l’éditeur
                collaboratif.
              </p>
            </div>
          </div>

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

              {errors.profilePic && (
                <p className="text-error text-sm" role="alert">
                  {errors.profilePic}
                </p>
              )}

              {/* Bouton de génération d'avatar aléatoire */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRandomAvatar}
                  className="btn btn-accent"
                >
                  <ShuffleIcon className="size-4 mr-2" />
                  Générer un avatar aléatoire
                </button>
              </div>
            </div>

            {/* Champ nom d'utilisateur */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Nom d'utilisateur{" "}
                  <span className="text-error" aria-hidden="true">
                    *
                  </span>
                </span>
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
                <span className="label-text font-medium">
                  Bio{" "}
                  <span className="text-error" aria-hidden="true">
                    *
                  </span>
                </span>
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
                  <span className="label-text font-medium">
                    Langue parlée{" "}
                    <span className="text-error" aria-hidden="true">
                      *
                    </span>
                  </span>
                </label>
                <select
                  name="nativeLanguage"
                  value={formState.nativeLanguage}
                  onChange={(e) => {
                    setFormState({
                      ...formState,
                      nativeLanguage: e.target.value,
                    });
                    setErrors((prev) => ({
                      ...prev,
                      nativeLanguage: undefined,
                    }));
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
                  <span className="label-text font-medium">
                    Langage en apprentissage{" "}
                    <span className="text-error" aria-hidden="true">
                      *
                    </span>
                  </span>
                </label>
                <select
                  name="learningLanguage"
                  value={formState.learningLanguage}
                  onChange={(e) => {
                    setFormState({
                      ...formState,
                      learningLanguage: e.target.value,
                    });
                    setErrors((prev) => ({
                      ...prev,
                      learningLanguage: undefined,
                    }));
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
                <span className="label-text font-medium">
                  Localisation{" "}
                  <span className="text-error" aria-hidden="true">
                    *
                  </span>
                </span>
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

            {/* Bouton de soumission avec état de chargement */}
            <button
              className="btn btn-primary w-full"
              disabled={!isFormValid || isPending}
              type="submit"
            >
              {!isPending ? (
                <>
                  <SaveIcon className="size-5 mr-2" />
                  Enregistrer et continuer
                </>
              ) : (
                <>
                  <LoaderIcon className="animate-spin size-5 mr-2" />
                  Enregistrement du profil...
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
