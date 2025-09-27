import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Tasks.css';

import CustomToolBar from './CustomToolBar';
import CustomEvent from './CustomEvent';
import Sidebar from './Sidebar';

const localizer = momentLocalizer(moment);

const EVENT_TYPES = {
  'Work-Orders': { color: '#F8A5A5', icon: 'wrench' },
  'Move-Ins': { color: '#82CA9D', icon: 'arrow-right' },
  'Move-Outs': { color: '#90B8F5', icon: 'arrow-left' },
  'Notes & Reminders': { color: '#F9C784', icon: 'sticky-note' }
};

const Tasks = () => {
  const [events, setEvents] = useState([
    { start: moment('2025-09-09').toDate(), end: moment('2025-09-09').toDate(), title: "Work Orders", type: 'Work-Orders', count: 15 },
    { start: moment('2025-09-09').toDate(), end: moment('2025-09-09').toDate(), title: "Move-Ins", type: 'Move-Ins', count: 9 },
    { start: moment('2025-09-09').toDate(), end: moment('2025-09-09').toDate(), title: "Nicole Spencer", type: 'Move-Ins', id: 286 },
    { start: moment('2025-09-29').toDate(), end: moment('2025-09-29').toDate(), title: "Work Orders", type: 'Work-Orders', count: 15 },
    { start: moment('2025-09-29').toDate(), end: moment('2025-09-29').toDate(), title: "Move-Ins", type: 'Move-Ins', count: 9 },
    { start: moment('2025-09-29').toDate(), end: moment('2025-09-29').toDate(), title: "Move-Outs", type: 'Move-Outs', count: 3 },
    { start: moment('2025-09-29').toDate(), end: moment('2025-09-29').toDate(), title: "Notes", type: 'Notes & Reminders', count: 2 }
  ]);
  const [activeDate, setActiveDate] = useState(new Date());

  const components = {
    toolbar: (props) => <CustomToolBar {...props} onNavigate={date => setActiveDate(date)} />,
    event: CustomEvent,
  };

  return (
    <div className="calendar-container">
        <Sidebar eventTypes={EVENT_TYPES} activeDate={activeDate} />
        <main className="calendar-main">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                views={['month']}
                components={components}
                date={activeDate}
                onNavigate={date => setActiveDate(date)}
            />
        </main>
    </div>
  );
};

export default Tasks;