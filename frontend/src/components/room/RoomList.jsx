import React, { useState, useEffect } from 'react';
import RoomCard from './RoomCard';
import CreateRoomModal from './createRoomModal';

// Helper to manage rooms in localStorage
const getStoredRooms = () => {
  try {
    const storedRooms = localStorage.getItem('studyRoomConnectRooms');
    return storedRooms ? JSON.parse(storedRooms) : [
      { id: 'room-1', name: 'Math Study Group', topic: 'Algebra', participants: 0 },
      { id: 'room-2', name: 'Science Lab', topic: 'Physics', participants: 0 },
      { id: 'room-3', name: 'History Buffs', topic: 'World History', participants: 0 },
    ];
  } catch (error) {
    console.error("Failed to parse rooms from localStorage", error);
    return [];
  }
};

const saveRooms = (rooms) => {
  localStorage.setItem('studyRoomConnectRooms', JSON.stringify(rooms));
};

function RoomList() {
  const [rooms, setRooms] = useState(getStoredRooms);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    saveRooms(rooms);
  }, [rooms]);

  const handleCreateRoom = ({ name, topic }) => {
    const newRoom = {
      id: `room-${Date.now()}`, // Simple unique ID
      name,
      topic,
      participants: 0, // Starts with 0 participants
    };
    setRooms((prevRooms) => [...prevRooms, newRoom]);
  };

  return (
    <div className="room-list">
      <h1>StudyRoom Connect</h1>
      <div className="create-room-section">
        <button onClick={() => setIsCreateModalOpen(true)}>Create New Room</button>
      </div>
      <div className="room-grid">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>

      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateRoom={handleCreateRoom}
      />
    </div>
  );
}

export default RoomList;
