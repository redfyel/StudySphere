// Example: src/pages/TasksPage.js

import CalendarView from "./CalendarView";
import "./TasksPage.css"; // We will create this file next

const TasksPage = () => {
  return (
    // This wrapper is the crucial missing piece
    <div className="page-container">
      <CalendarView />
    </div>
  );
};

export default TasksPage;