import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId="277718466842-ajr820s0ra7i8rtb6op7am8hufbmlocl.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);
