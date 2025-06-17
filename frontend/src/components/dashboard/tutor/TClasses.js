import React, { useState, useEffect } from "react";
import Footer from "../Footer";
import Header from "../Header";
import Sidebar from "../Sidebar";
import CourseCard from "./CourseCard";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const formatTimeRange = (startTime, duration) => {
    if (!startTime || !duration) return "No time specified";
    const start = new Date(startTime);
    if (isNaN(start.getTime())) return "Invalid time";

    const end = new Date(start.getTime() + duration * 60000); // Add duration in minutes
    const options = { hour: "2-digit", minute: "2-digit", hour12: true };

    return `${start.toLocaleTimeString("en-US", options)} - ${end.toLocaleTimeString("en-US", options)}`;
};

export default function TClasses() {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get("http://localhost:4000/api/v1/classes/tutor-classes", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setClasses(response.data.classes || []);
            } catch (err) {
                console.error("Error fetching classes:", err);
                setError("Failed to fetch classes. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchClasses();
    }, []);

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Header />
            {/* Sidebar */}
            <div className="fixed top-0 left-0 w-64 h-screen bg-richblue-800 border-r border-richblack-700">
                <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 ml-64 p-8 overflow-y-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-4 pt-14">Classes</h1>

                {loading ? (
                    <p>Loading classes...</p>
                ) : error ? (
                    <p className="text-red-600">{error}</p>
                ) : classes.length === 0 ? (
                    <p>No classes found.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classes.map((classItem) => (
                            <div key={classItem._id} className="relative">
                                <CourseCard
                                    id={classItem._id}
                                    title={classItem.title || "Untitled Class"}
                                    type={classItem.type}
                                    time={classItem.time} // Pass raw date string
                                    description={classItem.course?.courseDescription || "No description provided"}
                                    studentName={classItem.student ? `${classItem.student.firstName || ''} ${classItem.student.lastName || ''}`.trim() || "No student info" : "No student info"}
                                    participants={classItem.participants || []}
                                    meetLink={classItem.classLink}
                                    duration={classItem.duration}
                                />
                                <div className="mt-2">
                                    <button
                                        className="bg-blue-600 text-white px-3 py-1 rounded mt-1"
                                        onClick={() => navigate(`/dashboard/tutor/class/${classItem._id}/assignment`)}
                                    >
                                        Manage Assignment
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}