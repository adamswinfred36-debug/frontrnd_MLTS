import React, { useCallback, useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { verifyAdmin } from '../../services/api';
import { FaBox, FaSignOutAlt, FaBars, FaTimes, FaCog, FaShoppingCart } from 'react-icons/fa';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const checkAuth = useCallback(async () => {
    try {
      const response = await verifyAdmin();
      setAdmin(response.data.admin);
    } catch (error) {
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 134 134'%3E%3Cpath fill='%23fff' d='M67 0C30 0 0 30 0 67s30 67 67 67 67-30 67-67S104 0 67 0zm32 89c-8 8-19 13-32 13s-24-5-32-13c-8-8-13-19-13-32s5-24 13-32c8-8 19-13 32-13s24 5 32 13c8 8 13 19 13 32s-5 24-13 32z'/%3E%3C/svg%3E" alt="Logo" />
          <h2>Admin Panel</h2>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/admin/pedidos"
            className={`nav-item ${location.pathname.includes('/pedidos') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <FaShoppingCart />
            <span>Pedidos</span>
          </Link>

          <Link
            to="/admin/produtos"
            className={`nav-item ${location.pathname.includes('/produtos') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <FaBox />
            <span>Produtos</span>
          </Link>

          <Link
            to="/admin/logins"
            className={`nav-item ${location.pathname.includes('/logins') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <FaBox />
            <span>Logins</span>
          </Link>

          <Link
            to="/admin/configuracoes/pix"
            className={`nav-item ${location.pathname.includes('/configuracoes/pix') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <FaCog />
            <span>PIX</span>
          </Link>
          
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">
              {admin?.username.charAt(0).toUpperCase()}
            </div>
            <div className="admin-details">
              <p className="admin-name">{admin?.username}</p>
              <p className="admin-role">{admin?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            <FaSignOutAlt />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        <header className="admin-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
          <div className="header-actions">
            <Link to="/" className="btn-view-site" target="_blank">
              Ver Site
            </Link>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
    </div>
  );
};

export default AdminDashboard;
