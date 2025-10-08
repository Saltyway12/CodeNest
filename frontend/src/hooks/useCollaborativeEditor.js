import { useRef, useState, useEffect, useCallback } from "react";

/**
 * Hook personnalisé pour gérer l'édition collaborative temps réel
 * Établit une connexion WebSocket pour la synchronisation de contenu
 * Gère la reconnexion automatique et les changements collaboratifs
 * @param {string} callId - Identifiant unique de la session collaborative
 * @returns {Object} État de connexion et méthodes de synchronisation
 */
export const useCollaborativeEditor = (callId) => {
	const wsRef = useRef(null);
	const isApplyingRemoteChangeRef = useRef(false);
	const userIdRef = useRef(`user-${Math.random().toString(36).substr(2, 9)}`);

	const [connectionStatus, setConnectionStatus] = useState("disconnected");
	const [participantCount, setParticipantCount] = useState(1);

	// Références pour les callbacks afin d'éviter les re-renders inutiles
        const onInitialContentRef = useRef(null);
        const onRemoteChangeRef = useRef(null);
        const onRemoteLanguageChangeRef = useRef(null);

	// Configuration de la reconnexion automatique
	const reconnectTimeoutRef = useRef(null);
	const reconnectAttemptsRef = useRef(0);
	const maxReconnectAttempts = 5;

	/**
	 * Gestionnaire des messages WebSocket entrants
	 * Traite les différents types de messages collaboratifs
	 * @param {Object} message - Message WebSocket parsé
	 */
	const handleWebSocketMessage = useCallback((message) => {
		console.log("Message WebSocket reçu:", message.type);

		switch (message.type) {
                        case "INITIAL_CONTENT":
                                console.log("Réception contenu initial");
                                if (onInitialContentRef.current) {
                                        onInitialContentRef.current(message);
                                }
                                break;

                        case "DELTA_CHANGE":
                                console.log("Application delta distant:", message.changes);

				// Validation critique des changements reçus
				if (!message.changes) {
					console.error("Changes est undefined ou null:", message);
					return;
				}

				if (!Array.isArray(message.changes)) {
					console.error(
						"Changes n'est pas un array:",
						typeof message.changes,
						message.changes
					);
					return;
				}

				if (message.changes.length === 0) {
					console.warn("Array changes vide");
					return;
				}

				if (onRemoteChangeRef.current) {
					onRemoteChangeRef.current(message.changes);
				} else {
					console.warn("onRemoteChangeRef.current non défini");
				}
                                break;

                        case "LANGUAGE_CHANGE":
                                if (onRemoteLanguageChangeRef.current) {
                                        onRemoteLanguageChangeRef.current(message.language);
                                }
                                break;

			case "USER_JOINED":
			case "USER_LEFT":
				if (typeof message.participantCount === "number") {
					setParticipantCount(message.participantCount);
					console.log(`Participants: ${message.participantCount}`);
				}
				break;

			default:
				console.warn(`Message WebSocket inconnu:`, message.type);
		}
	}, []);

	/**
	 * Établit la connexion WebSocket avec gestion de reconnexion
	 * Configure les gestionnaires d'événements et la logique de retry
	 */
	const connectWebSocket = useCallback(() => {
		if (!callId) return;

		// Nettoyage des ressources précédentes
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}

		if (wsRef.current) {
			wsRef.current.close();
			wsRef.current = null;
		}

		// Configuration de l'URL WebSocket selon l'environnement
		const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		const wsHost = window.location.host;
		const wsUrl = `${wsProtocol}//${wsHost}/ws?callId=${callId}`;

		console.log(
			`Connexion WebSocket à : ${wsUrl} (tentative ${
				reconnectAttemptsRef.current + 1
			})`
		);
		setConnectionStatus("connecting");

		try {
			const ws = new WebSocket(wsUrl);
			wsRef.current = ws;

			// Timeout de sécurité pour la connexion
			const connectionTimeout = setTimeout(() => {
				if (ws.readyState === WebSocket.CONNECTING) {
					console.warn("Timeout de connexion WebSocket");
					ws.close();
				}
			}, 10000);

			ws.onopen = () => {
				clearTimeout(connectionTimeout);
				console.log("WebSocket connecté");
				setConnectionStatus("connected");
				reconnectAttemptsRef.current = 0;
			};

			ws.onmessage = (event) => {
				try {
					const message = JSON.parse(event.data);
					handleWebSocketMessage(message);
				} catch (error) {
					console.error("Erreur parsing message WebSocket:", error);
				}
			};

			ws.onclose = (event) => {
				clearTimeout(connectionTimeout);
				console.log("WebSocket fermé:", event.code, event.reason);

				if (wsRef.current === ws) {
					setConnectionStatus("disconnected");
					wsRef.current = null;

					// Logique de reconnexion automatique avec backoff exponentiel
					if (
						event.code !== 1000 &&
						reconnectAttemptsRef.current < maxReconnectAttempts
					) {
						const delay = Math.min(
							1000 * Math.pow(2, reconnectAttemptsRef.current),
							30000
						);
						console.log(
							`Reconnexion dans ${delay}ms (tentative ${
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
							"Nombre maximum de tentatives de reconnexion atteint"
						);
						setConnectionStatus("error");
					}
				}
			};

			ws.onerror = (error) => {
				clearTimeout(connectionTimeout);
				console.error("Erreur WebSocket:", error);
				setConnectionStatus("error");
			};
		} catch (error) {
			console.error("Erreur création WebSocket:", error);
			setConnectionStatus("error");
		}
	}, [callId, handleWebSocketMessage]);

	// Initialisation de la connexion WebSocket
	useEffect(() => {
		connectWebSocket();

		// Nettoyage lors du démontage du composant
		return () => {
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
				reconnectTimeoutRef.current = null;
			}

			if (wsRef.current) {
				console.log("Fermeture WebSocket...");
				wsRef.current.close(1000, "Component unmount");
				wsRef.current = null;
			}
		};
	}, [connectWebSocket]);

	/**
	 * Envoie les changements collaboratifs via WebSocket
	 * @param {Array} changes - Liste des modifications à synchroniser
	 * @returns {boolean} Succès de l'envoi
	 */
        const sendDeltaChange = useCallback((changes) => {
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                        console.warn("WebSocket non connecté");
                        return false;
		}

		if (!Array.isArray(changes)) {
			console.error("Changes doit être un array:", changes);
			return false;
		}

		const message = {
			type: "DELTA_CHANGE",
			changes: changes,
			timestamp: Date.now(),
		};

		console.log("Envoi delta:", changes);
		try {
			wsRef.current.send(JSON.stringify(message));
			return true;
		} catch (error) {
			console.error("Erreur envoi WebSocket:", error);
			return false;
		}
        }, []);

        const sendLanguageChange = useCallback((language) => {
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                        console.warn("WebSocket non connecté pour changement de langage");
                        return false;
                }

                if (typeof language !== "string" || language.trim() === "") {
                        console.warn("Langage invalide pour synchronisation:", language);
                        return false;
                }

                const message = {
                        type: "LANGUAGE_CHANGE",
                        language,
                        userId: userIdRef.current,
                        timestamp: Date.now(),
                };

                try {
                        wsRef.current.send(JSON.stringify(message));
                        return true;
                } catch (error) {
                        console.error("Erreur envoi changement de langage:", error);
                        return false;
                }
        }, []);

	// Utilitaires de gestion d'état
	const isApplyingRemoteChange = useCallback(() => {
		return isApplyingRemoteChangeRef.current;
	}, []);

	const setApplyingRemoteChange = useCallback((value) => {
		isApplyingRemoteChangeRef.current = value;
	}, []);

	// Configuration des callbacks depuis le composant parent
	const setOnInitialContent = useCallback((callback) => {
		onInitialContentRef.current = callback;
	}, []);

        const setOnRemoteChange = useCallback((callback) => {
                onRemoteChangeRef.current = callback;
        }, []);

        const setOnRemoteLanguageChange = useCallback((callback) => {
                onRemoteLanguageChangeRef.current = callback;
        }, []);

	// Méthode de reconnexion manuelle
	const reconnect = useCallback(() => {
		console.log("Reconnexion manuelle demandée");
		reconnectAttemptsRef.current = 0;
		connectWebSocket();
	}, [connectWebSocket]);

	return {
		// État de la connexion collaborative
		connectionStatus,
		participantCount,
		userId: userIdRef.current,

		// Méthodes de synchronisation
                sendDeltaChange,
                sendLanguageChange,
                isApplyingRemoteChange,
                setApplyingRemoteChange,
                reconnect,

                // Configuration des callbacks
                setOnInitialContent,
                setOnRemoteChange,
                setOnRemoteLanguageChange,
        };
};
