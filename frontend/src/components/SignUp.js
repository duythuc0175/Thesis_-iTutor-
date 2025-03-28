import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import axios from "axios";
import "./css/SignUp.css";

export default function SignUp() {
  const tabData = [
    {
      id: 1,
      tabName: "Student",
      type: "Student",
    },
    {
      id: 2,
      tabName: "Tutor",
      type: "Tutor",
    },
  ];

  const [field, setField] = useState("Student");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    resumePath: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    // Ensure the selected file is a PDF
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }

    setError(null); // Clear previous errors
    setLoading(true);

    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "edulink_uploads"); // Cloudinary-specific upload preset
      formData.append("cloud_name", "dhgyagjqw"); // Cloudinary cloud name
      formData.append("folder", "tutor_resumes"); // Folder for uploaded resumes

      // Upload file to Cloudinary
      const res = await fetch("https://api.cloudinary.com/v1_1/dhgyagjqw/upload", {
        method: "POST",
        body: formData,
      });

      const uploadedFile = await res.json();
      console.log(uploadedFile)
      if (uploadedFile.url) {
        // Update formData with the uploaded file URL
        setFormData((prev) => ({
          ...prev,
          resumePath: uploadedFile.url,
        }));
      } else {
        throw new Error("Failed to upload the file. Please try again.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(error.message || "An error occurred during the file upload.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (field === "Tutor" && !formData.resumePath) {
      setError("Resume is required for Tutor accounts.");
      return;
    }

    const payload = new FormData();
    payload.append("firstName", formData.firstName);
    payload.append("lastName", formData.lastName);
    payload.append("email", formData.email);
    payload.append("password", formData.password);
    payload.append("accountType", field);
    if (formData.resumePath && field === "Tutor") {
      payload.append("resumePath", formData.resumePath);
    }

    try {
      setLoading(true);
      setError(null);
      await axios.post("http://localhost:4000/api/v1/auth/signup", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setSuccessMessage("Signup successful! Redirecting to home...");
      setTimeout(() => {
        setSuccessMessage(null);
        navigate("/");
      }, 2500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "An error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}>
      <Navbar />
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-r">
        <div className="w-full max-w-lg bg-richblack-800 p-8 rounded-xl shadow-xl transform transition-transform hover:scale-105 hover:shadow-2xl duration-500 mt-20">
          <h1 className="text-3xl font-semibold mb-8 text-center text-richblack-5">
            Register Here
          </h1>

          <div className="relative flex bg-richblack-800 p-1 gap-x-1 my-6 rounded-full max-w-max">
            {tabData.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setField(tab.type)}
                className={`py-2 px-5 rounded-lg transition-all duration-200 text-lg font-semibold ${
                  field === tab.type ? "bg-yellow-400 text-black" : "bg-transparent text-white"
                }`}
              >
                {tab?.tabName}
              </button>
            ))}
          </div>

          {successMessage && (
            <div className="bg-green-500 text-white p-3 rounded-md mb-4">
              {successMessage}
            </div>
          )}

          <form className="flex w-full flex-col gap-y-4" onSubmit={handleSubmit}>
            <div className="flex gap-x-4">
              <label className="w-full">
                <p className="mb-2 text-[0.875rem] leading-[1.375rem] text-richblack-5">
                  First Name <sup className="text-pink-200">*</sup>
                </p>
                <input
                  required
                  type="text"
                  name="firstName"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full rounded-lg p-[14px] border focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
                />
              </label>

              <label className="w-full">
                <p className="mb-2 text-[0.875rem] leading-[1.375rem] text-richblack-5">
                  Last Name <sup className="text-pink-200">*</sup>
                </p>
                <input
                  required
                  type="text"
                  name="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full rounded-lg p-[14px] border focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
                />
              </label>
            </div>

            <label className="w-full">
              <p className="mb-2 text-[0.875rem] leading-[1.375rem] text-richblack-5">
                Email <sup className="text-pink-200">*</sup>
              </p>
              <input
                required
                type="email"
                name="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg p-[14px] border focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
              />
            </label>

            <label className="w-full">
              <p className="mb-2 text-[0.875rem] leading-[1.375rem] text-richblack-5">
                Password <sup className="text-pink-200">*</sup>
              </p>
              <input
                required
                type="password"
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-lg p-[14px] border focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
              />
            </label>

            <label className="w-full">
              <p className="mb-2 text-[0.875rem] leading-[1.375rem] text-richblack-5">
                Confirm Password <sup className="text-pink-200">*</sup>
              </p>
              <input
                required
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-lg p-[14px] border focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
              />
            </label>

            {field === "Tutor" && (
              <label className="w-full">
                <p className="mb-2 text-[0.875rem] leading-[1.375rem] text-richblack-5">
                  Resume <sup className="text-pink-200">*</sup>
                </p>
                <input
                  required
                  type="file"
                  name="resumePath"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full rounded-lg p-[14px] border focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
                />
                {error && <span className="text-red-500 text-sm">{error}</span>}
              </label>
            )}

            <button
              type="submit"
              className="bg-yellow-400 py-3 px-6 text-black text-lg rounded-lg font-semibold hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all mt-6"
            >
              {loading ? "Submitting..." : "Sign Up"}
            </button>

            {error && (
              <div className="bg-red-500 text-white p-3 rounded-md">
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </motion.div>
  );
}