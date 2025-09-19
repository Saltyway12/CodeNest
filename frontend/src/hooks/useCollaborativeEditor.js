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

	// Utiliser useRef pour stocker les callbacks et éviter les problèmes de re-render
	const onInitialContentRef = useRef(null);
	const onRemoteChangeRef = useRef(null);

	// Gestion reconnexion
	const reconnectTimeoutRef = useRef(null);
	const reconnectAttemptsRef = useRef(0);
	const maxReconnectAttempts = 5;

	// --------------------
	// GESTION DES MESSAGES WEBSOCKET
	// --------------------
	const handleWebSocketMessage = useCallback((message) => {
		console.log("📨 Message WebSocket reçu:", message.type);

		switch (message.type) {
			case "INITIAL_CONTENT":
				console.log("📥 Réception contenu initial");
				if (onInitialContentRef.current) {
					onInitialContentRef.current(message.content);
				}
				break;

			case "DELTA_CHANGE":
				console.log("📥 Application delta distant:", message.changes);

				// VALIDATION CRITIQUE: s'assurer que changes existe et est un array
				if (!message.changes) {
					console.error("❌ Changes est undefined ou null:", message);
					return;
				}

				if (!Array.isArray(message.changes)) {
					console.error(
						"❌ Changes n'est pas un array:",
						typeof message.changes,
						message.changes
					);
					return;
				}

				if (message.changes.length === 0) {
					console.warn("⚠️ Array changes vide");
					return;
				}

				if (onRemoteChangeRef.current) {
					onRemoteChangeRef.current(message.changes);
				} else {
					console.warn("⚠️ onRemoteChangeRef.current non défini");
				}
				break;

			case "USER_JOINED":
			case "USER_LEFT":
				if (typeof message.participantCount === "number") {
					setParticipantCount(message.participantCount);
					console.log(`👥 Participants: ${message.participantCount}`);
				}
				break;

			default:
				console.warn(`⚠️ Message WebSocket inconnu:`, message.type);
		}
	}, []);

	// --------------------
	// CONNEXION WEBSOCKET AVEC RECONNEXION
	// --------------------
	const connectWebSocket = useCallback(() => {
		if (!callId) return;

		// Nettoyer timeout précédent
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}

		// Fermer connexion existante si elle existe
		if (wsRef.current) {
			wsRef.current.close();
			wsRef.current = null;
		}

		// Détection automatique de l'environnement
		const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		const wsHost = window.location.host;
		const wsUrl = `${wsProtocol}//${wsHost}/ws?callId=${callId}`;

		console.log(
			`🔌 Connexion WebSocket à : ${wsUrl} (tentative ${
				reconnectAttemptsRef.current + 1
			})`
		);
		setConnectionStatus("connecting");

		try {
			const ws = new WebSocket(wsUrl);
			wsRef.current = ws;

			// Timeout de connexion
			const connectionTimeout = setTimeout(() => {
				if (ws.readyState === WebSocket.CONNECTING) {
					console.warn("⏰ Timeout de connexion WebSocket");
					ws.close();
				}
			}, 10000); // 10 secondes

			ws.onopen = () => {
				clearTimeout(connectionTimeout);
				console.log("✅ WebSocket connecté");
				setConnectionStatus("connected");
				reconnectAttemptsRef.current = 0; // Reset compteur
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
				clearTimeout(connectionTimeout);
				console.log("🔌 WebSocket fermé:", event.code, event.reason);

				if (wsRef.current === ws) {
					// S'assurer que c'est bien notre connexion
					setConnectionStatus("disconnected");
					wsRef.current = null;

					// Reconnexion automatique si pas de fermeture volontaire
					if (
						event.code !== 1000 &&
						reconnectAttemptsRef.current < maxReconnectAttempts
					) {
						const delay = Math.min(
							1000 * Math.pow(2, reconnectAttemptsRef.current),
							30000
						); // Backoff exponentiel, max 30s
						console.log(
							`🔄 Reconnexion dans ${delay}ms (tentative ${
								reconnectAttemptsRef.current + 1
							}/${maxReconnectAttempts})`
						);

						reconnectAttemptsRef.current++;
						setConnectionStatus("connecting");

						reconnectTimeoutRef.current = setTimeout(() => {
							connectWebSocket();
						}, delay);
					} else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
						console.error(
							"❌ Nombre maximum de tentatives de reconnexion atteint"
						);
						setConnectionStatus("error");
					}
				}
			};

			ws.onerror = (error) => {
				clearTimeout(connectionTimeout);
				console.error("❌ Erreur WebSocket:", error);
				setConnectionStatus("error");
			};
		} catch (error) {
			console.error("❌ Erreur création WebSocket:", error);
			setConnectionStatus("error");
		}
	}, [callId, handleWebSocketMessage]);

	// --------------------
	// EFFET PRINCIPAL DE CONNEXION
	// --------------------
	useEffect(() => {
		connectWebSocket();

		// Cleanup: fermer la connexion WebSocket
		return () => {
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
				reconnectTimeoutRef.current = null;
			}

			if (wsRef.current) {
				console.log("🧹 Fermeture WebSocket...");
				wsRef.current.close(1000, "Component unmount"); // Code 1000 = fermeture normale
				wsRef.current = null;
			}
		};
	}, [connectWebSocket]);

	// --------------------
	// ENVOI DES CHANGEMENTS
	// --------------------
	const sendDeltaChange = useCallback((changes) => {
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
			console.warn("⚠️ WebSocket non connecté");
			return false;
		}

		if (!Array.isArray(changes)) {
			console.error("❌ Changes doit être un array:", changes);
			return false;
		}

		const message = {
			type: "DELTA_CHANGE",
			changes: changes,
			timestamp: Date.now(),
		};

		console.log("📤 Envoi delta:", changes);
		try {
			wsRef.current.send(JSON.stringify(message));
			return true;
		} catch (error) {
			console.error("❌ Erreur envoi WebSocket:", error);
			return false;
		}
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

	// Méthodes pour définir les callbacks
	const setOnInitialContent = useCallback((callback) => {
		onInitialContentRef.current = callback;
	}, []);

	const setOnRemoteChange = useCallback((callback) => {
		onRemoteChangeRef.current = callback;
	}, []);

	// Méthode de reconnexion manuelle
	const reconnect = useCallback(() => {
		console.log("🔄 Reconnexion manuelle demandée");
		reconnectAttemptsRef.current = 0; // Reset compteur
		connectWebSocket();
	}, [connectWebSocket]);

	return {
		// État
		connectionStatus,
		participantCount,
		userId: userIdRef.current,

		// Méthodes
		sendDeltaChange,
		isApplyingRemoteChange,
		setApplyingRemoteChange,
		reconnect,

		// Callbacks à définir par le composant parent
		setOnInitialContent,
		setOnRemoteChange,
	};
};
