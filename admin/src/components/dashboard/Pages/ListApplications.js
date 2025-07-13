import React, { useEffect, useState } from "react";
import axios from "axios";

const ListApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get admin token from localStorage (adjust if you store it elsewhere)
    const adminToken = localStorage.getItem("token");
    axios.get("http://localhost:4000/api/v1/applications/pending-tutors", {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    })
      .then((res) => {
        setApplications(res.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch applications");
        setLoading(false);
      });
  }, []);

  const handleApprove = (tutorId) => {
    const adminToken = localStorage.getItem("token");
    axios.put(`http://localhost:4000/api/v1/applications/approve-tutor/${tutorId}`, {}, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    })
      .then(() => {
        setApplications(applications.filter(app => app._id !== tutorId));
      })
      .catch(() => {
        alert("Failed to approve tutor");
      });
  };

  const handleReject = (tutorId) => {
    if (!window.confirm("Are you sure you want to reject this tutor application?")) return;
    const adminToken = localStorage.getItem("token");
    axios.delete(`http://localhost:4000/api/v1/applications/reject-tutor/${tutorId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    })
      .then(() => {
        setApplications(applications.filter(app => app._id !== tutorId));
      })
      .catch(() => {
        alert("Failed to reject tutor");
      });
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="flex-1 p-8">
      <h2 className="text-2xl font-bold mb-6">Pending Tutor Applications</h2>
      {applications.length === 0 ? (
        <div>No pending applications.</div>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="py-2 px-4 border">Name</th>
              <th className="py-2 px-4 border">Email</th>
              <th className="py-2 px-4 border">CV</th>
              <th className="py-2 px-4 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app._id}>
                <td className="py-2 px-4 border">{app.firstName} {app.lastName}</td>
                <td className="py-2 px-4 border">{app.email}</td>
                <td className="py-2 px-4 border">
                  {app.resumePath ? (
                    <a
                      href={app.resumePath.startsWith("http") ? app.resumePath : `http://localhost:4000/uploads/${app.resumePath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      View CV
                    </a>
                  ) : (
                    "No CV"
                  )}
                </td>
                <td className="py-2 px-4 border">
                  <button
                    onClick={() => handleApprove(app._id)}
                    className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 mr-2"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(app._id)}
                    className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ListApplications;
