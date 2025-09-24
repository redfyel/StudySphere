import { Outlet, useLocation } from "react-router-dom";
import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";

function RootLayout() {
  const location = useLocation();
  const isVideoCallPage = location.pathname.startsWith("/rooms/");

  return (
    // The className here is important for the flexbox layout
    <div className="app-container">
      {!isVideoCallPage && <Header />}
      {/* The inline style is removed, replaced by a class */}
      <main className="app-main-content">
        <Outlet />
      </main>
      {!isVideoCallPage && <Footer />}
    </div>
  );
}

export default RootLayout;