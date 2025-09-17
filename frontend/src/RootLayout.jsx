import {Outlet} from "react-router-dom"
import Header from "./components/header/Header"
import Footer from "./components/footer/Footer"

function RootLayout() {
  return (
    <>
      <Header />
      <main style={{minHeight: "80vh"}}>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

export default RootLayout