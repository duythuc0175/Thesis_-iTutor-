import { useState } from "react";

export default function FormRequestClass() {
  const [formData, setFormData] = useState({
    groupClassTimes: [], // Array to store selected times
  });

  const availableTimes = [
    { day: "Monday", times: ["10:00 AM - 12:00 PM", "2:00 PM - 4:00 PM"] },
    { day: "Wednesday", times: ["10:00 AM - 12:00 PM", "2:00 PM - 4:00 PM"] },
    { day: "Friday", times: ["10:00 AM - 12:00 PM", "2:00 PM - 4:00 PM"] },
  ];

  const handleTimeSelection = (day, time) => {
    const selectedTime = `${day} ${time}`;
    setFormData((prev) => {
      const isSelected = prev.groupClassTimes.includes(selectedTime);
      return {
        ...prev,
        groupClassTimes: isSelected
          ? prev.groupClassTimes.filter((t) => t !== selectedTime) // Remove if already selected
          : [...prev.groupClassTimes, selectedTime], // Add if not selected
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted with data:", formData);
    // Add your form submission logic here
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded shadow-md max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Request Group Class</h2>

      <div className="mb-6">
        <label className="block text-lg font-medium text-gray-700 mb-4">
          Select Available Group Class Times
        </label>
        <div className="space-y-4">
          {availableTimes.map(({ day, times }) => (
            <div key={day} className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{day}</h3>
              <div className="grid grid-cols-2 gap-4">
                {times.map((time) => (
                  <div key={time} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`${day}-${time}`}
                      value={`${day} ${time}`}
                      checked={formData.groupClassTimes.includes(`${day} ${time}`)}
                      onChange={() => handleTimeSelection(day, time)}
                      className="mr-2"
                    />
                    <label htmlFor={`${day}-${time}`} className="text-sm text-gray-700">
                      {time}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
      >
        Submit
      </button>
    </form>
  );
}
