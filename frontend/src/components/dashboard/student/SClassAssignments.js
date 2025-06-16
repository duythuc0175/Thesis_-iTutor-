import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../Header";
import Footer from "../Footer";
import "./../../css/student/SClassAssignments.css";

const SClassAssignments = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitIdx, setSubmitIdx] = useState(null); // Track which assignment is being submitted
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRefs = useRef({}); // For resetting file inputs
  // Add a reload trigger for fetching assignments after submit
  const [reloadAssignments, setReloadAssignments] = useState(0);

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `http://localhost:4000/api/v1/classes/${classId}/assignment`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (data.success) {
          setAssignments(data.assignments || []);
        } else {
          setError("No assignments found.");
        }
      } catch (err) {
        setError("Failed to fetch assignments.");
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [classId, reloadAssignments]); // <-- add reloadAssignments as dependency

  // Handle file selection for a specific assignment
  const handleFileChange = (e, idx) => {
    setSelectedFile(e.target.files[0]);
    setSubmitIdx(idx);
    setSubmitMessage(""); // Clear message on file change
  };

  // Handle solution submission
  const handleSubmitSolution = async (assignment, idx) => {
    // Always set the submitIdx to the current idx before checking file
    setSubmitIdx(idx);
    if (!selectedFile || submitIdx !== idx) {
      setSubmitMessage("Please select a PDF file to submit.");
      return;
    }
    setSubmitLoading(true);
    setSubmitMessage("");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("assignmentFileUrl", assignment.fileUrl);

      const res = await fetch(
        `http://localhost:4000/api/v1/classes/${classId}/assignment/${idx}/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      const data = await res.json();
      if (data.success) {
        setSubmitMessage("Solution submitted successfully!");
        setSelectedFile(null);
        // Reset file input
        if (fileInputRefs.current[idx]) fileInputRefs.current[idx].value = "";
        setReloadAssignments((v) => v + 1); // <-- trigger reload after submit
      } else {
        setSubmitMessage(data.message || "Failed to submit solution.");
      }
    } catch (err) {
      setSubmitMessage("Failed to submit solution.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Helper to get all student's submissions for an assignment
  const getMySolutions = (assignment) => {
    const userId = localStorage.getItem("userId");
    if (!userId || !assignment.solutions) return [];
    return assignment.solutions.filter(
      (sol) => sol.student === userId || sol.student?._id === userId
    );
  };

  // State for toggling view of student's submission history
  const [historyIdx, setHistoryIdx] = useState(null);
  // State for toggling the inline list of all submissions for an assignment
  const [allSubIdx, setAllSubIdx] = useState(null);
  // Add modal state for viewing all submissions
  const [showAllSubModal, setShowAllSubModal] = useState(false);
  const [modalAssignmentIdx, setModalAssignmentIdx] = useState(null);

  // When opening the modal, always refresh assignments to get latest submissions
  const handleOpenAllSubModal = (idx) => {
    setModalAssignmentIdx(idx);
    setShowAllSubModal(true);
    setReloadAssignments((v) => v + 1); // <-- trigger reload when opening modal
  };

  return (
    <div className="flex min-h-screen bg-gray-100 flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-start pt-4 sm:pt-10 md:pt-20">
        <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-4 sm:p-6 md:p-8 mx-2 sm:mx-4">
          {/* Back to Classes Button */}
          <button
            className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition self-start"
            onClick={() => navigate("/dashboard/student/classes")}
          >
            ← Back to Classes
          </button>
          <h2 className="text-3xl font-bold mb-6 text-gray-800">
            Class Assignments
          </h2>
          {loading ? (
            <p>Loading assignments...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : assignments.length === 0 ? (
            <p>No assignments found for this class.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {assignments.map((a, idx) => {
                const mySolutions = getMySolutions(a);
                // Deadline notification logic
                let deadlineNotification = "";
                if (a.deadline) {
                  const now = new Date();
                  const deadlineDate = new Date(a.deadline);
                  if (now > deadlineDate) {
                    deadlineNotification = "Deadline has passed";
                  } else {
                    const diffMs = deadlineDate - now;
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
                    const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);
                    if (diffDays > 0) {
                      deadlineNotification = `Deadline in ${diffDays} day${
                        diffDays > 1 ? "s" : ""
                      }`;
                    } else if (diffHours > 0) {
                      deadlineNotification = `Deadline in ${diffHours} hour${
                        diffHours > 1 ? "s" : ""
                      }`;
                    } else if (diffMinutes > 0) {
                      deadlineNotification = `Deadline in ${diffMinutes} minute${
                        diffMinutes > 1 ? "s" : ""
                      }`;
                    } else {
                      deadlineNotification = "Deadline is very soon!";
                    }
                  }
                }
                return (
                  <div
                    key={a.fileUrl + idx}
                    className="assignment-card bg-white border border-gray-200 rounded-xl shadow-md px-4 py-4 flex flex-col gap-2"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                            Assignment {idx + 1}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(a.uploadedAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {a.deadline && (
                            <span className="text-xs font-semibold text-red-600">
                              Deadline: {new Date(a.deadline).toLocaleString()}
                            </span>
                          )}
                          {a.deadline && (
                            <span
                              className={`text-xs font-semibold ${
                                (() => {
                                  const now = new Date();
                                  const deadlineDate = new Date(a.deadline);
                                  if (now > deadlineDate) return "text-red-600";
                                  const diffMs = deadlineDate - now;
                                  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                  const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
                                  const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);
                                  if (diffDays > 0) return "text-yellow-600";
                                  if (diffHours > 0) return "text-yellow-600";
                                  if (diffMinutes > 0) return "text-yellow-600";
                                  return "text-yellow-600";
                                })()
                              }`}
                            >
                              {(() => {
                                const now = new Date();
                                const deadlineDate = new Date(a.deadline);
                                if (now > deadlineDate) return "Deadline has passed";
                                const diffMs = deadlineDate - now;
                                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
                                const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);
                                if (diffDays > 0) return `Deadline in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
                                if (diffHours > 0) return `Deadline in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
                                if (diffMinutes > 0) return `Deadline in ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
                                return "Deadline is very soon!";
                              })()}
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
                        {/* Action buttons row: View All Submissions & Submit */}
                        <div className="mt-2 flex flex-row flex-wrap gap-2">
                          <button
                            className="px-2 py-1 bg-purple-700 text-white rounded text-xs font-semibold hover:bg-purple-800 transition"
                            onClick={() => handleOpenAllSubModal(idx)}
                          >
                            View All Submissions
                          </button>
                          {/* Only show submit button if deadline not passed */}
                          {(!a.deadline || new Date(a.deadline) > new Date()) ? (
                            <>
                              <label className="sr-only" htmlFor={`file-upload-${idx}`}>
                                Upload solution
                              </label>
                              <input
                                id={`file-upload-${idx}`}
                                type="file"
                                accept="application/pdf"
                                ref={(el) => (fileInputRefs.current[idx] = el)}
                                onChange={(e) => handleFileChange(e, idx)}
                                className="hidden"
                              />
                              <button
                                className={`px-2 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 transition`}
                                onClick={() => fileInputRefs.current[idx]?.click()}
                              >
                                Choose PDF
                              </button>
                              <button
                                className={`px-2 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition`}
                                disabled={submitLoading && submitIdx === idx}
                                onClick={() => handleSubmitSolution(a, idx)}
                              >
                                {submitLoading && submitIdx === idx
                                  ? "Submitting..."
                                  : "Submit"}
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-red-600 font-semibold ml-2">Submission closed (deadline passed)</span>
                          )}
                        </div>
                        {/* Show selected file name */}
                        {submitIdx === idx && selectedFile && (
                          <div className="text-xs text-gray-600 mt-1">
                            Selected: {selectedFile.name}
                          </div>
                        )}
                        {/* Submission message */}
                        {submitIdx === idx && submitMessage && (
                          <div
                            className={`text-sm mt-1 ${
                              submitMessage.toLowerCase().includes("success")
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {submitMessage}
                          </div>
                        )}
                        {/* My submission history */}
                        {mySolutions.length > 0 && historyIdx === idx && (
                          <div className="mt-2 flex flex-col gap-1 bg-blue-50 border border-blue-100 rounded p-2">
                            {mySolutions.map((sol, sidx) => (
                              <div key={sol.fileUrl + sidx} className="flex items-center gap-2">
                                <a
                                  href={sol.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-700 underline text-xs hover:text-blue-900"
                                >
                                  Submission {sidx + 1} ({new Date(sol.submittedAt).toLocaleString()})
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* Modal for all submissions (like tutor view) */}
      {showAllSubModal && modalAssignmentIdx !== null && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50"
          onClick={() => {
            setShowAllSubModal(false);
            setModalAssignmentIdx(null);
          }}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative solution-modal-scroll"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={() => {
                setShowAllSubModal(false);
                setModalAssignmentIdx(null);
              }}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">All Submissions</h2>
            {assignments[modalAssignmentIdx]?.solutions &&
            assignments[modalAssignmentIdx].solutions.length > 0 ? (
              <div>
                {assignments[modalAssignmentIdx].solutions.map((sol, sidx) => (
                  <div key={sol.fileUrl + sidx} className="solution-box">
                    <div className="solution-title">
                      <a
                        href={sol.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Submission {sidx + 1} ({new Date(sol.submittedAt).toLocaleString()})
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
                            <span className="feedback-label">
                              Feedback: {sol.feedback}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="need-grading-label">Need Grading</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No submissions yet.</p>
            )}
            <button
              className="mt-4 w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
              onClick={() => {
                setShowAllSubModal(false);
                setModalAssignmentIdx(null);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};



export default SClassAssignments;




