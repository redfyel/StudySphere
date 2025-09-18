import React from 'react';

function JoinRequests({ requests, onRequestResponse }) {
  return (
    <div className="join-requests">
      <h3>Join Requests</h3>
      {requests.length === 0 ? (
        <p>No pending requests</p>
      ) : (
        <ul>
          {requests.map((request) => (
            <li key={request.userId}>
              <span>{request.username}</span>
              <div className="request-actions">
                <button onClick={() => onRequestResponse(request.userId, 'approve')}>
                  Approve
                </button>
                <button onClick={() => onRequestResponse(request.userId, 'reject')}>
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default JoinRequests;
