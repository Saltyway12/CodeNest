import { BellIcon } from "lucide-react";

/**
 * Composant d'état vide pour les notifications
 * Affiché quand aucune notification n'est disponible
 */
function NoNotificationsFound() {
	return (
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<div className="size-16 rounded-full bg-base-300 flex items-center justify-center mb-4">
				<BellIcon className="size-8 text-base-content opacity-40" />
			</div>
			<h3 className="text-lg font-semibold mb-2">
				Aucune notification... pour l'instant
			</h3>
			<p className="text-base-content opacity-70 max-w-md">
				Lorsque vous recevrez des demandes d'amis ou que vous recevrez un
				message, elles apparaîtront ici.
			</p>
		</div>
	);
}

export default NoNotificationsFound;
