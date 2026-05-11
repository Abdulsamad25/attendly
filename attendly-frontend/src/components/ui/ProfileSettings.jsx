/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { profileApi } from "../../api/admin";
import {
  Contact,
  AtSign,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Spinner from "./Spinner";

const ProfileSettings = () => {
  const [profile, setProfile] = useState({
    bio: "",
    phoneNumber: "",
    address: "",
    profilePicture: "",
    name: "",
    email: "",
    department: "",
    createdAt: "",
    _id: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Toggle for 2FA UI (mock)
  const [twoFactor, setTwoFactor] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await profileApi.get();
      if (res.data) {
        setProfile({
          ...res.data,
          bio: res.data.bio || "",
          phoneNumber: res.data.phoneNumber || "",
          address: res.data.address || "",
          profilePicture: res.data.profilePicture || "",
        });
      }
    } catch (err) {
      setError("Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setMessage(null);
      setError(null);
      // Only send the allowed update fields according to backend route
      await profileApi.update({
        bio: profile.bio,
        phoneNumber: profile.phoneNumber,
        address: profile.address,
        profilePicture: profile.profilePicture,
      });
      setMessage("Changes saved successfully!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save changes");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    fetchProfile(); // reload data
  };

  if (loading) return <Spinner />;

  // Formatting helpers
  const joinDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })
    : "";

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "";

  const employeeId = profile._id ? `AT-${profile._id.slice(-5).toUpperCase()}` : "";

  return (
    <div className="space-y-6 mx-auto pb-10 w-full max-w-6xl">
      {/* Messages */}
      {message && (
        <div className="flex items-center gap-2 bg-emerald-50 p-4 border border-emerald-200 rounded-lg text-emerald-700">
          <CheckCircle size={20} /> {message}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 p-4 border border-red-200 rounded-lg text-red-700">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="font-bold text-gray-900 text-3xl tracking-tight">
          My Profile Settings
        </h1>
        <p className="mt-1 text-gray-600">
          Manage your personal identity, contact preferences, and account security.
        </p>
      </div>

      <div className="gap-6 grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column (Profile Card & Status) */}
        <div className="space-y-6 lg:col-span-4">
          {/* Profile Card */}
          <div className="relative bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
            <div className="top-0 bottom-0 left-0 absolute bg-indigo-700 w-1"></div>
            <div className="flex flex-col items-center p-8 text-center">
              <div className="bg-gray-100 shadow-inner mb-4 p-1 border border-gray-200 rounded-2xl w-32 h-32 overflow-hidden">
                {profile.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt="Profile"
                    className="rounded-xl w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex justify-center items-center bg-blue-100 rounded-xl w-full h-full font-bold text-blue-600 text-3xl">
                    {profile.name?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              <h2 className="font-bold text-gray-900 text-xl">{profile.name}</h2>
              <p className="mb-6 text-gray-500 text-sm">{profile.department || "Staff"}</p>
              
             
              <div className="group relative w-full">
                 <input 
                    type="text" 
                    name="profilePicture"
                    value={profile.profilePicture}
                    onChange={handleProfileChange}
                    placeholder="Paste image URL here"
                    className="-top-8 left-0 z-10 absolute bg-white opacity-0 group-hover:opacity-100 p-1 border border-gray-200 rounded w-full text-xs text-center transition-opacity"
                 />
                 <button className="font-bold text-indigo-700 hover:text-indigo-800 text-xs uppercase tracking-widest transition-colors">
                  Change Photo
                 </button>
              </div>
            </div>
          </div>

          {/* Account Status Card */}
          <div className="bg-white shadow-sm p-6 border border-gray-100 rounded-xl">
            <h3 className="mb-4 font-bold text-[11px] text-gray-400 uppercase tracking-widest">
              Account Status
            </h3>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500 rounded-full w-2.5 h-2.5"></div>
                <span className="font-semibold text-gray-900 text-sm">
                  Active Employee
                </span>
              </div>
              <span className="ml-4.5 text-gray-500 text-xs">
                Member since {memberSince}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (Forms) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Personal Identity */}
          <div className="bg-white shadow-sm p-6 sm:p-8 border border-gray-100 rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <Contact className="text-indigo-700" size={24} />
              <h2 className="font-bold text-gray-900 text-xl">Personal Identity</h2>
            </div>
            
            <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
              <div>
                <label className="block mb-2 font-bold text-[10px] text-gray-500 uppercase tracking-widest">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  readOnly
                  className="bg-gray-50 px-4 py-3 border-none rounded-lg focus:ring-0 w-full font-medium text-gray-700 text-sm"
                />
              </div>
              <div>
                <label className="block mb-2 font-bold text-[10px] text-gray-500 uppercase tracking-widest">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={employeeId}
                  readOnly
                  className="bg-gray-50 px-4 py-3 border-none rounded-lg focus:ring-0 w-full font-medium text-gray-700 text-sm"
                />
              </div>
              <div>
                <label className="block mb-2 font-bold text-[10px] text-gray-500 uppercase tracking-widest">
                  Department
                </label>
                <div className="relative">
                  <select
                    disabled
                    value={profile.department}
                    className="bg-gray-50 px-4 py-3 border-none rounded-lg focus:ring-0 w-full font-medium text-gray-700 text-sm appearance-none"
                  >
                    <option value="Integration">Integration</option>
                    <option value="Support">Support</option>
                    <option value="Management">Management</option>
                    <option value="Product & Design">Product & Design</option>
                  </select>
                  <div className="right-0 absolute inset-y-0 flex items-center px-4 text-gray-500 pointer-events-none">
                    <svg className="fill-current w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block mb-2 font-bold text-[10px] text-gray-500 uppercase tracking-widest">
                  Join Date
                </label>
                <input
                  type="text"
                  value={joinDate}
                  readOnly
                  className="bg-gray-50 px-4 py-3 border-none rounded-lg focus:ring-0 w-full font-medium text-gray-700 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white shadow-sm p-6 sm:p-8 border border-gray-100 rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <AtSign className="text-indigo-700" size={24} />
              <h2 className="font-bold text-gray-900 text-xl">Contact Information</h2>
            </div>
            
            <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
              <div>
                <label className="block mb-2 font-bold text-[10px] text-gray-500 uppercase tracking-widest">
                  Work Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  className="bg-gray-50 px-4 py-3 border-none rounded-lg focus:ring-0 w-full font-medium text-gray-700 text-sm"
                />
              </div>
              <div>
                <label className="block mb-2 font-bold text-[10px] text-gray-500 uppercase tracking-widest">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={profile.phoneNumber}
                  onChange={handleProfileChange}
                  placeholder="+1 (555) 234-8890"
                  className="bg-gray-50 px-4 py-3 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full font-medium text-gray-700 text-sm transition-shadow"
                />
              </div>
            </div>
          </div>

          {/* Security & Access */}
          <div className="relative bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
            <div className="top-0 bottom-0 left-0 absolute bg-red-500 w-1"></div>
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-8">
                <ShieldCheck className="text-red-500" size={24} />
                <h2 className="font-bold text-gray-900 text-xl">Security & Access</h2>
              </div>
              
              <div className="space-y-6">
                {/* Change Password Row */}
                <div className="flex sm:flex-row flex-col justify-between sm:items-center bg-gray-50/50 p-4 border border-gray-100 rounded-xl">
                  <div className="mb-4 sm:mb-0">
                    <h4 className="font-bold text-gray-900 text-sm">Change Password</h4>
                    <p className="mt-0.5 text-gray-500 text-xs">Last changed 4 months ago</p>
                  </div>
                  <button className="bg-[#1e1b4b] hover:bg-[#2e2b5b] shadow-sm px-5 py-2.5 rounded-lg font-semibold text-white text-sm transition-colors">
                    Update Password
                  </button>
                </div>

                {/* 2FA Row */}
                <div className="flex sm:flex-row flex-col justify-between sm:items-center bg-white shadow-sm p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center gap-4 mb-4 sm:mb-0">
                    <div className="flex justify-center items-center bg-indigo-50 px-3 py-2 rounded">
                       <span className="font-black text-indigo-700 text-lg italic tracking-widest">AUTH<span className="text-indigo-400">ICATOR</span></span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">Two-Factor Authentication</h4>
                      <p className="mt-0.5 text-gray-500 text-xs">Secured via Authenticator App</p>
                    </div>
                  </div>
                  
                  {/* Toggle switch mock */}
                  <button 
                    onClick={() => setTwoFactor(!twoFactor)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${twoFactor ? 'bg-emerald-500' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${twoFactor ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end items-center gap-4 pt-4">
            <button
              onClick={handleDiscard}
              className="bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded-lg font-bold text-gray-800 text-sm transition-colors"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="bg-[#2e2b8b] hover:bg-[#1e1b5b] disabled:opacity-70 shadow-md px-6 py-3 rounded-lg font-bold text-white text-sm transition-colors"
            >
              {saving ? "Saving..." : "Save All Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
