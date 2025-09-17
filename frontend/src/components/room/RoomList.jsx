import React, { useState } from 'react';
import RoomCard from './RoomCard';

function RoomList() {
  const [rooms, setRooms] = useState([
    { id: 1, name: 'Math Study Group', topic: 'Algebra', participants: 3 },
    { id: 2, name: 'Science Lab', topic: 'Physics', participants: 2 },
    { id: 3, name: 'History Buffs', topic: 'World History', participants: 4 },
  ]);

  return (
    <div className="room-list">
      <h1>StudyRoom Connect</h1>
      <div className="room-grid">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
}

export default RoomList;