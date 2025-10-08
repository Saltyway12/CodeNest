import { Link } from "react-router-dom";
import {
  ArrowRight as ArrowRightIcon,
  BellRing as BellRingIcon,
  Code2 as Code2Icon,
  MessageCircle as MessageCircleIcon,
  ShieldCheck as ShieldCheckIcon,
  Sparkles as SparklesIcon,
  Users as UsersIcon,
} from "lucide-react";

const coreFeatures = [
  {
    title: "Édition de code en temps réel",
    description:
      "Partagez le même éditeur Monaco, synchronisé via WebSocket avec changement de langage instantané et historique commun.",
    icon: Code2Icon,
    badge: "Collaboratif",
  },
  {
    title: "Messagerie enrichie",
    description:
      "Discuter, lancer un appel vidéo ou partager un lien de session directement depuis la conversation Stream Chat.",
    icon: MessageCircleIcon,
    badge: "Communication",
  },
  {
    title: "Profils contextualisés",
    description:
      "Présentez vos objectifs d'apprentissage, langues et disponibilités pour trouver le meilleur binôme.",
    icon: UsersIcon,
    badge: "Réseau",
  },
];

const experienceHighlights = [
  {
    title: "Alertes intelligentes",
    description: "Recevez un toast dès qu'un nouveau message arrive ou qu'une demande vous est adressée.",
    icon: BellRingIcon,
  },
  {
    title: "Parcours guidé",
    description: "L'onboarding clarifie chaque étape pour que vous accédiez rapidement aux outils essentiels.",
    icon: SparklesIcon,
  },
  {
    title: "Sécurité & contrôle",
    description: "Profitez d'un espace dédié pour ajuster vos informations et gérer vos connexions en toute sérénité.",
    icon: ShieldCheckIcon,
  },
];

const FeaturesPage = () => {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-10">
      <div className="max-w-5xl mx-auto space-y-12">
        <section className="text-center space-y-4">
          <span className="inline-flex items-center gap-2 text-primary font-semibold">
            <SparklesIcon className="size-5" />
            Ce que propose CodeNest
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold">
            Construisez, échangez et progressez au même endroit.
          </h1>
          <p className="text-base-content/70 max-w-2xl mx-auto">
            CodeNest réunit les outils indispensables pour apprendre en pair-programming : un éditeur performant, une messagerie fluide et un réseau de développeurs motivés.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {coreFeatures.map((feature) => (
            <article
              key={feature.title}
              className="card bg-base-200 border border-base-300 hover:border-primary/40 transition-colors"
            >
              <div className="card-body space-y-4">
                <span className="badge badge-primary badge-outline w-fit">{feature.badge}</span>
                <feature.icon className="size-7 text-primary" aria-hidden="true" />
                <h2 className="text-xl font-semibold">{feature.title}</h2>
                <p className="text-sm text-base-content/70 leading-relaxed">{feature.description}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="card bg-base-200 border border-base-300">
          <div className="card-body grid gap-6 lg:grid-cols-2 lg:items-center">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Une expérience pensée pour la clarté</h2>
              <p className="text-base-content/70">
                Chaque interaction affiche des retours visuels immédiats : formulaires contextualisés, boutons harmonisés et statuts de connexion explicites. Vous savez toujours ce qui se passe.
              </p>
            </div>
            <ul className="space-y-4">
              {experienceHighlights.map((highlight) => (
                <li key={highlight.title} className="flex items-start gap-3">
                  <span className="p-2 rounded-full bg-primary/10 text-primary">
                    <highlight.icon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold">{highlight.title}</p>
                    <p className="text-sm text-base-content/70 leading-relaxed">{highlight.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="card bg-gradient-to-r from-primary/15 via-primary/5 to-base-200 border border-primary/20">
          <div className="card-body flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold">Prêts à lancer votre prochaine session ?</h2>
              <p className="text-base-content/70 mt-2">
                Rejoignez un binôme, ouvrez l'éditeur et laissez la synchronisation temps réel faire le reste.
              </p>
            </div>
            <Link
              to="/"
              className="btn btn-primary"
            >
              Retour à l'accueil
              <ArrowRightIcon className="size-4 ml-2" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FeaturesPage;
