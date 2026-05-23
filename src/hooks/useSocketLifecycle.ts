import { useEffect } from "react";
import { socket } from "@/api/socket";

/** Opens the WS connection once for the app lifetime. */
export function useSocketLifecycle() {
  useEffect(() => {
    socket.connect();
    return () => {
      // We intentionally keep the socket alive across React StrictMode mounts.
      // It will only be closed on full page unload.
    };
  }, []);
}
