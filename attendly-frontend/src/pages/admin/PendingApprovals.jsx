import { useEffect, useState } from "react";
import StaffDirectory from "./StaffDirectory";
import { staffApi } from "../../api/admin";

const PendingApprovals = () => {
  const [debugData, setDebugData] = useState(null);
  const [debugError, setDebugError] = useState("");

  useEffect(() => {
    const fetchDebug = async () => {
      try {
        setDebugError("");
        const response = await staffApi.getPendingDebug();
        setDebugData(response);
      } catch (error) {
        setDebugError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load pending debug data.",
        );
      }
    };

    fetchDebug();
  }, []);

  return (
    <div className="space-y-4">
      {debugData && (
        <div className="bg-indigo-50 p-4 border border-indigo-200 rounded-lg text-sm">
          <p className="font-semibold text-indigo-900">Pending Debug Snapshot</p>
          <p className="mt-1 text-indigo-800">
            Admin: {debugData.adminUser?.email} | Company:{" "}
            {debugData.company?.name || "Unknown"} | Pending in this company:{" "}
            {debugData.pendingCount}
          </p>
        </div>
      )}

      {debugError && (
        <div className="bg-red-50 p-4 border border-red-200 rounded-lg text-red-700 text-sm">
          {debugError}
        </div>
      )}

      <StaffDirectory
        defaultStatusFilter="pending"
        title="Pending Approvals"
        description="Review newly registered staff accounts and approve them quickly."
      />
    </div>
  );
};

export default PendingApprovals;
