import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

/**
 * Hook React pour connecter un document Y.js à un serveur WebSocket collaboratif.
 *
 * @param {string} roomId - Identifiant de la "room" partagée entre clients.
 * @param {string} url - URL du serveur WebSocket (ex: "ws://localhost:1234").
 * @returns {{
 *   ydoc: Y.Doc | null,
 *   provider: WebsocketProvider | null,
 *   connectedPeers: number,
 *   status: "connecting" | "connected" | "disconnected"
 * }}
 */
export const useYjsProvider = (roomId, url) => {
	const ydocRef = useRef(null); // Stocke le document Y.js
	const providerRef = useRef(null); // Stocke le provider WebSocket
	const [connectedPeers, setConnectedPeers] = useState(0); // Nombre de pairs connectés
	const [status, setStatus] = useState("connecting"); // État de la connexion

	useEffect(() => {
		// 1️⃣ Créer un nouveau document Y.js (structure CRDT partagée)
		const ydoc = new Y.Doc();
		ydocRef.current = ydoc;

		// 2️⃣ Connecter le document au serveur WebSocket
		const provider = new WebsocketProvider(url, roomId, ydoc);
		providerRef.current = provider;

		// 3️⃣ Écouter les changements de statut ("connected" / "disconnected")
		provider.on("status", ({ status }) => {
			setStatus(status);
		});

		// 4️⃣ Mettre à jour le nombre de pairs connectés via awareness
		const updatePeers = () => {
			setConnectedPeers(provider.awareness.getStates().size);
		};
		provider.awareness.on("change", updatePeers);
		updatePeers(); // mise à jour initiale

		// 5️⃣ Nettoyage à la destruction du composant
		return () => {
			provider.destroy();
			ydoc.destroy();
			ydocRef.current = null;
			providerRef.current = null;
		};
	}, [roomId, url]); // Recrée la connexion si roomId ou url changent

	return {
		ydoc: ydocRef.current,
		provider: providerRef.current,
		connectedPeers,
		status,
	};
};
