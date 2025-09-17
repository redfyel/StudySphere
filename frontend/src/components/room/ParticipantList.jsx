import React from 'react';

function ParticipantList({ participants }) {
  return (
    <div className="participant-list">
      <h3>Participants ({participants.length})</h3>
      <ul>
        {participants.map((participant, index) => (
          <li key={index}>{participant}</li>
        ))}
      </ul>
    </div>
  );
}

export default ParticipantList;