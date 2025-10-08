/**
 * Composant d'état vide pour la liste d'amis
 * Affiché quand l'utilisateur n'a aucun ami ajouté
 */
const NoFriendsFound = () => {
  return (
    <div className="card bg-base-200 p-6 text-center">
      <h3 className="font-semibold text-lg mb-2">Pas d'amis actuellement</h3>
      <p className="text-base-content opacity-70">
        Vous n'avez pas encore ajouté d'amis. Explorez les utilisateurs recommandés pour commencer à pratiquer vos langages!
      </p>
    </div>
  );
};

export default NoFriendsFound;
