/**
 * ---------------------------------------------------------
 *  WebSocket Message Validation Utility
 * ---------------------------------------------------------
 *  FR : Valide la structure minimale d’un message WebSocket.
 *       Cette validation empêche la réception de messages
 *       corrompus ou malformés avant qu'ils atteignent les
 *       handlers métier.
 *
 *  EN : Validates the minimal structure of an incoming
 *       WebSocket message. Prevents corrupted or malformed
 *       payloads from reaching business handlers.
 * ---------------------------------------------------------
 */

export function validateMessage(msg) {
	if (!msg || typeof msg !== "object") return false;
	if (!msg.type || typeof msg.type !== "string") return false;

	// FR : roomId est requis pour toutes les actions de rooms
	// EN : roomId is required for all room-related actions
	if (!msg.roomId || typeof msg.roomId !== "string") return false;

	return true;
}
