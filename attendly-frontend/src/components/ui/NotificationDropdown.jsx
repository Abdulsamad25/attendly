import { useState, useEffect, useRef } from "react";
import { Bell, Check, Send, User } from "lucide-react";
import { notificationApi } from "../../api/notification";
import { useAuth } from "../../lib/AuthContext";
import { formatDistanceToNow } from "date-fns";

const NotificationDropdown = () => {
  const { isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Message modal state
  const [receiverId, setReceiverId] = useState(isAdmin ? "all" : "admin"); // Default fallback
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.get();
      setNotifications(res.data.data);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    try {
      setSending(true);
      await notificationApi.sendMessage(receiverId, message);
      setMessage("");
      setShowModal(false);
      // Let polling fetch new sent messages if needed, though they only appear for the receiver.
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-500" />
        {unreadCount > 0 && (
          <span className="top-1 right-1 absolute bg-red-500 rounded-full w-2.5 h-2.5 flex items-center justify-center text-[8px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-gray-50 bg-gray-50/50">
            <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
            <button 
              onClick={() => { setIsOpen(false); setShowModal(true); }}
              className="text-xs text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1"
            >
              <Send size={12} /> Send Msg
            </button>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No notifications</div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n._id} 
                  className={`p-4 border-b border-gray-50 transition-colors ${!n.is_read ? 'bg-indigo-50/30' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {n.type === "message" && n.sender_id && (
                        <div className="flex items-center gap-2 mb-1">
                          {n.sender_id.profilePicture ? (
                             <img src={n.sender_id.profilePicture} alt="avatar" className="w-4 h-4 rounded-full" />
                          ) : (
                             <User className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-xs font-semibold text-gray-700 truncate">{n.sender_id.name}</span>
                        </div>
                      )}
                      <p className={`text-sm ${!n.is_read ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                        {n.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <button 
                        onClick={() => handleMarkAsRead(n._id)}
                        className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-100 h-fit"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6">
            <h3 className="font-bold text-lg mb-4 text-gray-900">Send Message</h3>
            
            {isAdmin && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1">To</label>
                <select 
                  value={receiverId} 
                  onChange={(e) => setReceiverId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="all">All Staff</option>
                  {/* For specific staff, we'd need a user list, but let's just keep 'all' for simplicity in this demo */}
                </select>
              </div>
            )}
            {!isAdmin && (
              <p className="text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded">
                This message will be sent to the Admin.
              </p>
            )}

            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-4 resize-none"
            />

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleSendMessage}
                disabled={sending || !message.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {sending ? "Sending..." : <><Send size={14} /> Send</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
