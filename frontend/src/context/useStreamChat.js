import { useContext } from "react";
import StreamChatContext from "./StreamChatContext.js";

/**
 * Hook pour accéder au client Stream partout dans l'app
 */
const useStreamChat = () => {
        const context = useContext(StreamChatContext);
        if (!context) {
                throw new Error("useStreamChat doit être utilisé dans StreamChatProvider");
        }
        return context;
};

export default useStreamChat;

