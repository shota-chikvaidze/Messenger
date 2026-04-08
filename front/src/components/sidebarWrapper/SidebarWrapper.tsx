import { Sidebar } from "../../layout/Sidebar"
import { Outlet } from "react-router-dom"

export const SidebarWrapper = () => {
  return (
    <div className="flex  ">
        
        <Sidebar />
        <Outlet/>

    </div>
  )
}
