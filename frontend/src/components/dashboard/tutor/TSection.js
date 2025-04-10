import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import Header from "../Header";

export default function TSection() {
  const { sectionId } = useParams(); // Get section ID from URL
  const [section, setSection] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSectionDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Authentication token is missing. Please log in.");
          return;
        }

        const response = await axios.get(
          `http://localhost:4000/api/v1/sections/${sectionId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.status === 200) {
          setSection(response.data.data); // Set the fetched section data
        }
      } catch (error) {
        console.error("Error fetching section details:", error);
        alert("An error occurred while fetching the section details.");
      }
    };

    fetchSectionDetails();
  }, [sectionId]);

  if (!section) {
    return <div className="p-8 text-center text-xl text-gray-700">Loading section details...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Header />
      <button
        onClick={() => navigate(-1)}
        className="flex items-center mb-6 text-blue-600 font-bold hover:underline"
      >
        <IoArrowBack className="mr-2 text-2xl" />
        Back
      </button>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-4">{section.sectionName}</h1>

        {/* File Display */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">File:</h2>
          {section.pdfFile ? (
            section.pdfFile.endsWith(".pdf") ? (
              <iframe
                src={section.pdfFile}
                title="PDF Viewer"
                width="100%"
                height="800px"
                className="border rounded"
              ></iframe>
            ) : section.pdfFile.endsWith(".docx") ? (
              <a
                href={section.pdfFile}
                className="inline-block bg-blue-600 text-white font-medium px-4 py-2 rounded hover:bg-blue-700 transition"
                download
              >
                Download DOCX File
              </a>
            ) : (
              <p className="text-gray-500">Unsupported file format.</p>
            )
          ) : (
            <p className="text-gray-500">No file available for this section.</p>
          )}
        </div>
      </div>
    </div>
  );
}
