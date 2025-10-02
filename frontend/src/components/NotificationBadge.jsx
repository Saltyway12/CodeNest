/**
 * Composant Badge de notification avec animation
 * Affiche une pastille rouge avec le nombre de notifications
 * Animation de pulsation pour attirer l'attention
 * @param {number} count - Nombre de notifications à afficher
 */
const NotificationBadge = ({ count }) => {
  // N'affiche rien si pas de notifications
  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
      {/* Animation de pulsation */}
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
      
      {/* Badge avec le nombre */}
      <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-error text-error-content text-xs font-bold">
        {count > 9 ? '9+' : count}
      </span>
    </span>
  );
};

export default NotificationBadge;