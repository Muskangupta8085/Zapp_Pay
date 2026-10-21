import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SidebarProvider, useSidebar } from '../../context/SidebarContext';

const AdminLayoutContent: React.FC = () => {
  const { isCollapsed, isMobileOpen, closeMobile } = useSidebar();

  return (
    <div className="app-container">
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 9, 26, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 45,
            transition: 'opacity 0.2s ease',
          }}
        />
      )}

      {/* Perfect Sidebar */}
      <Sidebar />

      {/* Main App Content Area */}
      <div className={`main-content ${isCollapsed ? 'collapsed' : ''}`}>
        <Header />
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const AdminLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <AdminLayoutContent />
    </SidebarProvider>
  );
};
