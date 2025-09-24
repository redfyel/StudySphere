import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import RoomCard from './RoomCard';
import CreateRoomModal from './CreateRoomModal';
import './RoomList.css';

function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userId] = useState(() => {
    // Get or create a persistent user ID
    let id = localStorage.getItem('studyRoomUserId');
    if (!id) {
      id = uuidv4();
      localStorage.setItem('studyRoomUserId', id);
    }
    return id;
  });

  // Filter states
  const [roomTypeFilter, setRoomTypeFilter] = useState('all'); // 'all', 'public', 'private'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'empty', 'active'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'participants', 'name'

  // Load rooms from API
  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/rooms');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Loaded rooms:', data.length);
      setRooms(data);
    } catch (error) {
      console.error('Error loading rooms:', error);
      setError('Failed to load rooms. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new room
  const handleCreateRoom = async (roomData) => {
    try {
      console.log('Creating room:', roomData);
      
      const response = await fetch('http://localhost:3001/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create room');
      }

      const newRoom = await response.json();
      console.log('Room created:', newRoom);
      
      // Add the new room to the list
      setRooms(prev => [newRoom, ...prev]);
      
      return newRoom;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  };

  // Delete a room
  const handleDeleteRoom = async (roomId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete room');
      }

      // Remove the room from the list
      setRooms(prev => prev.filter(room => room.roomId !== roomId));
      console.log(`Room ${roomId} deleted`);
    } catch (error) {
      console.error('Error deleting room:', error);
      alert(`Error deleting room: ${error.message}`);
    }
  };

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...rooms];

    // Apply room type filter
    if (roomTypeFilter !== 'all') {
      filtered = filtered.filter(room => room.roomType === roomTypeFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'empty':
          filtered = filtered.filter(room => (room.currentParticipants || 0) === 0);
          break;
        case 'active':
          filtered = filtered.filter(room => (room.currentParticipants || 0) > 0);
          break;
      }
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(room =>
        room.name.toLowerCase().includes(query) ||
        (room.topic && room.topic.toLowerCase().includes(query)) ||
        (room.description && room.description.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'participants':
          return (b.currentParticipants || 0) - (a.currentParticipants || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    setFilteredRooms(filtered);
  }, [rooms, roomTypeFilter, statusFilter, searchQuery, sortBy]);

  // Load rooms on component mount and set up refresh interval
  useEffect(() => {
    loadRooms();
    
    // Refresh rooms every 30 seconds to update participant counts
    const interval = setInterval(loadRooms, 30000);
    return () => clearInterval(interval);
  }, [loadRooms]);

  const getFilterCounts = () => {
    const publicRooms = rooms.filter(r => r.roomType === 'public').length;
    const privateRooms = rooms.filter(r => r.roomType === 'private').length;
    const activeRooms = rooms.filter(r => (r.currentParticipants || 0) > 0).length;
    const emptyRooms = rooms.filter(r => (r.currentParticipants || 0) === 0).length;
    
    return { publicRooms, privateRooms, activeRooms, emptyRooms };
  };

  const filterCounts = getFilterCounts();

  if (isLoading && rooms.length === 0) {
    return (
      <div className="room-list-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading study rooms...</h2>
          <p>Please wait while we fetch the available rooms</p>
        </div>
      </div>
    );
  }

  return (
    <div className="room-list-container">
      {/* Header */}
      <div className="room-list-header">
        <div className="header-content">
          <h1>StudyVerse Rooms</h1>
          <p>Join existing study sessions or create your own focused study environment</p>
        </div>
        <button 
          className="create-room-btn"
          onClick={() => setShowCreateModal(true)}
        >
          + Create New Room
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={loadRooms} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search rooms by name, topic, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label>Room Type:</label>
            <select
              value={roomTypeFilter}
              onChange={(e) => setRoomTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Rooms ({rooms.length})</option>
              <option value="public">🌐 Public ({filterCounts.publicRooms})</option>
              <option value="private">🔒 Private ({filterCounts.privateRooms})</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">🔴 Active ({filterCounts.activeRooms})</option>
              <option value="empty">⭕ Empty ({filterCounts.emptyRooms})</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="participants">Most Active</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <span className="results-count">
          Showing {filteredRooms.length} of {rooms.length} rooms
        </span>
        {filteredRooms.length === 0 && searchQuery && (
          <span className="no-results-hint">
            Try adjusting your search or filters
          </span>
        )}
      </div>

      {/* Room Grid */}
      <div className="room-grid">
        {filteredRooms.length === 0 ? (
          <div className="empty-state">
            {rooms.length === 0 ? (
              <>
                <div className="empty-icon">🏠</div>
                <h3>No study rooms yet</h3>
                <p>Be the first to create a study room and invite others to join your learning session!</p>
                <button 
                  className="create-first-room-btn"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Your First Room
                </button>
              </>
            ) : (
              <>
                <div className="empty-icon">🔍</div>
                <h3>No rooms match your filters</h3>
                <p>Try adjusting your search criteria or create a new room</p>
                <div className="empty-actions">
                  <button 
                    className="clear-filters-btn"
                    onClick={() => {
                      setSearchQuery('');
                      setRoomTypeFilter('all');
                      setStatusFilter('all');
                    }}
                  >
                    Clear Filters
                  </button>
                  <button 
                    className="create-room-btn"
                    onClick={() => setShowCreateModal(true)}
                  >
                    Create New Room
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          filteredRooms.map((room) => (
            <RoomCard
              key={room.roomId}
              room={room}
              userId={userId}
              onDelete={handleDeleteRoom}
            />
          ))
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreateRoom={handleCreateRoom}
          userId={userId}
        />
      )}

      {/* Refresh Button (fixed position) */}
      <button 
        className="refresh-btn"
        onClick={loadRooms}
        title="Refresh rooms"
        disabled={isLoading}
      >
        {isLoading ? '⏳' : '🔄'}
      </button>
    </div>
  );
}

export default RoomList;