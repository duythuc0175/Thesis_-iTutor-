import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardCard from "../Utilities/DashboardCard";

const DashboardOverview = () => {
  const [tutorCount, setTutorCount] = useState(0);

  useEffect(() => {
    const fetchTutorCount = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get("http://localhost:4000/api/v1/tutor/count", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTutorCount(response.data.count);
      } catch (error) {
        setTutorCount(0);
      }
    };
    fetchTutorCount();
  }, []);

  const stats = [
    { title: "Total Tutors", count: tutorCount, icon: "👩‍🏫" },
    { title: "Total Students", count: 120, icon: "👩‍🎓" },
    { title: "Subjects Offered", count: 20, icon: "📚" },
    { title: "Pending Approvals", count: 5, icon: "⏳" },
  ];

  return (
    <div className="dashboard-overview">
      <h2 className="text-2xl font-semibold mb-4">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <DashboardCard
            key={index}
            title={stat.title}
            count={stat.count}
            icon={stat.icon}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardOverview;
