import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import { debugError, debugInfo } from "./utils/debug.js";

debugInfo("Inicializando aplicacion frontend.");

window.addEventListener("error", (event) => {
  debugError("window.error capturado.", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  });
});

window.addEventListener("unhandledrejection", (event) => {
  debugError("window.unhandledrejection capturado.", event.reason);
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
