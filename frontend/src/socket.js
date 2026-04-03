// src/socket.js
import { io } from "socket.io-client";

const isDevTunnel = location.origin.includes(".devtunnels.ms");
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const SOCKET_URL = isDevTunnel
  ? "https://d9666bbk-5173.asse.devtunnels.ms"
  : backendUrl;

const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ["websocket"],
});

export default socket;
