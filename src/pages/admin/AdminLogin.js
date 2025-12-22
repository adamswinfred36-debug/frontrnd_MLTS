import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../../services/api';
import './AdminLogin.css';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await adminLogin(credentials);
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('adminUser', JSON.stringify(response.data.admin));
      navigate('/admin/produtos');
    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 134 134'%3E%3Cpath fill='%23333' d='M67 0C30 0 0 30 0 67s30 67 67 67 67-30 67-67S104 0 67 0zm32 89c-8 8-19 13-32 13s-24-5-32-13c-8-8-13-19-13-32s5-24 13-32c8-8 19-13 32-13s24 5 32 13c8 8 13 19 13 32s-5 24-13 32z'/%3E%3Cpath fill='%233483FA' d='M67 25c-12 0-23 5-31 13-8 8-13 19-13 31s5 23 13 31c8 8 19 13 31 13s23-5 31-13l-18-18-13 13-9-9 13-13-9-9 13-13 9 9 13-13 18 18c8-8 13-19 13-31s-5-23-13-31c-8-8-19-13-31-13z'/%3E%3C/svg%3E" alt="Logo" />
            <h1>Painel Administrativo</h1>
            <p>Faça login para gerenciar seus produtos</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label>E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="login-footer">
            <p>Para criar um administrador, use a API</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
