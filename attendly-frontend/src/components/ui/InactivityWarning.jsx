/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { Clock, LogOut } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";

const InactivityWarning = () => {
  const { showInactivityWarning, logout, resetInactivityTimer } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState(5 * 60); 

  useEffect(() => {
    if (!showInactivityWarning) {
      setTimeRemaining(5 * 60);
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showInactivityWarning, logout]);

  if (!showInactivityWarning) return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50">
      <div className="bg-white shadow-2xl mx-4 p-8 border border-red-200 rounded-2xl w-full max-w-sm">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 p-4 rounded-full">
            <Clock size={32} className="text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="mb-2 font-bold text-gray-900 text-xl text-center">
          Session Expiring Soon
        </h2>

        {/* Message */}
        <p className="mb-6 text-gray-600 text-sm text-center">
          Your session has been inactive for a while. You will be logged out in:
        </p>

        {/* Countdown */}
        <div className="bg-red-50 mb-6 p-4 rounded-lg text-center">
          <div className="font-mono font-bold text-red-600 text-4xl">
            {String(minutes).padStart(2, "0")}:
            {String(seconds).padStart(2, "0")}
          </div>
          <p className="mt-2 text-red-600 text-xs">minutes remaining</p>
        </div>

        {/* Warning Message */}
        <p className="mb-6 text-gray-500 text-xs text-center">
          Click below to continue your session, or you will be automatically
          logged out.
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              resetInactivityTimer();
            }}
            className="flex flex-1 justify-center items-center gap-2 bg-linear-to-r from-emerald-600 to-emerald-700 hover:brightness-110 px-4 py-3 rounded-lg font-semibold text-white active:scale-95 transition-all"
          >
            <Clock size={18} />
            Continue Session
          </button>
          <button
            onClick={logout}
            className="flex flex-1 justify-center items-center gap-2 bg-linear-to-r from-gray-200 to-gray-300 hover:brightness-110 px-4 py-3 rounded-lg font-semibold text-gray-900 active:scale-95 transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default InactivityWarning;
