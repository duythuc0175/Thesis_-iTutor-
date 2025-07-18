import React, { useState, useEffect } from 'react';
import '../../css/student/SchedulePage.css';

export default function SchedulePage() {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [fetchingClasses, setFetchingClasses] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setFetchingClasses(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      const response = await fetch("http://localhost:4000/api/v1/classes/accepted-classes", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const transformedEvents = data.acceptedClasses.map((classItem) => {
          const startTime = new Date(classItem.time);
          const endTime = new Date(startTime.getTime() + (classItem.duration || 60) * 60000);

          return {
            id: classItem._id,
            title: classItem.type === "Group"
              ? `[GROUP] ${classItem.title || "Group Class"}`
              : (classItem.title?.replace(/^Personal Class for /, "") || "Untitled Class"),
            start: startTime,
            end: endTime,
            description: classItem.course?.courseDescription || "No description provided",
            meetLink: classItem.classLink || "",
            tutorName: classItem.tutor?.firstName || classItem.tutor?.email || "Unknown Tutor",
            participants: classItem.participants?.length || 0,
            type: classItem.type,
          };
        });

        setEvents(transformedEvents);
      } else {
        console.error("Failed to fetch classes");
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setFetchingClasses(false);
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const changeDate = (direction) => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7);
    }
    setSelectedDate(newDate);
  };

  const isToday = (date) => {
    const today = new Date();
    return today.getDate() === date.getDate() &&
      today.getMonth() === date.getMonth() &&
      today.getFullYear() === date.getFullYear();
  };

  const generateCalendarView = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const day = selectedDate.getDate();

    switch (viewMode) {
      case 'month':
        return generateMonthView(year, month, events);
      case 'week':
        return generateWeekView(year, month, day, events);
      default:
        return generateMonthView(year, month, events);
    }
  };

  const generateMonthView = (year, month, allEvents) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDayOfWeek = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);

      const dayEvents = allEvents.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate.getFullYear() === year &&
          eventDate.getMonth() === month &&
          eventDate.getDate() === day;
      });

      days.push({ date: currentDate, events: dayEvents });
    }

    return days;
  };

  const generateWeekView = (year, month, day, allEvents) => {
    const weekStart = new Date(year, month, day - new Date(year, month, day).getDay());

    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);

      const dayEvents = allEvents.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate.getFullYear() === currentDate.getFullYear() &&
          eventDate.getMonth() === currentDate.getMonth() &&
          eventDate.getDate() === currentDate.getDate();
      });

      days.push({ date: currentDate, events: dayEvents });
    }

    return days;
  };

  const renderView = () => {
    if (fetchingClasses) {
      return (
        <div className="loading-container">
          <div className="loading-message">Loading classes...</div>
        </div>
      );
    }

    if (events.length === 0) {
      return (
        <div className="no-events-message">
          <p>No scheduled classes found. Check back later or refresh to update.</p>
        </div>
      );
    }

    const calendarData = generateCalendarView();

    return (
      <div className="grid grid-cols-7 gap-2 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="font-bold text-gray-600">{day}</div>
        ))}
        {calendarData.map((day, index) => (
          <div
            key={index}
            className={`border p-2 min-h-[100px] ${day ? 'bg-white' : 'bg-gray-100'} ${day && isToday(day.date) ? 'bg-yellow-300' : ''}`}
          >
            {day && (
              <>
                <div className="date-number">{day.date.getDate()}</div>
                {day.events.length > 0 ? (
                  day.events.map(event => (
                    <div
                      key={event.id}
                      className={`event-item ${event.type === 'Group' ? 'group-class' : 'personal-class'}`}
                    >
                      <div className="event-title" title={event.title} style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '160px', // adjust as needed for your card size
                        display: 'block',
                      }}>{event.title}</div>
                      <div className="event-time">
                        {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                        {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="event-details">
                        {event.tutorName && (
                          <div className="tutor-name">Tutor: {event.tutorName}</div>
                        )}
                        {event.meetLink && (
                          <a
                            href={event.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="meet-link"
                          >
                            Join Meeting
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                ) : null}
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="schedule-container">
      <div className="schedule-content">
        <div className="header-container">
          <h1 className="main-title">Class Schedule</h1>
          <button
            onClick={fetchClasses}
            className="refresh-btn"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="controls-container">
          <div className="view-toggle">
            <button
              onClick={() => setViewMode('month')}
              className={`toggle-btn ${viewMode === 'month' ? 'active-toggle' : ''}`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`toggle-btn ${viewMode === 'week' ? 'active-toggle' : ''}`}
            >
              Week
            </button>
          </div>

          <div className="navigation-controls">
            <button
              onClick={goToToday}
              className="today-btn"
            >
              Today
            </button>
            <button
              onClick={() => changeDate(-1)}
              className="nav-btn"
            >
              Previous
            </button>
            <h2 className="date-title">
              {viewMode === 'month' ? selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' }) : selectedDate.toDateString()}
            </h2>
            <button
              onClick={() => changeDate(1)}
              className="nav-btn"
            >
              Next
            </button>
          </div>
        </div>

        {renderView()}
      </div>
    </div>
  );
}