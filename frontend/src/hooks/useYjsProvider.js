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

		const updatePeers = () => {
			setConnectedPeers(provider.awareness.getStates().size);
		};
		provider.awareness.on("update", updatePeers);
		updatePeers();

		setStatus("connected");

		return () => {
			provider.destroy();
			ydoc.destroy();
		};
	}, [roomId, url]);

	return {
		ydoc: ydocRef.current,
		provider: providerRef.current,
		connectedPeers,
		status,
	};
};
