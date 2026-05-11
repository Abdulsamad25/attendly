import { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  AlertCircle,
  Plus,
  Check,
  Palmtree,
  Heart,
  Skull,
} from "lucide-react";
import Spinner from "../../components/ui/Spinner";
import { settingsApi, leaveTypeApi } from "../../api/admin";

const LEAVE_TYPE_ICONS = {
  "Annual Leave": { Icon: Palmtree, color: "bg-emerald-100 text-emerald-700" },
  "Sick Leave": { Icon: Heart, color: "bg-amber-100 text-amber-700" },
  Bereavement: { Icon: Skull, color: "bg-slate-100 text-slate-700" },
};

const AdminSettings = () => {
  // Attendance Rules State
  const [attendanceRules, setAttendanceRules] = useState({
    shiftStart: "",
    lateGracePeriod: 0,
    absentCutoffTime: "",
  });

  // Leave Types State
  const [leaveTypes, setLeaveTypes] = useState([]);

  const [editingLeaveType, setEditingLeaveType] = useState(null);

  // UI State
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from backend
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both settings and leave types in parallel
      const [settingsRes, leaveTypesRes] = await Promise.all([
        settingsApi.get(),
        leaveTypeApi.getAll(),
      ]);

      // Update attendance rules from backend
      if (settingsRes) {
        setAttendanceRules({
          shiftStart: settingsRes.shiftStart || "",
          lateGracePeriod: settingsRes.lateGracePeriod || 0,
          absentCutoffTime: settingsRes.absentCutoffTime || "",
        });
      }

      // Update leave types from backend
      if (leaveTypesRes && Array.isArray(leaveTypesRes)) {
        setLeaveTypes(leaveTypesRes);
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
      setError("Failed to load settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceRuleChange = (key, value) => {
    setAttendanceRules((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveAttendanceRules = async () => {
    setSaving(true);
    try {
      await settingsApi.update(attendanceRules);
      // Signal LeaveCalendar to refetch data
      sessionStorage.setItem("leaveTypeUpdated", Date.now().toString());
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (err) {
      console.error("Failed to save attendance rules:", err);
      setError("Failed to save attendance rules. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveTypeToggle = async (leaveTypeId) => {
    try {
      const leaveType = leaveTypes.find((lt) => lt._id === leaveTypeId);
      if (!leaveType) return;

      // Update local state optimistically
      setLeaveTypes((prev) =>
        prev.map((lt) =>
          lt._id === leaveTypeId ? { ...lt, is_active: !lt.is_active } : lt,
        ),
      );

      // Call API to save
      await leaveTypeApi.update(leaveTypeId, {
        is_active: !leaveType.is_active,
      });

      // Signal LeaveCalendar to refetch data
      sessionStorage.setItem("leaveTypeUpdated", Date.now().toString());

      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (err) {
      console.error("Failed to update leave type:", err);
      // Revert local state on error
      await fetchSettings();
      setError("Failed to update leave type. Please try again.");
    }
  };

  const handleLeaveTypeChange = (leaveTypeId, field, value) => {
    if (!editingLeaveType || editingLeaveType._id !== leaveTypeId) {
      const leaveType = leaveTypes.find((lt) => lt._id === leaveTypeId);
      setEditingLeaveType({ ...leaveType });
    }

    setEditingLeaveType((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLeaveTypeSave = async () => {
    if (!editingLeaveType) return;

    try {
      setSaving(true);
      await leaveTypeApi.update(editingLeaveType._id, {
        cap_days: editingLeaveType.cap_days,
        advance_days: editingLeaveType.advance_days,
        is_active: editingLeaveType.is_active,
      });

      // Update local state
      setLeaveTypes((prev) =>
        prev.map((lt) =>
          lt._id === editingLeaveType._id ? editingLeaveType : lt,
        ),
      );

      // Signal LeaveCalendar to refetch data
      sessionStorage.setItem("leaveTypeUpdated", Date.now().toString());

      setEditingLeaveType(null);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (err) {
      console.error("Failed to save leave type:", err);
      setError("Failed to save leave type. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 px-4 md:px-8 py-8">
        <div className="flex items-center gap-3 bg-red-50 p-4 border border-red-200 rounded-xl">
          <AlertCircle size={20} className="text-red-600" />
          <div>
            <p className="font-medium text-red-700 text-sm">{error}</p>
            <button
              onClick={fetchSettings}
              className="mt-2 font-semibold text-red-600 hover:text-red-700 text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 md:px-8 py-8">
      {/* Page Header */}
      <div className="mb-10">
        <h2 className="mb-2 font-extrabold text-gray-900 text-3xl tracking-tight">
          Admin Settings
        </h2>
        <p className="max-w-2xl text-gray-500 text-sm">
          Configure global enterprise rules for time-tracking, attendance
          thresholds, and leave entitlement policy.
        </p>
      </div>

      {/* Success Message */}
      {savedMessage && (
        <div className="flex items-center gap-3 bg-emerald-50 p-4 border border-emerald-200 rounded-xl">
          <Check size={20} className="text-emerald-600" />
          <span className="font-medium text-emerald-700 text-sm">
            Settings updated successfully!
          </span>
        </div>
      )}

      {/* Bento Grid Layout */}
      <div className="gap-6 grid grid-cols-12">
        {/* ATTENDANCE RULES SECTION */}
        <div className="space-y-6 col-span-12 lg:col-span-5">
          <section className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-indigo-600 border-l-4">
              <h3 className="flex items-center gap-2 mb-1 font-semibold text-gray-900 text-lg">
                <Clock size={20} className="text-indigo-600" />
                Attendance Rules
              </h3>
              <p className="font-semibold text-gray-500 text-xs uppercase tracking-wider">
                Core Shift Parameters
              </p>
            </div>

            {/* Content */}
            <div className="space-y-6 px-6 pb-8">
              {/* Shift Start Time */}
              <div className="space-y-2">
                <label className="flex justify-between font-medium text-gray-900 text-sm">
                  Standard Shift Start
                  <span className="font-normal text-gray-500 text-xs">
                    24-hour format
                  </span>
                </label>
                <input
                  type="time"
                  value={attendanceRules.shiftStart}
                  onChange={(e) =>
                    handleAttendanceRuleChange("shiftStart", e.target.value)
                  }
                  className="bg-gray-50 px-4 py-3 border border-gray-300 focus:border-indigo-600 rounded-xl focus:ring-2 focus:ring-indigo-600/20 w-full text-gray-900 transition-all"
                />
              </div>

              {/* Late Grace Period */}
              <div className="space-y-2">
                <label className="font-medium text-gray-900 text-sm">
                  Late Grace Period (Minutes)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={attendanceRules.lateGracePeriod}
                    onChange={(e) =>
                      handleAttendanceRuleChange(
                        "lateGracePeriod",
                        parseInt(e.target.value),
                      )
                    }
                    className="flex-1 bg-gray-50 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600/20 text-gray-900 transition-all"
                  />
                  <span className="w-12 font-medium text-gray-500 text-sm">
                    min
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Time allowed after shift start before marked as 'Late'.
                </p>
              </div>

              {/* Absent Cutoff Time */}
              <div className="space-y-2">
                <label className="font-medium text-gray-900 text-sm">
                  Absent Cutoff Time
                </label>
                <input
                  type="time"
                  value={attendanceRules.absentCutoffTime}
                  onChange={(e) =>
                    handleAttendanceRuleChange(
                      "absentCutoffTime",
                      e.target.value,
                    )
                  }
                  className="bg-gray-50 px-4 py-3 border border-gray-300 focus:border-indigo-600 rounded-xl focus:ring-2 focus:ring-indigo-600/20 w-full text-gray-900 transition-all"
                />
                <p className="text-[11px] text-gray-500">
                  Employees not clocked in by this time are auto-marked
                  'Absent'.
                </p>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveAttendanceRules}
                disabled={saving}
                className="bg-linear-to-r from-indigo-600 to-indigo-700 disabled:opacity-60 shadow-indigo-600/10 shadow-lg hover:brightness-110 px-4 py-3 rounded-xl w-full font-semibold text-white active:scale-[0.98] transition-all"
              >
                {saving ? "Updating..." : "Update Core Rules"}
              </button>
            </div>
          </section>

          {/* Info Card */}
          <div className="flex gap-4 bg-indigo-50 p-6 border border-indigo-200 rounded-xl">
            <AlertCircle
              size={20}
              className="mt-0.5 text-indigo-600 shrink-0"
            />
            <div>
              <p className="mb-1 font-bold text-indigo-900 text-sm">
                Global Shift Logic
              </p>
              <p className="text-indigo-800 text-xs leading-relaxed">
                Changes here affect all staff members except those with custom
                shift assignments override in their profiles.
              </p>
            </div>
          </div>
        </div>

        {/* LEAVE TYPES SECTION */}
        <div className="col-span-12 lg:col-span-7">
          <section className="flex flex-col bg-white shadow-sm border border-gray-200 rounded-2xl h-full overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-slate-600 border-l-4">
              <div>
                <h3 className="flex items-center gap-2 mb-1 font-semibold text-gray-900 text-lg">
                  <Calendar size={20} className="text-slate-600" />
                  Leave Types
                </h3>
                <p className="font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  Policy Entitlements
                </p>
              </div>
              <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg font-bold text-gray-900 text-xs transition-colors">
                <Plus size={16} />
                ADD NEW TYPE
              </button>
            </div>

            {/* Leave Types List */}
            <div className="flex-1 space-y-4 px-6 pb-6 overflow-y-auto">
              {leaveTypes.map((leaveType) => (
                <div
                  key={leaveType._id}
                  className="hover:bg-gray-50 p-4 border border-gray-100 rounded-xl transition-colors"
                >
                  {/* Leave Type Header */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${
                          LEAVE_TYPE_ICONS[leaveType.name]?.color ||
                          "bg-blue-100 text-blue-700"
                        } flex items-center justify-center`}
                      >
                        {(() => {
                          const IconComponent =
                            LEAVE_TYPE_ICONS[leaveType.name]?.Icon;
                          return IconComponent ? (
                            <IconComponent size={20} />
                          ) : (
                            <Calendar size={20} />
                          );
                        })()}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">
                          {leaveType.name}
                        </h4>
                        <p className="text-gray-500 text-xs">
                          {leaveType.description}
                        </p>
                      </div>
                    </div>

                    {/* Toggle */}
                    <label className="inline-flex relative items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={leaveType.is_active}
                        onChange={() => handleLeaveTypeToggle(leaveType._id)}
                        className="sr-only peer"
                      />
                      <div className="peer after:top-0.5 after:left-0.5 after:absolute bg-gray-300 after:bg-white peer-checked:bg-emerald-500 after:border after:border-gray-300 peer-checked:after:border-white rounded-full after:rounded-full w-11 after:w-5 h-6 after:h-5 after:content-[''] after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>

                  {/* Leave Type Inputs */}
                  <div className="gap-4 grid grid-cols-2">
                    <div>
                      <label className="block mb-1 font-extrabold text-[10px] text-gray-500 uppercase">
                        Annual Cap (Days)
                      </label>
                      <input
                        type="number"
                        value={
                          editingLeaveType?._id === leaveType._id
                            ? editingLeaveType.cap_days
                            : leaveType.cap_days
                        }
                        onChange={(e) =>
                          handleLeaveTypeChange(
                            leaveType._id,
                            "cap_days",
                            parseInt(e.target.value),
                          )
                        }
                        className="bg-white px-3 py-2 border border-gray-300 focus:border-indigo-600 rounded-lg focus:ring-1 focus:ring-indigo-600 w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-extrabold text-[10px] text-gray-500 uppercase">
                        Notice Period (Days)
                      </label>
                      <input
                        type="number"
                        value={
                          editingLeaveType?._id === leaveType._id
                            ? editingLeaveType.advance_days
                            : leaveType.advance_days
                        }
                        onChange={(e) =>
                          handleLeaveTypeChange(
                            leaveType._id,
                            "advance_days",
                            parseInt(e.target.value),
                          )
                        }
                        className="bg-white px-3 py-2 border border-gray-300 focus:border-indigo-600 rounded-lg focus:ring-1 focus:ring-indigo-600 w-full text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex justify-end bg-gray-50 p-6 border-gray-200 border-t rounded-b-xl">
              <button
                onClick={handleLeaveTypeSave}
                className="bg-slate-600 hover:bg-slate-700 disabled:opacity-60 px-6 py-2.5 rounded-xl font-bold text-white transition-all"
                disabled={!editingLeaveType}
              >
                Save Policy Changes
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Footer Meta */}
      <footer className="flex md:flex-row flex-col justify-between items-center mt-12 pt-8 border-gray-200 border-t text-gray-500">
        <div className="text-xs">
          Last audit: October 24, 2023 by Marcus Chen
        </div>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a
            href="#"
            className="font-bold hover:text-indigo-600 text-xs transition-colors"
          >
            EXPORT AUDIT LOG
          </a>
          <a
            href="#"
            className="font-bold hover:text-indigo-600 text-xs transition-colors"
          >
            SECURITY POLICY
          </a>
          <a
            href="#"
            className="font-bold hover:text-indigo-600 text-xs transition-colors"
          >
            HELP CENTER
          </a>
        </div>
      </footer>
    </div>
  );
};

export default AdminSettings;
