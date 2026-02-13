import React from "react";
import { Navigate } from "react-router-dom";

// Telemed chatbot is now unified with the main AI interface
const TelemedChatbot = () => {
  return <Navigate to="/?mode=telemed" replace />;
};

export default TelemedChatbot;
