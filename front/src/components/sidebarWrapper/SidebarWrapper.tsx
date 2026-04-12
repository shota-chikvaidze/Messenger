import { Sidebar } from "../../layout/Sidebar"
import { Outlet } from "react-router-dom"

const SidebarWrapper = () => {
  return (
    <div className="flex ">
        
        <Sidebar />
        <Outlet/>

    </div>
  )
}

export default SidebarWrapper