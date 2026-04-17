import { Sidebar } from "../../layout/Sidebar"
import { Outlet } from "react-router-dom"

const SidebarWrapper = () => {
  return (
    <div className="flex bg-[var(--background-color)] ">
        
        <Sidebar />

        <div className="w-full bg-[var(--outlet-color)] ">
          <Outlet />
        </div>

    </div>
  )
}

export default SidebarWrapper