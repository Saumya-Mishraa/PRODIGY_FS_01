import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const [connectionState, setConnectionState] = useState("offline");

  useEffect(() => {
    if (!token || !user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnectionState("offline");
      return;
    }

    setConnectionState("connecting");

    const socket = io("https://nuvora-5171.onrender.com", {
      auth: { token },
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => setConnectionState("connected"));
    socket.on("disconnect", () => setConnectionState("connecting"));
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setConnectionState("connecting");
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connectionState }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);