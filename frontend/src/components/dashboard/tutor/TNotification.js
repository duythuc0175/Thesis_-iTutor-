import React, { useEffect, useState } from "react";
import Sidebar from "../Sidebar";
import axios from "axios";
import Header from "../Header";
import Footer from "../Footer";

export default function TNotification() {
  // State to hold the fetched notifications
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const [confirmRemoveId, setConfirmRemoveId] = useState(null); // For confirmation dialog

  // Fetch notifications from the API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token"); // Get token from local storage
        if (!token) {
          setError("Unauthorized: No token found.");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          "http://localhost:4000/api/v1/notifications/",
          {
            headers: {
              Authorization: `Bearer ${token}`, // Include token in request header
            },
          }
        );
        setNotifications(response.data.notifications); // Adjust based on API response structure
      } catch (err) {
        setError("Failed to fetch notifications. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  // Filter notifications based on the search query
  const filteredNotifications = notifications.filter(
    (notification) =>
      notification.message.toLowerCase().includes(searchQuery) ||
      notification.status.toLowerCase().includes(searchQuery)
  );

  // Mark notification as read (now 'seen')
  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:4000/api/v1/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, status: "seen" } : n))
      );
    } catch (err) {
      alert("Failed to mark as seen.");
    }
  };

  // Remove notification (after confirmation)
  const handleRemove = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:4000/api/v1/notifications/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setConfirmRemoveId(null);
    } catch (err) {
      alert("Failed to remove notification.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Header/>
      {/* Sidebar */}
      <div className="fixed top-0 left-0 w-64 h-screen bg-richblue-800 border-r border-richblack-700">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Notifications</h1>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search notifications by message or status..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full border text-black border-gray-300 rounded-lg p-3 placeholder-gray-600"
          />
        </div>

        {/* Loading and Error States */}
        {loading ? (
          <p className="text-gray-600">Loading notifications...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : filteredNotifications.length === 0 ? (
          <p className="text-gray-600">No notifications match your search.</p>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition duration-200 ${
                  notification.status === "unread"
                    ? "border-l-4 border-blue-500"
                    : "border-l-4 border-gray-300"
                }`}
              >
                <p className="text-gray-800 font-medium">{notification.message}</p>
                <p className="text-gray-600">
                  <strong>Status:</strong>{" "}
                  <span
                    className={
                      notification.status === "unread"
                        ? "text-blue-500 font-semibold"
                        : "text-green-600 font-semibold"
                    }
                  >
                    {notification.status === "read" || notification.status === "seen" ? "seen" : notification.status}
                  </span>
                </p>
                <p className="text-gray-600">
                  <strong>Created At:</strong>{" "}
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
                <div className="mt-4 flex gap-2">
                  {notification.status === "unread" && (
                    <button
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      onClick={() => handleMarkAsRead(notification._id)}
                    >
                      Mark as Read
                    </button>
                  )}
                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={() => setConfirmRemoveId(notification._id)}
                  >
                    Remove
                  </button>
                </div>
                {/* Confirmation Dialog */}
                {confirmRemoveId === notification._id && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                    <div className="bg-white p-6 rounded shadow-lg">
                      <p className="mb-4">Are you sure you want to remove this notification?</p>
                      <div className="flex gap-4">
                        <button
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                          onClick={() => handleRemove(notification._id)}
                        >
                          Yes, Remove
                        </button>
                        <button
                          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                          onClick={() => setConfirmRemoveId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer/>
    </div>
  );
}
