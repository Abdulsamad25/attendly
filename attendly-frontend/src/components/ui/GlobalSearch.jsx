import { useState, useEffect, useRef } from "react";
import { Search, User } from "lucide-react";
import { searchApi } from "../../api/search";

const GlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        performSearch();
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performSearch = async () => {
    try {
      setLoading(true);
      const res = await searchApi.global(query);
      setResults(res.data.data);
      setIsOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex-1 max-w-md" ref={dropdownRef}>
      <Search className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true);
        }}
        placeholder="Search staff members..."
        className="bg-gray-50 py-2 pr-4 pl-9 border border-gray-200 rounded-lg w-full text-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />

      {isOpen && (
        <div className="absolute left-0 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-400">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">No results found for "{query}"</div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {results.map((user) => (
                <div key={user._id} className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-50 cursor-pointer transition-colors">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <User size={16} />
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">{user.name}</h4>
                    <p className="text-[10px] text-gray-400">{user.department} • {user.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
