import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../Header";
import Footer from "../Footer";

const Subject = () => {
  const [sections, setSections] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setMessage({ type: "error", text: "Authentication token is missing. Please log in." });
          return;
        }

        const response = await axios.get("http://localhost:4000/api/v1/sections/student", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          setSections(response.data.data); // Set the fetched sections
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || "An error occurred.";
        setMessage({ type: "error", text: errorMessage });
      }
    };

    fetchSections();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Course Sections</h1>

        {message && (
          <div
            className={`p-4 mb-4 rounded ${
              message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {sections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section) => (
              <div key={section._id} className="p-4 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800">{section.sectionName}</h2>
                <p className="text-gray-600">{section.description}</p>
                <a
                  href={`/dashboard/student/section/${section._id}`}
                  className="mt-2 inline-block text-blue-600 hover:underline"
                >
                  View Section
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No sections available.</p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Subject;
