import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../Sidebar";
import Header from "../Header";
import Footer from "../Footer";
import { useNavigate } from "react-router-dom";
import { FaTimes } from 'react-icons/fa';

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [zoomLink, setZoomLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [classDetailsModal, setClassDetailsModal] = useState({
    show: false,
    type: "", 
    requestId: null,
    courseId: null
  });
  const [classDetails, setClassDetails] = useState({
    date: "",
    time: "",
    classLink: "",
    duration:""
  });
  const [requestToDelete, setRequestToDelete] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:4000/api/v1/classes/class-requests", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const requestsWithCourses = await Promise.all(
          response.data.classRequests
            .filter((req) => req && req._id && req.course && req.course._id) // Filter out invalid requests
            .map(async (req) => {
              const courseResponse = await axios.get(
                `http://localhost:4000/api/v1/courses/${req.course._id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              const courseName = courseResponse.data.data.courseName || "Unknown Course";
              return {
                id: req._id,
                student: req.student?.email || "Unknown Student",
                topic: courseName,
                courseId: req.course._id,
                date: req.time ? new Date(req.time).toLocaleDateString() : "No date provided",
                time: req.time ? new Date(req.time).toLocaleTimeString() : "No time provided",
                status: req.status || "Unknown",
                type: req.type || "Unknown",
                duration: req.duration || "Not specified", // Ensure duration is included
                isNew: req.status === "Pending",
              };
            })
        );

        setRequests(requestsWithCourses);
        setFilteredRequests(requestsWithCourses);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching requests:", err);
        setError("Failed to fetch class requests. Please try again.");
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    setFilteredRequests(
      requests.filter(
        (req) =>
          req.student.toLowerCase().includes(query) ||
          req.topic.toLowerCase().includes(query)
      )
    );
  };

  const handleDeclineAction = async (id, action) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:4000/api/v1/classes/handle-request/${id}`,
        { status: action },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === id ? { ...req, status: action, isNew: false } : req
        )
      );
      setFilteredRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === id ? { ...req, status: action, isNew: false } : req
        )
      );
    } catch (err) {
      console.error("Error declining request:", err);
      alert("Failed to update request status. Please try again.");
    }
  };

  const handleAcceptAction = async (request, action) => {
    try {
        const requestDetails = requests.find(r => r.id === request.id);
        setClassDetails({
          date: requestDetails.date,
          time: requestDetails.time,
          classLink: "",
          duration: requestDetails.duration || "0",
        });
        
        setClassDetailsModal({
          show: true,
          type: request.type,
          requestId: request.id,
          courseId: request.courseId
        });
    } catch (err) {
      console.error("Error in accept action:", err);
      alert("Failed to process request. Please try again.");
    }
  };
  
  const handleCreateClass = async () => {
    try {
        // Skip validation for classLink if the class type is "Group"
        if (classDetailsModal.type === "Personal" && !classDetails.classLink) {
            alert("Please enter a Zoom link");
            return;
        }

        const token = localStorage.getItem("token");
        const requestId = classDetailsModal.requestId;

        // Ensure all required information is present
        if (!requestId) {
            alert("Request ID is missing. Please try again.");
            return;
        }

        const response = await axios.post(
            `http://localhost:4000/api/v1/classes/handle-request/${requestId}`,
            {
                status: "Accepted",
                classLink: classDetailsModal.type === "Personal" ? classDetails.classLink : undefined, // Only include classLink for personal classes
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("Full Response:", response.data);

        // Specific handling for personal classes (if needed)
        if (response.data.type === "Personal") {
            console.log("Personal class created successfully");
        }

        // Update local state
        const updatedRequests = requests.map((req) =>
            req.id === requestId
                ? { ...req, status: "Accepted", isNew: false, classLink: classDetails.classLink }
                : req
        );

        setRequests(updatedRequests);
        setFilteredRequests(updatedRequests);

        // Reset modals and details
        setClassDetailsModal({
            show: false,
            type: "",
            requestId: null,
            courseId: null,
        });
        setClassDetails({
            date: "",
            time: "",
            classLink: "",
            duration: "",
        });

        // Provide user feedback
        alert("Class created successfully!");
    } catch (err) {
        console.error("Detailed Error:", err.response?.data || err.message);

        const errorMessage =
            err.response?.data?.details ||
            err.response?.data?.error ||
            err.response?.data?.message ||
            "Failed to create class";

        alert(`Error: ${errorMessage}`);
    }
};

  const handleDeleteRequest = async (id) => {
    // If you have a backend endpoint, call it here. For now, just remove from UI.
    setRequests((prev) => prev.filter((req) => req.id !== id));
    setFilteredRequests((prev) => prev.filter((req) => req.id !== id));
    setRequestToDelete(null);
  };

  const gotoSchedule = () => {
    navigate("/dashboard/tutor/schedule");
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Header/>
      <div className="fixed top-0 left-0 w-64 h-screen bg-richblue-800 border-r border-richblack-700">
        <Sidebar />
      </div>

      <div className="flex-1 ml-64 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Requests</h1>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by student or topic..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full border text-black border-gray-300 rounded-lg p-3 placeholder-gray-600"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <p className="text-gray-600">Loading requests...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : filteredRequests.length === 0 ? (
            <p className="text-gray-600">No requests available.</p>
          ) : (
            <ul className="space-y-4">
              {filteredRequests.map((request) => (
                <li
                  key={request.id}
                  className={`flex items-center justify-between border-b pb-2 relative group ${
                    request.isNew ? "bg-yellow-100 border-yellow-300" : ""
                  }`}
                >
                  {/* X icon for accepted/rejected requests, only visible on hover */}
                  {(request.status === "Accepted" || request.status === "Rejected") && (
        <button
          className="absolute -top-3 right-0.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-red-600 text-base z-10 p-0.5 rounded-full bg-white hover:bg-red-50"
          onClick={() => setRequestToDelete(request)}
          title="Delete Request"
          style={{ lineHeight: 1 }}
        >
          <FaTimes className="w-3.5 h-3.5" />
        </button>
      )}
                  <div>
                    <p className="text-gray-800 font-semibold">{request.student}</p>
                    <p className="text-gray-600 text-sm">
                      Topic: {request.topic} | Date: {request.date} | Time: {request.time} | Type: {request.type}
                    </p>
                    <p
                      className={`mt-1 text-sm font-medium ${
                        request.status === "Accepted"
                          ? "text-green-600"
                          : request.status === "Rejected"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      Status: {request.status}
                    </p>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                    >
                      View Request
                    </button>
                    {request.status === "Accepted" && (
                      <>
                        <button
                          onClick={gotoSchedule}
                          className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
                        >
                          Go To Schedule
                        </button>
                      </>
                    )}
                    {request.status === "Pending" && (
                      <>
                        <button
                          onClick={() => handleAcceptAction(request, "Accepted")}
                          className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineAction(request.id, "Rejected")}
                          className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
                        >
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* View Request Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Request Details</h2>
            <p className="mb-2">
              <strong>Student:</strong> {selectedRequest.student}
            </p>
            <p className="mb-2">
              <strong>Topic:</strong> {selectedRequest.topic}
            </p>
            <p className="mb-2">
              <strong>Date:</strong> {selectedRequest.date}
            </p>
            <p className="mb-4">
              <strong>Status:</strong> {selectedRequest.status}
            </p>
            <div className="text-right">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-6 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Class Details Modal */}
      {classDetailsModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {classDetailsModal.type === "Personal" 
                ? "Personal Class Details" 
                : "Group Class Details"}
            </h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">Class Date</label>
              <input
                type="text"
                value={classDetails.date}
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
                disabled
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">Class Time</label>
              <input
                type="text"
                value={classDetails.time}
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
                disabled
              />
            </div>

            {classDetailsModal.type === "Personal" && (
                <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-2">Class Link</label>
                    <input
                        type="text"
                        placeholder="Enter Zoom/Meet link"
                        value={classDetails.classLink}
                        onChange={(e) => setClassDetails(prev => ({ ...prev, classLink: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                    />
                </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">Duration</label>
              <input
                type="text"
                value={classDetails.duration}
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
                disabled
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setClassDetailsModal({ show: false, type: "", requestId: null, courseId: null })}
                className="px-6 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClass}
                className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
              >
                Create Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Request Confirmation Modal */}
      {requestToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete Request</h2>
            <p className="mb-6">Are you sure you want to delete this request?</p>
            <div className="flex gap-4 justify-end">
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => handleDeleteRequest(requestToDelete.id)}
              >
                Yes, Delete
              </button>
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setRequestToDelete(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer/>
    </div>
  );
}