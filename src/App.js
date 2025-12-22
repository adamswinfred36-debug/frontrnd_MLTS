import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductPage from './pages/ProductPage';
import Frete from './pages/Frete';
import Checkout from './pages/Checkout';
import PixPage from './pages/PixPage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminOrders from './pages/admin/AdminOrders';
import AdminSettingsPix from './pages/admin/AdminSettingsPix';
import AdminLogins from './pages/admin/AdminLogins';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<><Navbar /><Home /><Footer /></>} />
          <Route path="/produto/:slug" element={<><Navbar /><ProductPage /><Footer /></>} />
          <Route path="/frete" element={<><Navbar /><Frete /><Footer /></>} />
          <Route path="/checkout" element={<><Navbar /><Checkout /><Footer /></>} />
          <Route path="/entrar" element={<Login />} />
          <Route path="/cadastro" element={<><Navbar /><Register /><Footer /></>} />
          <Route path="/pix" element={<PixPage />} />
          
          {/* Rotas admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<AdminProducts />} />
            <Route path="pedidos" element={<AdminOrders />} />
            <Route path="produtos" element={<AdminProducts />} />
            <Route path="logins" element={<AdminLogins />} />
            <Route path="produtos/novo" element={<AdminProductForm />} />
            <Route path="produtos/editar/:id" element={<AdminProductForm />} />
            <Route path="configuracoes/pix" element={<AdminSettingsPix />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
