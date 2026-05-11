import { useState, useEffect } from "react";
import { Search, Filter, Plus } from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge";
import Spinner from "../../components/ui/Spinner";
import { staffApi } from "../../api/admin";

const StaffDirectory = ({
  defaultStatusFilter = "all",
  title = "Staff Directory",
  description = "Manage your global workforce and team assignments.",
}) => {
  const [staff, setStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState(defaultStatusFilter);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createMessage, setCreateMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "Integration",
    role: "staff",
    salary: 0,
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await staffApi.getAll();
      setStaff(response.staff || []);
    } catch (err) {
      setError(err.message || "Failed to fetch staff");
      console.error("Staff fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.department) {
      setCreateError("Please fill in all required fields");
      return;
    }

    setCreating(true);
    setCreateError(null);
    setCreateMessage("");
    try {
      const response = await staffApi.create(formData);
      setCreateMessage(response.message || "Staff created successfully!");
      setTimeout(() => {
        setShowCreateModal(false);
        setFormData({
          name: "",
          email: "",
          department: "Integration",
          role: "staff",
          salary: 0,
        });
        fetchStaff();
      }, 1500);
    } catch (err) {
      setCreateError(
        err.response?.data?.message || err.message || "Failed to create staff",
      );
    } finally {
      setCreating(false);
    }
  };

  const departments = [
    "All",
    ...new Set(staff.map((member) => member.department || "Unassigned")),
  ];

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept =
      departmentFilter === "All" || member.department === departmentFilter;
    const matchesStatus =
      statusFilter === "all" || member.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleActivate = async (id) => {
    try {
      await staffApi.activate(id);
      await fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to activate staff member");
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await staffApi.deactivate(id);
      await fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to deactivate staff member");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 p-4 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={fetchStaff}
            className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-bold text-gray-900 text-2xl sm:text-3xl">{title}</h1>
          <p className="mt-1 text-gray-600 text-sm sm:text-base">
            {description}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium text-white transition-colors shrink-0"
        >
          <Plus size={18} />
          <span>Add New Staff</span>
        </button>
      </div>

      {/* Stats */}
      <div className="gap-3 sm:gap-4 grid grid-cols-2 sm:grid-cols-4">
        {[
          {
            label: "Total Staff",
            value: staff.length.toLocaleString(),
            change: "+12%",
          },
          {
            label: "Departments",
            value: new Set(staff.map((s) => s.department || "Unassigned")).size,
            change: "-",
          },
          {
            label: "Active",
            value: staff.filter((s) => s.status === "active").length,
            change: "working",
          },
          {
            label: "Pending",
            value: staff.filter((s) => s.status === "pending").length,
            change: "action req.",
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-3 sm:p-4 border border-gray-200 rounded-lg"
          >
            <p className="text-gray-600 text-xs sm:text-sm">{stat.label}</p>
            <p className="mt-1 font-bold text-gray-900 text-xl sm:text-2xl">
              {stat.value}
            </p>
            <p className="mt-1 text-gray-500 text-xs">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 border border-gray-200 rounded-lg">
        <div className="flex sm:flex-row flex-col gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search size={18} className="top-3 left-3 absolute text-gray-400" />
            <input
              type="text"
              placeholder="Search staff members, roles or teams..."
              className="py-2 pr-4 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-0 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending approval</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-0 text-sm"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <button className="flex items-center gap-2 hover:bg-gray-50 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm transition-colors shrink-0">
              <Filter size={16} />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {filteredStaff.length === 0 ? (
          <div className="flex justify-center items-center p-12 text-center">
            <div>
              <p className="font-medium text-gray-600 text-lg">
                No staff members found
              </p>
              <p className="mt-1 text-gray-500 text-sm">
                Try adjusting your filters or search
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead className="bg-gray-50 border-gray-200 border-b">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 font-semibold text-gray-700 text-xs sm:text-sm text-left">
                      STAFF MEMBER
                    </th>
                    <th className="hidden md:table-cell px-6 py-3 font-semibold text-gray-700 text-xs sm:text-sm text-left">
                      DEPARTMENT
                    </th>
                    <th className="hidden lg:table-cell px-6 py-3 font-semibold text-gray-700 text-xs sm:text-sm text-left">
                      ROLE
                    </th>
                    <th className="px-4 sm:px-6 py-3 font-semibold text-gray-700 text-xs sm:text-sm text-left">
                      STATUS
                    </th>
                    <th className="px-4 sm:px-6 py-3 font-semibold text-gray-700 text-xs sm:text-sm text-center">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((member) => (
                    <tr
                      key={member._id}
                      className="hover:bg-gray-50 border-gray-200 border-b transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="flex justify-center items-center bg-indigo-100 rounded-full w-8 sm:w-10 h-8 sm:h-10 font-semibold text-indigo-600 text-sm shrink-0">
                            {member.avatar}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {member.name}
                            </p>
                            <p className="text-gray-500 text-xs truncate">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4">
                        <p className="text-gray-700 text-sm">{member.department}</p>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4">
                        <p className="text-gray-600 text-sm">{member.role}</p>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <StatusBadge status={member.status} />
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex justify-center items-center gap-1 sm:gap-2">
                          {member.status === "pending" ? (
                            <button
                              onClick={() => handleActivate(member._id)}
                              className="bg-emerald-600 hover:bg-emerald-700 px-2 py-1 rounded text-white text-xs transition-colors"
                            >
                              Activate
                            </button>
                          ) : member.status === "active" ? (
                            <button
                              onClick={() => handleDeactivate(member._id)}
                              className="bg-amber-600 hover:bg-amber-700 px-2 py-1 rounded text-white text-xs transition-colors"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(member._id)}
                              className="bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded text-white text-xs transition-colors"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-3 bg-gray-50 px-4 sm:px-6 py-4 border-gray-200 border-t">
              <p className="text-gray-600 text-xs sm:text-sm">
                Showing 1–{Math.min(10, filteredStaff.length)} of{" "}
                {filteredStaff.length} staff members
              </p>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                <button className="hover:bg-gray-100 px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm">
                  Previous
                </button>
                <button className="bg-indigo-600 px-3 py-1 rounded text-white text-xs sm:text-sm">
                  1
                </button>
                <button className="hover:bg-gray-100 px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm">
                  2
                </button>
                <button className="hover:bg-gray-100 px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm">
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Staff Modal */}
      {showCreateModal && (
        <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/30 backdrop-blur-md p-4">
          <div className="bg-white/80 shadow-2xl backdrop-blur-lg p-5 sm:p-6 border border-white/20 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-900 text-lg sm:text-xl">
                Create New Staff
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError(null);
                  setCreateMessage("");
                }}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Success Message */}
            {createMessage && (
              <div className="bg-green-50 mb-4 p-3 border border-green-200 rounded-lg text-green-700 text-sm">
                {createMessage}
              </div>
            )}

            {/* Error Message */}
            {createError && (
              <div className="bg-red-50 mb-4 p-3 border border-red-200 rounded-lg text-red-700 text-sm">
                {createError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateStaff} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block mb-1 font-medium text-gray-700 text-sm">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter staff name"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                  disabled={creating}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block mb-1 font-medium text-gray-700 text-sm">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter email address"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                  disabled={creating}
                />
              </div>

              {/* Department */}
              <div>
                <label className="block mb-1 font-medium text-gray-700 text-sm">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                  disabled={creating}
                >
                  <option value="">Select department</option>
                  <option value="Integration">Integration</option>
                  
                  <option value="Support">Support</option>
                </select>
              </div>

              {/* Role */}
              <div>
                <label className="block mb-1 font-medium text-gray-700 text-sm">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                  disabled={creating}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Salary */}
              <div>
                <label className="block mb-1 font-medium text-gray-700 text-sm">
                  Salary
                </label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) =>
                    setFormData({ ...formData, salary: Number(e.target.value) })
                  }
                  placeholder="Enter salary"
                  min="0"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                  disabled={creating}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError(null);
                    setCreateMessage("");
                    setFormData({
                      name: "",
                      email: "",
                      department: "Integration",
                      role: "staff",
                      salary: 0,
                    });
                  }}
                  className="flex-1 hover:bg-gray-50 disabled:opacity-50 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm transition-colors"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex flex-1 justify-center items-center bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg text-white text-sm transition-colors"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDirectory;