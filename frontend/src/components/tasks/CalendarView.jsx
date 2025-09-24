// src/components/tasks/CalendarView.js

import React, { useState, useCallback } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./CalendarView.css"; // We will replace the content of this file

import { initialEvents } from "./events";
import EventModal from "./EventModal";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const CalendarView = () => {
  const [events, setEvents] = useState(initialEvents);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const handleSelectSlot = useCallback(({ start, end }) => {
    if (start.getDate() !== end.getDate() && end.getHours() === 0 && end.getMinutes() === 0) {
        return;
    }
    setSelectedSlot({ start, end });
    setModalIsOpen(true);
  }, []);

  const handleSelectEvent = useCallback((event) => {
    setSelectedSlot(event);
    setModalIsOpen(true);
  }, []);
  
  const handleSaveEvent = (eventData) => {
    if (selectedSlot?.id) {
      setEvents(events.map(e => 
        e.id === selectedSlot.id ? { ...e, ...eventData, title: eventData.title || "Untitled Event" } : e
      ));
    } else {
      const newEvent = {
        id: new Date().getTime(),
        title: eventData.title || "Untitled Event",
        color: eventData.color,
        start: selectedSlot.start,
        end: selectedSlot.end,
      };
      setEvents([...events, newEvent]);
    }
    setModalIsOpen(false);
  };

  // --- THIS IS THE CORRECTED PART FOR THE NEW DESIGN ---
    const eventPropGetter = useCallback(
    (event) => ({
      style: {
        backgroundColor: event.color,
      },
    }),
    []
  );

  // --- END OF CORRECTION ---

  return (
    // Use the className "calendar-container"
    <div className="calendar-container"> 
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
                eventPropGetter={eventPropGetter}
        defaultView="week"
        
        views={["month", "week", "day"]}
      />
      <EventModal
        isOpen={modalIsOpen}
        onClose={() => setModalIsOpen(false)}
        onSave={handleSaveEvent}
        event={selectedSlot?.id ? selectedSlot : null}
      />
    </div>
  );
};

export default CalendarView;