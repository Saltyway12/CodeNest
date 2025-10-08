import { useContext } from "react";
import StreamChatContext from "./StreamChatContext.js";

/**
 * Simplifie l'accès au client Stream initialisé par le provider.
 */
const useStreamChat = () => {
  const context = useContext(StreamChatContext);
  if (!context) {
    throw new Error("useStreamChat doit être utilisé dans StreamChatProvider");
  }
  return context;
};

export default useStreamChat;

