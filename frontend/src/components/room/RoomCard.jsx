import React from 'react';
import { Link } from 'react-router-dom';

function RoomCard({ room }) {
  return (
    <div className="room-card">
      <h3>{room.name}</h3>
      <p>Topic: {room.topic}</p>
      <p> {room.participants}</p>
      <Link to={`/room/${room.id}`}>
        <button>Join Room</button>
      </Link>
    </div>
  );
}

export default RoomCard;