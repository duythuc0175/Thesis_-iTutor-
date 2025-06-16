import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Header from "../Header";
import Footer from "../Footer";
import "./../../css/tutor/TClassAssignment.css";

const TClassAssignment = () => {
  const { classId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // For deadline adjustment
  const [editDeadlineIdx, setEditDeadlineIdx] = useState(null);
  const [editDeadlineValue, setEditDeadlineValue] = useState("");
  const [deadlineLoading, setDeadlineLoading] = useState(false);

  // Solution modal state
  const [showSolutions, setShowSolutions] = useState(false);
  const [selectedAssignmentIdx, setSelectedAssignmentIdx] = useState(null);

  // Add grading state for modal
  const [gradingIdx, setGradingIdx] = useState({ solutionIdx: null, grade: "", feedback: "", loading: false });

  // Fetch current assignments on mount
  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const res = await axios.get(
          `http://localhost:4000/api/v1/classes/${classId}/assignment`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (res.data.success) setAssignments(res.data.assignments || []);
      } catch (err) {
        setAssignments([]);
      }
    };
    fetchAssignment();
  }, [classId]);

  // Handle assignment upload
  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a PDF file to upload.");
      return;
    }
    setLoading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(
        `http://localhost:4000/api/v1/classes/${classId}/assignment`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setMessage(res.data.message || "Assignment uploaded!");
      setAssignments(res.data.assignments || []);
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to upload assignment."
      );
    } finally {
      setLoading(false);
    }
  };

  // Deadline adjustment logic
  const handleEditDeadline = (idx, currentDeadline) => {
    setEditDeadlineIdx(idx);
    setEditDeadlineValue(
      currentDeadline ? new Date(currentDeadline).toISOString().slice(0, 16) : ""
    );
  };

  const handleSaveDeadline = async (idx) => {
    setDeadlineLoading(true);
    try {
      const res = await axios.put(
        `http://localhost:4000/api/v1/classes/${classId}/assignment/${idx}/deadline`,
        { deadline: editDeadlineValue },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      setAssignments(res.data.assignments || []);
      setMessage("Deadline updated successfully.");
      setEditDeadlineIdx(null);
      setEditDeadlineValue("");
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to update deadline."
      );
    } finally {
      setDeadlineLoading(false);
    }
  };

  const handleCancelEditDeadline = () => {
    setEditDeadlineIdx(null);
    setEditDeadlineValue("");
  };

  // Open solutions modal for a specific assignment
  const handleViewSolutions = (idx) => {
    setSelectedAssignmentIdx(idx);
    setShowSolutions(true);
  };

  // Close solutions modal
  const handleCloseSolutions = () => {
    setShowSolutions(false);
    setSelectedAssignmentIdx(null);
  };

  // Deadline notification logic
  const getDeadlineNotification = (deadline) => {
    if (!deadline) return "";
    const now = new Date();
    const deadlineDate = new Date(deadline);
    if (now > deadlineDate) {
      return "Deadline has passed";
    } else {
      const diffMs = deadlineDate - now;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);
      if (diffDays > 0) {
        return `Deadline in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
      } else if (diffHours > 0) {
        return `Deadline in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
      } else if (diffMinutes > 0) {
        return `Deadline in ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
      } else {
        return "Deadline is very soon!";
      }
    }
  };

  // Grade a solution
  const handleGradeSolution = async (assignmentIdx, solutionIdx) => {
    setGradingIdx({ ...gradingIdx, loading: true });
    try {
      await axios.put(
        `http://localhost:4000/api/v1/classes/${classId}/assignment/${assignmentIdx}/solution/${solutionIdx}/grade`,
        { grade: gradingIdx.grade, feedback: gradingIdx.feedback },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      // Refresh assignments after grading
      const res = await axios.get(
        `http://localhost:4000/api/v1/classes/${classId}/assignment`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setAssignments(res.data.assignments || []);
      setGradingIdx({ solutionIdx: null, grade: "", feedback: "", loading: false });
    } catch (err) {
      setGradingIdx({ ...gradingIdx, loading: false });
      alert("Failed to grade solution.");
    }
  };

  // Delete assignment with confirmation
  const handleDeleteAssignment = useCallback(
    async (assignmentIdx) => {
      if (!window.confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) {
        return;
      }
      try {
        const res = await axios.delete(
          `http://localhost:4000/api/v1/classes/${classId}/assignment/${assignmentIdx}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setAssignments(res.data.assignments || []);
        setMessage("Assignment deleted successfully.");
      } catch (err) {
        setMessage(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to delete assignment."
        );
      }
    },
    [classId]
  );

  return (
    <div className="flex min-h-screen bg-gray-100 flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-start pt-4 sm:pt-10 md:pt-20">
        <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-4 sm:p-6 md:p-8 mx-2 sm:mx-4">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Class Assignments</h2>
          {/* Upload Assignment */}
          <div className="mb-8">
            <label className="block mb-2 text-gray-700 font-medium">Upload Assignment (PDF):</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-full sm:w-auto"
              />
              <button
                onClick={handleUpload}
                disabled={loading}
                className={`w-full sm:w-auto px-4 py-1 rounded text-white font-semibold transition ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Uploading..." : "Upload Assignment"}
              </button>
            </div>
            {message && <div className="text-center text-sm mt-2 text-blue-700">{message}</div>}
          </div>
          {/* View Assignments */}
          <div>
            <h3 className="font-semibold mb-4 text-lg text-gray-700">Assignments:</h3>
            {assignments.length > 0 ? (
              <div className="flex flex-col gap-4">
                {assignments.map((a, idx) => (
                  <div
                    key={a.fileUrl + idx}
                    className="assignment-card bg-white border border-gray-200 rounded-xl shadow-md px-4 py-4 flex flex-col gap-2"
                  >
                    {/* Simple X Delete Button */}
                    <button
                      className="delete-x-btn"
                      title="Delete Assignment"
                      onClick={() => handleDeleteAssignment(idx)}
                    >
                      ×
                    </button>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                          Assignment {idx + 1}
                        </span>
                        <span className="text-xs text-gray-500">
                          Uploaded: {a.uploadedAt ? new Date(a.uploadedAt).toLocaleString() : "N/A"}
                        </span>
                        {a.deadline && (
                          <span className="text-xs font-semibold text-red-600 ml-2">
                            Deadline: {new Date(a.deadline).toLocaleString()}
                          </span>
                        )}
                        {a.deadline && (
                          <span
                            className={`text-xs font-semibold ml-2 ${
                              getDeadlineNotification(a.deadline).includes("passed")
                                ? "text-red-600"
                                : "text-yellow-600"
                            }`}
                          >
                            {getDeadlineNotification(a.deadline)}
                          </span>
                        )}
                      </div>
                      <a
                        href={a.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-base font-semibold text-blue-700 hover:underline break-all mb-1"
                      >
                        View Assignment PDF
                      </a>
                      {/* Deadline adjustment */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {editDeadlineIdx === idx ? (
                          <>
                            <input
                              type="datetime-local"
                              value={editDeadlineValue}
                              onChange={e => setEditDeadlineValue(e.target.value)}
                              className="border border-blue-400 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                              disabled={deadlineLoading}
                            />
                            <button
                              onClick={() => handleSaveDeadline(idx)}
                              disabled={deadlineLoading}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEditDeadline}
                              disabled={deadlineLoading}
                              className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-400 transition"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={
                                a.deadline
                                  ? new Date(a.deadline).toLocaleString()
                                  : "No deadline"
                              }
                              readOnly
                              className="border border-gray-300 rounded px-2 py-1 text-xs bg-gray-100 cursor-pointer"
                              style={{ minWidth: 120 }}
                              onClick={() => handleEditDeadline(idx, a.deadline)}
                            />
                            <button
                              onClick={() => handleEditDeadline(idx, a.deadline)}
                              className="px-2 py-1 bg-blue-500 text-white rounded text-xs font-semibold hover:bg-blue-600 transition"
                            >
                              {a.deadline ? "Edit" : "Set"}
                            </button>
                          </>
                        )}
                        <span className="text-xs text-gray-500">
                          {a.deadline ? "Adjust deadline" : "Set deadline"}
                        </span>
                      </div>
                      {/* View All Submissions button - prominent and separated */}
                      <button
                        className="view-all-btn mt-4"
                        onClick={() => handleViewSolutions(idx)}
                      >
                        View All Submissions
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No assignment uploaded yet.</p>
            )}
          </div>
        </div>
      </div>
      {/* Solutions Modal */}
      {showSolutions && selectedAssignmentIdx !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative solution-modal-scroll">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={handleCloseSolutions}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Student Solutions</h2>
            {assignments[selectedAssignmentIdx]?.solutions && assignments[selectedAssignmentIdx].solutions.length > 0 ? (
              <div>
                {assignments[selectedAssignmentIdx].solutions.map((sol, sidx) => (
                  <div key={sol.fileUrl + sidx} className="solution-box">
                    <div className="solution-title">
                      <a
                        href={sol.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Solution {sidx + 1} ({new Date(sol.submittedAt).toLocaleString()})
                      </a>
                    </div>
                    <div className="solution-meta">
                      {/* Always show student name if available */}
                      {sol.student && typeof sol.student === "object" && (sol.student.firstName || sol.student.lastName)
                        ? `Student: ${sol.student.firstName || ""}${sol.student.lastName ? " " + sol.student.lastName : ""}`.trim()
                        : "Student: Unknown"}
                    </div>
                    <div className="mt-1">
                      {sol.grade || sol.feedback ? (
                        <div className="grade-label">
                          Grade: <span>{sol.grade || "N/A"}</span>
                          {sol.feedback && (
                            <span className="feedback-label">Feedback: {sol.feedback}</span>
                          )}
                        </div>
                      ) : (
                        <span className="need-grading-label">Need Grading</span>
                      )}
                    </div>
                    <div className="mt-1">
                      <button
                        className="grade-edit-btn"
                        onClick={() =>
                          setGradingIdx({
                            solutionIdx: sidx,
                            grade: sol.grade || "",
                            feedback: sol.feedback || "",
                            loading: false,
                          })
                        }
                      >
                        Grade / Edit
                      </button>
                      {gradingIdx.solutionIdx === sidx && (
                        <form
                          className="grade-form mt-2"
                          onSubmit={e => {
                            e.preventDefault();
                            handleGradeSolution(selectedAssignmentIdx, sidx);
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Grade (e.g. A, 90, etc.)"
                            value={gradingIdx.grade}
                            onChange={e => setGradingIdx({ ...gradingIdx, grade: e.target.value })}
                            disabled={gradingIdx.loading}
                          />
                          <textarea
                            placeholder="Feedback"
                            value={gradingIdx.feedback}
                            onChange={e => setGradingIdx({ ...gradingIdx, feedback: e.target.value })}
                            disabled={gradingIdx.loading}
                          />
                          <div className="grade-form-actions">
                            <button
                              type="submit"
                              className="save-btn px-2 py-1 rounded"
                              disabled={gradingIdx.loading}
                            >
                              {gradingIdx.loading ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              className="cancel-btn px-2 py-1 rounded"
                              disabled={gradingIdx.loading}
                              onClick={() =>
                                setGradingIdx({ solutionIdx: null, grade: "", feedback: "", loading: false })
                              }
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No student solutions submitted yet.</p>
            )}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default TClassAssignment;

