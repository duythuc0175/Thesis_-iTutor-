import React, { useState } from "react";
import axios from "axios";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import Header from "../Header";
import Footer from "../Footer";

const TAddNewSection = () => {
  const [sectionName, setSectionName] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = React.useRef(null);
  const navigate = useNavigate();

  // Handle file selection (no upload here)
  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0]);
    setMessage("");
  };

  // On submit: upload file, then create section
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!sectionName || !pdfFile) {
      setMessage("Section name and file are required.");
      return;
    }
    setLoading(true);
    try {
      // 1. Upload file
      const formData = new FormData();
      formData.append("file", pdfFile);
      const uploadRes = await axios.post(
        "http://localhost:4000/api/v1/sections/upload-file",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const fileUrl = uploadRes.data.fileUrl;
      // 2. Create section
      const sectionRes = await axios.post(
        "http://localhost:4000/api/v1/sections/add",
        { sectionName, fileUrl },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setMessage(sectionRes.data.message);
      if (sectionRes.data.success) {
        setSectionName("");
        setPdfFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "An error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4">
          <Header />
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
              <div className="flex flex-col">
                <label htmlFor="pdfFile" className="text-gray-600 text-sm mb-1">
                  Upload File (PDF or DOCX)
                </label>
                <input
                  type="file"
                  id="pdfFile"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="border border-gray-300 rounded-lg p-2"
                  required
                  ref={fileInputRef}
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !sectionName || !pdfFile}
                className="w-full bg-green-500 text-white py-2 px-4 rounded-lg mt-4 hover:bg-green-600"
              >
                {loading ? "Adding Section..." : "Add Section"}
              </button>
            </form>
            {message && <p className="text-center text-gray-600 mt-4">{message}</p>}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};


export default TAddNewSection;


