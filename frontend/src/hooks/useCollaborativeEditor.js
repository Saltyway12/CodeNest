import { useRef, useState, useEffect, useCallback } from "react";

/**
 * Hook personnalisé pour gérer l'édition collaborative
 * @param {string} callId - ID de la room/appel
 * @returns {Object} Méthodes et état de la connexion collaborative
 */
export const useCollaborativeEditor = (callId) => {
	const wsRef = useRef(null);
	const isApplyingRemoteChangeRef = useRef(false);
	const userIdRef = useRef(`user-${Math.random().toString(36).substr(2, 9)}`);

	const [connectionStatus, setConnectionStatus] = useState("disconnected");
	const [participantCount, setParticipantCount] = useState(1);
	const [onInitialContent, setOnInitialContent] = useState(null);
	const [onRemoteChange, setOnRemoteChange] = useState(null);

	// --------------------
	// GESTION DES MESSAGES WEBSOCKET
	// --------------------
	const handleWebSocketMessage = useCallback(
		(message) => {
			switch (message.type) {
				case "INITIAL_CONTENT":
					if (onInitialContent) {
						onInitialContent(message.content);
					}
					break;

				case "DELTA_CHANGE":
					if (onRemoteChange) {
						onRemoteChange(message.changes);
					}
					break;

				case "USER_JOINED":
				case "USER_LEFT":
					setParticipantCount(message.participantCount);
					break;

				default:
					console.warn(`⚠️ Message WebSocket inconnu:`, message.type);
			}
		},
		[onInitialContent, onRemoteChange]
	);

	// --------------------
	// CONNEXION WEBSOCKET
	// --------------------
	useEffect(() => {
		if (!callId) return;

		const connectWebSocket = () => {
			// Détection automatique de l'environnement sans process.env
			const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
			const wsHost = window.location.host;
			const wsUrl = `${wsProtocol}//${wsHost}/ws?callId=${callId}`;

			console.log(`🔌 Connexion WebSocket à: ${wsUrl}`);
			setConnectionStatus("connecting");

			const ws = new WebSocket(wsUrl);
			wsRef.current = ws;

			ws.onopen = () => {
				console.log("✅ WebSocket connecté");
				setConnectionStatus("connected");
			};

			ws.onmessage = (event) => {
				try {
					const message = JSON.parse(event.data);
					handleWebSocketMessage(message);
				} catch (error) {
					console.error("❌ Erreur parsing message WebSocket:", error);
				}
			};

			ws.onclose = (event) => {
				console.log("🔌 WebSocket fermé:", event.code, event.reason);
				setConnectionStatus("disconnected");
				wsRef.current = null;
			};

			ws.onerror = (error) => {
				console.error("❌ Erreur WebSocket:", error);
				setConnectionStatus("error");
			};
		};

		connectWebSocket();

		// Cleanup: fermer la connexion WebSocket
		return () => {
			if (wsRef.current) {
				console.log("🧹 Fermeture WebSocket...");
				wsRef.current.close();
				wsRef.current = null;
			}
		};
	}, [callId, handleWebSocketMessage]);

	// --------------------
	// ENVOI DES CHANGEMENTS
	// --------------------
	const sendDeltaChange = useCallback((changes) => {
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
			console.warn("⚠️ WebSocket non connecté");
			return false;
		}

		const message = {
			type: "DELTA_CHANGE",
			changes: changes,
			timestamp: Date.now(),
		};

		console.log("📤 Envoi delta:", changes);
		wsRef.current.send(JSON.stringify(message));
		return true;
	}, []);

	// --------------------
	// UTILITAIRES
	// --------------------
	const isApplyingRemoteChange = useCallback(() => {
		return isApplyingRemoteChangeRef.current;
	}, []);

	const setApplyingRemoteChange = useCallback((value) => {
		isApplyingRemoteChangeRef.current = value;
	}, []);

	return {
		// État
		connectionStatus,
		participantCount,
		userId: userIdRef.current,

		// Méthodes
		sendDeltaChange,
		isApplyingRemoteChange,
		setApplyingRemoteChange,

		// Callbacks à définir par le composant parent
		setOnInitialContent,
		setOnRemoteChange,
	};
};
