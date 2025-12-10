/**
 * ---------------------------------------------------------
 *  Chat Service
 * ---------------------------------------------------------
 *  FR : Contient la logique métier liée au chat : création
 *       de channel, récupération des messages, envoi, etc.
 *
 *  EN : Contains all business logic related to chat features:
 *       channel creation, message retrieval, sending, etc.
 * ---------------------------------------------------------
 */

import { StreamChat } from "stream-chat";
import User from "../models/User.js";

const client = StreamChat.getInstance(
	process.env.STREAM_API_KEY,
	process.env.STREAM_API_SECRET
);

/* ---------------------------------------------------------
 *  Ensure a channel exists between two users
 * ------------------------------------------------------- */
export async function getOrCreateChannel(userId, partnerId) {
	const members = [userId, partnerId];

	// V1 behavior: "messaging" type channels
	const channel = client.channel("messaging", {
		members,
	});

	await channel.create();
	return channel;
}

/* ---------------------------------------------------------
 *  Retrieve messages in a channel
 * ------------------------------------------------------- */
export async function getMessages(userId, partnerId) {
	const channel = await getOrCreateChannel(userId, partnerId);
	const messages = await channel.query({
		messages: { limit: 50 },
	});
	return messages.messages;
}

/* ---------------------------------------------------------
 *  Send a message
 * ------------------------------------------------------- */
export async function sendMessage(userId, partnerId, text) {
	const channel = await getOrCreateChannel(userId, partnerId);
	const response = await channel.sendMessage({
		text,
		user_id: userId,
	});
	return response.message;
}

/* ---------------------------------------------------------
 *  List all channels for a user
 * ------------------------------------------------------- */
export async function getUserChannels(userId) {
	const filters = { members: { $in: [userId] } };
	const channels = await client.queryChannels(filters);
	return channels;
}
