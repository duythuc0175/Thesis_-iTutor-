import Sidebar from "../Sidebar";
import React from "react";
import TSchedulePage from "./TSchedulePage";
import Header from "../Header";
import Footer from "../Footer";

export default function TSchedule(){
    return(
        <div className="flex min-h-screen bg-gray-100">
          <Header/>
        <div className="fixed top-0 left-0 w-64 h-screen bg-richblue-800 border-r border-richblack-700">
        
          <Sidebar />
        </div>
        <div className="flex-1 ml-64 p-8 overflow-y-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Schedule</h1>
          <div className="calendar-container bg-white shadow-md rounded-lg p-6">
            <TSchedulePage/>
          </div>
        </div>
        <Footer/>
      </div>
    )
}