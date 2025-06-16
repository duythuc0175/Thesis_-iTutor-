import React, { useState } from "react";
import axios from "axios";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import Header from "../Header";
import Footer from "../Footer";

const TAddNewSection = () => {
  const [sectionName, setSectionName] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfFileUrl, setPdfFileUrl] = useState(""); // Add state for the PDF file URL
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = React.useRef(null);

  // Handle file upload
  const handleFileUpload = async () => {
    if (!pdfFile) {
      setMessage("Please select a file to upload.");
      return;
    }
  
    const formData = new FormData();
    formData.append("file", pdfFile); // Ensure the file is appended correctly
    
    // Log to check the file is appended correctly
    console.log("FormData before sending:", formData);
    console.log("File name:", pdfFile.name);
  
    try {
      const response = await axios.post(
        "http://localhost:4000/api/v1/sections/upload-file", // backend endpoint
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setPdfFileUrl(response.data.fileUrl); // Use the S3 file URL returned by the backend
      setMessage("File uploaded successfully!");
      setPdfFile(null); // Reset file state
      // Reset file input element
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error uploading file:", error.response?.data || error.message);
      setMessage("Failed to upload file. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!pdfFileUrl) {
      setMessage("File is required. Please upload the file first.");
      setLoading(false);
      return;
    }

    try {
      const formData = {
        sectionName,
        fileUrl: pdfFileUrl, // Ensure the uploaded file URL is sent
      };

      console.log("Submitting section data:", formData); // Log the request body for debugging

      const response = await axios.post(
        "http://localhost:4000/api/v1/sections/add",
        formData,
        {
          headers: {
            "Content-Type": "application/json", // Ensure JSON content type
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setMessage(response.data.message);
      if (response.data.success) {
        setSectionName(""); // Clear the form on success
        setPdfFile(null);
        setPdfFileUrl(""); // Reset the uploaded file URL
      }
    } catch (error) {
      console.error("Error posting section:", error.response?.data || error.message);
      setMessage(error.response?.data?.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4">
        <Header/>
          <div className="container mx-auto max-w-7xl">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center mb-6 text-blue-600 font-bold hover:underline"
            >
              <IoArrowBack className="mr-2 text-2xl" />
              Back
            </button>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold">Add New Section</h1>
              <p className="text-sm text-gray-600">Fill in the form below to add a new section.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-4">
              <div className="flex flex-col">
                <label htmlFor="sectionName" className="text-gray-600 text-sm mb-1">
                  Section Name
                </label>
                <input
                  type="text"
                  id="sectionName"
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  placeholder="Enter section name"
                  className="border border-gray-300 rounded-lg p-2"
                  required
                />
              </div>

              {/* File Upload */}
              <div className="flex flex-col">
                <label htmlFor="pdfFile" className="text-gray-600 text-sm mb-1">
                  Upload File (PDF or DOCX)
                </label>
                <input
                  type="file"
                  id="pdfFile"
                  accept=".pdf,.docx"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                  className="border border-gray-300 rounded-lg p-2"
                  required
                  ref={fileInputRef}
                />
                <button
                  type="button"
                  onClick={handleFileUpload}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={loading}
                >
                  {loading ? "Uploading..." : "Upload File"}
                </button>
                {pdfFileUrl && (
                  <p className="text-sm text-green-600 mt-2">File uploaded successfully!</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 text-white py-2 px-4 rounded-lg mt-4 hover:bg-green-600"
              >
                {loading ? "Adding Section..." : "Add Section"}
              </button>
            </form>

            {message && <p className="text-center text-gray-600 mt-4">{message}</p>}
          </div>
        </main>
      </div>
      <Footer/>
    </div>
  );
};

export default TAddNewSection;
