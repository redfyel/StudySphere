import { Outlet, useLocation } from "react-router-dom";
import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";

function RootLayout() {
  const location = useLocation();
  const isRoomsPage = location.pathname.startsWith("/rooms");

  return (
    <div className="app-container">
      <div>
        <Header />
        <main>
          <Outlet />
        </main>
        {!isRoomsPage && <Footer />}
      </div>
    </div>
  );
}

export default RootLayout;