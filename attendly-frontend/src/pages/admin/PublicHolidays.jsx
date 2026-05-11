import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Download, Info} from "lucide-react";
import Spinner from "../../components/ui/Spinner";
import { holidayApi } from "../../api/admin";

const COUNTRY_CODES = {
  US: "United States",
  GB: "United Kingdom",
  IN: "India",
  DE: "Germany",
  FR: "France",
  CA: "Canada",
  AU: "Australia",
  BR: "Brazil",
  JP: "Japan",
  MX: "Mexico",
  ZA: "South Africa",
  SG: "Singapore",
  PH: "Philippines",
  NG: "Nigeria",
};

const PublicHolidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncCountry, setSyncCountry] = useState("US");
  const [syncYear, setSyncYear] = useState(new Date().getFullYear());
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await holidayApi.getAll();
      const data = response.data || [];

      // Sort by date
      const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setHolidays(sorted);
    } catch (err) {
      setError(err.message || "Failed to fetch holidays");
      console.error("Holidays fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (date) => {
    const today = new Date();
    const holidayDate = new Date(date);
    if (holidayDate < today) return "Passed";
    if (holidayDate.getTime() - today.getTime() < 7 * 24 * 60 * 60 * 1000)
      return "Upcoming";
    return "Scheduled";
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this holiday?"))
      return;
    try {
      await holidayApi.delete(id);
      setHolidays(holidays.filter((h) => h._id !== id));
    } catch (err) {
      alert("Failed to delete holiday: " + err.message);
    }
  };

  const handleSyncHolidays = async () => {
    if (!syncCountry || !syncYear) {
      setSyncMessage("Please select country and year");
      return;
    }

    setSyncing(true);
    setSyncMessage("");
    try {
      const response = await holidayApi.syncHolidays({
        country_code: syncCountry,
        year: syncYear,
      });
      setSyncMessage(response.data.message);
      setTimeout(() => {
        fetchHolidays();
        setSyncModalOpen(false);
      }, 1500);
    } catch (err) {
      setSyncMessage(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 p-4 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={fetchHolidays}
            className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="font-bold text-gray-900 text-3xl">
                Public Holiday Manager
              </h1>
              <p className="mt-1 text-gray-600">
                Maintain the corporate calendar by managing regional and
                national holidays for all office branches.
              </p>
            </div>
            <div className="flex sm:flex-row flex-col gap-2">
              <button
                onClick={() => setSyncModalOpen(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium text-white transition-colors"
              >
                <Sync size={18} />
                <span className="hidden sm:inline">Sync Real Holidays</span>
              </button>
              <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium text-white transition-colors">
                <Plus size={18} />
                <span className="hidden sm:inline">Add Holiday</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="gap-4 grid grid-cols-1 md:grid-cols-3">
            <div className="bg-white p-6 border border-gray-200 rounded-lg text-center">
              <div className="flex justify-center mb-2">
                <input type="checkbox" defaultChecked className="w-6 h-6" />
              </div>
              <p className="font-bold text-gray-900 text-3xl">
                {holidays.length} Days
              </p>
              <p className="mt-1 text-gray-600 text-sm">
                Total scheduled public holidays globally.
              </p>
            </div>
            <div className="bg-white p-6 border border-gray-200 rounded-lg">
              <p className="font-medium text-gray-600 text-sm">
                CURRENT YEAR 2024
              </p>
              <p className="mt-2 font-bold text-gray-900 text-3xl">
                {
                  holidays.filter(
                    (h) => new Date(h.date).getFullYear() === 2024,
                  ).length
                }
              </p>
            </div>
            <div className="bg-indigo-600 p-6 rounded-lg text-white">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-indigo-100 text-sm">NEXT HOLIDAY</p>
                  {holidays.find((h) => getStatus(h.date) !== "Passed") ? (
                    <>
                      <p className="mt-2 font-bold text-2xl">
                        {
                          holidays.find((h) => getStatus(h.date) !== "Passed")
                            ?.name
                        }
                      </p>
                      <p className="mt-1 text-indigo-100 text-sm">
                        {new Date(
                          holidays.find((h) => getStatus(h.date) !== "Passed")
                            ?.date,
                        ).toLocaleDateString()}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 font-bold text-2xl">No Upcoming</p>
                  )}
                </div>
                <div className="text-4xl">📅</div>
              </div>
              <p className="mt-3 text-indigo-100 text-xs">DAYS REMAINING</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 border border-gray-200 rounded-lg">
            <div className="flex sm:flex-row flex-col items-center gap-4">
              <div className="flex-1">
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full">
                  <option>All Holidays</option>
                  <option>Global</option>
                  <option>Religious</option>
                  <option>Regional (US)</option>
                </select>
              </div>
              <button className="flex items-center gap-2 hover:bg-gray-50 px-4 py-2 border border-gray-300 rounded-lg font-medium transition-colors">
                <Download size={18} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Holiday Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {holidays.length === 0 ? (
              <div className="flex justify-center items-center p-12 text-center">
                <div>
                  <p className="font-medium text-gray-600 text-lg">
                    No holidays found
                  </p>
                  <p className="mt-1 text-gray-500 text-sm">
                    Start by adding a new holiday
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-gray-200 border-b">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-gray-700 text-sm text-left">
                        DATE
                      </th>
                      <th className="px-6 py-3 font-semibold text-gray-700 text-sm text-left">
                        HOLIDAY NAME
                      </th>
                      <th className="hidden md:table-cell px-6 py-3 font-semibold text-gray-700 text-sm text-left">
                        CATEGORY
                      </th>
                      <th className="px-6 py-3 font-semibold text-gray-700 text-sm text-left">
                        STATUS
                      </th>
                      <th className="px-6 py-3 font-semibold text-gray-700 text-sm text-center">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {holidays.map((holiday, idx) => {
                      const status = getStatus(holiday.date);
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-gray-50 border-gray-200 border-b transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {new Date(holiday.date).toLocaleDateString()}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {new Date(holiday.date).toLocaleDateString(
                                  "default",
                                  { weekday: "long" },
                                )}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {holiday.name}
                          </td>
                          <td className="hidden md:table-cell px-6 py-4">
                            <span className="text-gray-600 text-sm">
                              {holiday.category || "Global"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                                status === "Passed"
                                  ? "bg-gray-100 text-gray-700"
                                  : status === "Upcoming"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center items-center gap-2">
                              <button className="hover:bg-gray-200 p-1 rounded transition-colors">
                                <Edit size={16} className="text-gray-600" />
                              </button>
                              <button
                                onClick={() => handleDelete(holiday._id)}
                                className="hover:bg-gray-200 p-1 rounded transition-colors"
                              >
                                <Trash2 size={16} className="text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sync Modal */}
          {syncModalOpen && (
            <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
              <div className="bg-white mx-4 p-6 rounded-lg w-full max-w-sm">
                <h2 className="mb-4 font-bold text-gray-900 text-xl">
                  Sync Real Public Holidays
                </h2>
                <p className="mb-4 text-gray-600 text-sm">
                  Select a country and year to fetch and sync real public
                  holidays to your calendar.
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block mb-2 font-medium text-gray-700 text-sm">
                      Country
                    </label>
                    <select
                      value={syncCountry}
                      onChange={(e) => setSyncCountry(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                    >
                      {Object.entries(COUNTRY_CODES).map(([code, name]) => (
                        <option key={code} value={code}>
                          {name} ({code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-gray-700 text-sm">
                      Year
                    </label>
                    <select
                      value={syncYear}
                      onChange={(e) => setSyncYear(parseInt(e.target.value))}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                    >
                      {[2026, 2027, 2028, 2029, 2030].map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {syncMessage && (
                  <div
                    className={`p-3 rounded mb-4 text-sm ${
                      syncMessage.includes("Error")
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {syncMessage}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSyncModalOpen(false);
                      setSyncMessage("");
                    }}
                    className="flex-1 hover:bg-gray-50 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 transition-colors"
                    disabled={syncing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSyncHolidays}
                    className="flex flex-1 justify-center items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-2 rounded-lg font-medium text-white transition-colors"
                    disabled={syncing}
                  >
                    {syncing ? (
                      <>
                        <Spinner />
                        Syncing...
                      </>
                    ) : (
                      <>
                        
                        Sync Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="bg-blue-50 p-6 border border-blue-200 rounded-lg">
            <div className="flex gap-4">
              <Info size={24} className="flex-shrink-0 mt-0.5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">
                  Holiday Impact on Payroll
                </h3>
                <p className="mt-1 text-blue-800 text-sm">
                  Holidays marked as paid will be calculated at 100% of base
                  salary. Absences on non-paid holidays will result in standard
                  deduction calculations.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PublicHolidays;
