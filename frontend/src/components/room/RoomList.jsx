import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import RoomCard from './RoomCard';
import CreateRoomModal from './createRoomModal';
import './RoomList.css';

function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { user, sessionToken, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Filter states
  const [roomTypeFilter, setRoomTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [activeTab, setActiveTab] = useState('all');

  // Check if user is new and redirect to welcome page
  useEffect(() => {
    if (user?.userId) {
      const hasSeenWelcome = localStorage.getItem(`welcome_seen_${user.userId}`);
      if (!hasSeenWelcome) {
        navigate('/welcome', { replace: true });
        return;
      }
    }
  }, [user, navigate]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Load rooms from API
  const loadRooms = useCallback(async () => {
    if (!sessionToken || !user?.userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://studysphere-n4up.onrender.com//api/rooms?userId=${user.userId}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        }
      });
      
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
  }, [sessionToken, user?.userId]);

  // Create a new room
  const handleCreateRoom = async (roomData) => {
    if (!sessionToken) {
      throw new Error('Authentication required');
    }

    try {
      console.log('Creating room:', roomData);
      
      const response = await fetch('https://studysphere-n4up.onrender.com//api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ 
          ...roomData, 
          sessionToken
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create room');
      }

      const newRoom = await response.json();
      console.log('Room created:', newRoom);
      
      setRooms(prev => [newRoom, ...prev]);
      
      return newRoom;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  };

  // Delete a room
  const handleDeleteRoom = async (roomId) => {
    if (!sessionToken) {
      alert('Authentication required');
      return;
    }

    try {
      const response = await fetch(`https://studysphere-n4up.onrender.com//api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ sessionToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete room');
      }

      setRooms(prev => prev.filter(room => room.roomId !== roomId));
      console.log(`Room ${roomId} deactivated`);
      alert('Room has been deactivated successfully.');
    } catch (error) {
      console.error('Error deleting room:', error);
      alert(`Error deleting room: ${error.message}`);
    }
  };

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...rooms];

    // Apply active tab filter first
    if (activeTab !== 'all') {
      switch (activeTab) {
        case 'active':
          filtered = filtered.filter(room => (room.currentParticipants || 0) > 0);
          break;
        case 'my-rooms':
          filtered = filtered.filter(room => room.isUserCreator);
          break;
        default:
          break;
      }
    }

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
        case 'my-rooms':
          filtered = filtered.filter(room => room.isUserCreator);
          break;
        default:
          break;
      }
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(room =>
        room.name.toLowerCase().includes(query) ||
        (room.topic && room.topic.toLowerCase().includes(query)) ||
        (room.description && room.description.toLowerCase().includes(query)) ||
        (room.creatorName && room.creatorName.toLowerCase().includes(query))
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
  }, [rooms, roomTypeFilter, statusFilter, searchQuery, sortBy, activeTab]);

  // Load rooms on component mount and set up refresh interval
  useEffect(() => {
    if (sessionToken && user?.userId) {
      loadRooms();
      
      const interval = setInterval(loadRooms, 30000);
      return () => clearInterval(interval);
    }
  }, [loadRooms, sessionToken, user?.userId]);

  const getFilterCounts = () => {
    const publicRooms = rooms.filter(r => r.roomType === 'public').length;
    const privateRooms = rooms.filter(r => r.roomType === 'private').length;
    const activeRooms = rooms.filter(r => (r.currentParticipants || 0) > 0).length;
    const emptyRooms = rooms.filter(r => (r.currentParticipants || 0) === 0).length;
    const myRooms = rooms.filter(r => r.isUserCreator).length;
    
    return { publicRooms, privateRooms, activeRooms, emptyRooms, myRooms };
  };

  if (!isAuthenticated) {
    return null;
  }

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

  const filterCounts = getFilterCounts();

  return (
    <div className="room-list-container">
      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={loadRooms} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Premium Filter Control Panel */}
      <div className="filter-control-panel">
        {/* Search Header with Create Button */}
        <div className="search-header">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by room name, topic, creator, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <div className="search-icon">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </div>
          </div>
          <button 
            className="create-room-btn"
            onClick={() => setShowCreateModal(true)}
          >
            + Create Room
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs-container">
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Rooms
            </button>
            <button 
              className={`filter-tab ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              Active
            </button>
            <button 
              className={`filter-tab ${activeTab === 'my-rooms' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-rooms')}
            >
              My Rooms
            </button>
          </div>
        </div>

        {/* Refined Filter Controls */}
        <div className="filter-controls">
          <div className="filter-row">
            <div className="filter-group">
              <label>Room Type</label>
              <select
                value={roomTypeFilter}
                onChange={(e) => setRoomTypeFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Types ({rooms.length})</option>
                <option value="public">Public ({filterCounts.publicRooms})</option>
                <option value="private">Private ({filterCounts.privateRooms})</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Room Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="active">Active ({filterCounts.activeRooms})</option>
                <option value="empty">Empty ({filterCounts.emptyRooms})</option>
                <option value="my-rooms">My Rooms ({filterCounts.myRooms})</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sort Order</label>
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
      </div>

      {/* Content Area */}
      <div className="content-area">
        {/* 3-Column Room Grid */}
        <div className="room-grid">
          {filteredRooms.length === 0 ? (
            <div className="empty-state">
              {rooms.length === 0 ? (
                <>
                  <div className="empty-icon">🏠</div>
                  <h3>No study rooms yet</h3>
                  <p>Be the first to create a study room and invite others to join your learning session! Start building your study community today.</p>
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
                  <p>Try adjusting your search criteria or create a new room that fits your study needs.</p>
                  <div className="empty-actions">
                    <button 
                      className="clear-filters-btn"
                      onClick={() => {
                        setSearchQuery('');
                        setRoomTypeFilter('all');
                        setStatusFilter('all');
                        setActiveTab('all');
                      }}
                    >
                      Clear Filters
                    </button>
                    <button 
                      className="create-room-btn"
                      onClick={() => setShowCreateModal(true)}
                    >
                      Create Room
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
                userId={user?.userId}
                onDelete={handleDeleteRoom}
                sessionToken={sessionToken}
              />
            ))
          )}
        </div>
      </div>

      {/* Floating Refresh Button */}
      <button 
        className="refresh-btn"
        onClick={loadRooms}
        title="Refresh rooms"
        disabled={isLoading}
      >
        {isLoading ? '🕒' : '🔄'}
      </button>

      {/* Create Room Modal */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreateRoom={handleCreateRoom}
          user={user}
        />
      )}
    </div>
  );
}

export default RoomList;