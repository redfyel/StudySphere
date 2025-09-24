import React from 'react';
import moment from 'moment';
import './Agenda.css';
import EmptyAgenda from './EmptyAgenda'; // Assuming this component exists

const Agenda = ({ activeDate, events, eventTypes }) => {
  const tasksForSelectedDate = events
    .filter(event => moment(event.start).isSame(activeDate, "day"))
    .sort((a, b) => a.start - b.start);

  return (
    <div className="agenda-container">
      <h3 className="agenda-title">Agenda for</h3>
      <p className="agenda-date-subtitle">{moment(activeDate).format("MMMM Do, YYYY")}</p>
      <div className="agenda-items-list">
        {tasksForSelectedDate.length > 0 ? (
          tasksForSelectedDate.map((task, index) => (
            <div
              key={index}
              className="agenda-item"
              style={{ '--task-color': eventTypes[task.type]?.color || 'grey' }}
            >
              <div className="agenda-item-content">
                <span className="agenda-item-title">{task.title}</span>
                <span className="agenda-item-time">{moment(task.start).format("h:mm A")}</span>
              </div>
            </div>
          ))
        ) : (
          <EmptyAgenda />
        )}
      </div>
    </div>
  );
};

export default Agenda;