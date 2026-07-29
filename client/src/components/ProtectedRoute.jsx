import React from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  /*
   * Wait for authentication state to be resolved
   * before deciding whether to redirect.
   */
  if (loading) {
    return (
      <div
        className="
          min-h-screen
          w-full
          flex
          items-center
          justify-center
          bg-bg
          text-muted
          px-4
        "
      >
        <motion.div
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.25,
          }}
          className="
            flex
            flex-col
            items-center
            justify-center
            gap-3
            text-center
          "
        >
          <Loader2
            size={24}
            className="
              text-ember
              animate-spin
            "
          />

          <p className="
            text-sm
            sm:text-base
            font-medium
            text-muted
          ">
            Loading Nuvora…
          </p>
        </motion.div>
      </div>
    );
  }

  /*
   * Redirect unauthenticated users to login.
   */
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  /*
   * Authenticated users can access the protected route.
   */
  return children;
};

export default ProtectedRoute;
