import React from 'react';
import './ParticipantList.css';

function ParticipantList({ participants, localUserId }) {
  return (
    <div className="participant-list">
      <h3>Participants ({participants.length})</h3>
      <ul>
        {participants.map((participant) => (
          <li key={participant.id}>
            {participant.name} {participant.id === localUserId && '(You)'}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ParticipantList;