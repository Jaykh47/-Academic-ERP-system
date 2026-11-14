import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/common/Navbar";
import { Sidebar } from "../components/common/Sidebar";

export const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-charcoal text-alice flex flex-col font-sans">
      <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full transition-all">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
