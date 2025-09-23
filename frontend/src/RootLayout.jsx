import { Outlet, useLocation } from "react-router-dom";
import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";

function RootLayout() {
  const location = useLocation();

  // Check if the current path is a video call (inside /rooms/:roomId)
  const isVideoCallPage = location.pathname.startsWith("/rooms/");
  const isRoomsPage = location.pathname.startsWith("/rooms");


  return (
    <div className="app-container">
      <div>
        {!isVideoCallPage && <Header />}
        <main style={ { minHeight: isRoomsPage ? '100vh' : 'calc(100vh - 120px)' } }>
          <Outlet />
        </main>
        {!isVideoCallPage && <Footer />}
      </div>
    </div>
  );
}

export default RootLayout;
