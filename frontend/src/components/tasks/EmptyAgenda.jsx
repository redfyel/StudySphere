import React from 'react';

const EmptyAgenda = () => {
  return (
    <div className="empty-agenda-container">
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 21C17 17.5 14.5 15.5 12 15.5C9.5 15.5 7 17.5 7 21" stroke="#D3D3D3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 15.5V12.5" stroke="#D3D3D3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 12.5C13.1046 12.5 14 11.6046 14 10.5C14 9.39543 13.1046 8.5 12 8.5C10.8954 8.5 10 9.39543 10 10.5C10 11.6046 10.8954 12.5 12 12.5Z" stroke="#D3D3D3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14.5 10.5C15.9 10.5 16.5 9.4 16.5 8C16.5 6.6 15.9 5.5 14.5 5.5" stroke="#D3D3D3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9.5 10.5C8.1 10.5 7.5 9.4 7.5 8C7.5 6.6 8.1 5.5 9.5 5.5" stroke="#D3D3D3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8.5V6" stroke="#D3D3D3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 3C12.5523 3 13 3.44772 13 4C13 4.55228 12.5523 5 12 5C11.4477 5 11 4.55228 11 4C11 3.44772 11.4477 3 12 3Z" stroke="#D3D3D3" strokeWidth="1.ove" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <p className="empty-agenda-text">All clear!</p>
      <p className="empty-agenda-subtext">Enjoy your free time.</p>
    </div>
  );
};

export default EmptyAgenda;