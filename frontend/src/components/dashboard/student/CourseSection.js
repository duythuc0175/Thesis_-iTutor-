import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { IoArrowBack } from "react-icons/io5";

const CourseSection = () => {
  const { sectionId } = useParams(); // Get sectionId from URL params
  const [section, setSection] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSectionDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/api/v1/sections/${sectionId}`);
        setSection(response.data.data);
      } catch (error) {
        console.error("Error fetching section details:", error);
      }
    };

    fetchSectionDetails();
  }, [sectionId]);

  if (!section) {
    return <div className="p-8 text-center text-xl text-gray-700">Loading section details...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center mb-6 text-blue-600 font-bold hover:underline"
      >
        <IoArrowBack className="mr-2 text-2xl" />
        Back
      </button>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-4">{section.sectionName}</h1>

        {/* PDF File Display */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold">PDF File:</h2>
          {section.pdfFile ? (
            <a
              href={section.pdfFile}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View PDF
            </a>
          ) : (
            <p className="text-gray-500">No PDF file available for this section.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseSection;
