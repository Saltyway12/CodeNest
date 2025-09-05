// useYjsProvider.js
import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { CustomProvider } from "../providers/CustomProviders";

export const useYjsProvider = (roomId, url) => {
	const ydocRef = useRef(null);
	const providerRef = useRef(null);
	const [connectedPeers, setConnectedPeers] = useState(0);
	const [status, setStatus] = useState("connecting");

	useEffect(() => {
		const ydoc = new Y.Doc();
		ydocRef.current = ydoc;

		const provider = new CustomProvider(url, roomId, ydoc);
		providerRef.current = provider;

		// Fonction pour mettre à jour le nombre de peers
		const updatePeers = () => {
			const states = provider.awareness.getStates();
			setConnectedPeers(states.size);
		};

		// Écouter les changements d'awareness
		provider.awareness.on("change", updatePeers);

		// Écouter l'état de connexion WebSocket
		const checkConnection = () => {
			if (provider.ws) {
				switch (provider.ws.readyState) {
					case WebSocket.CONNECTING:
						setStatus("connecting");
						break;
					case WebSocket.OPEN:
						setStatus("connected");
						break;
					case WebSocket.CLOSING:
					case WebSocket.CLOSED:
						setStatus("disconnected");
						break;
				}
			}
		};

		// Vérifier l'état de connexion périodiquement
		const intervalId = setInterval(checkConnection, 1000);
		checkConnection(); // Check initial state

		// Initial peer count
		updatePeers();

		return () => {
			clearInterval(intervalId);
			provider.destroy();
			ydoc.destroy();
			ydocRef.current = null;
			providerRef.current = null;
		};
	}, [roomId, url]);

	return {
		ydoc: ydocRef.current,
		provider: providerRef.current,
		connectedPeers,
		status,
	};
};
