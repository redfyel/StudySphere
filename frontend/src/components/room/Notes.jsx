import React from 'react';

function Notes({ notes, onNotesChange }) {
  return (
    <div className="notes">
      <h3>Shared Notes</h3>
      <textarea
        value={notes}
        onChange={onNotesChange}
        placeholder="Type your notes here..."
      />
    </div>
  );
}

export default Notes;
