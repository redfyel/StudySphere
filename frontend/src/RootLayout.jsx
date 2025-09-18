// import {Outlet} from "react-router-dom"
// import Header from "./components/header/Header"
// import Footer from "./components/footer/Footer"

// function RootLayout() {
//   return (
//     <>
//       <Header />
//       <main style={{minHeight: "80vh"}}>
//         <Outlet />
//       </main>
//       <Footer />
//     </>
//   )
// }

// export default RootLayout


import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import Sidebar from "./components/sidebar/Sidebar";
import "./RootLayout.css"; // Ensure this CSS file exists

function RootLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="app-container">
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <div className={`main-content ${isCollapsed ? 'collapsed' : ''}`}>
        <Header />
        <main>
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default RootLayout;