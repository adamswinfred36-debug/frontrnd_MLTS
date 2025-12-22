import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { customerRegister } from '../services/api';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [form, setForm] = useState({ name: '', email: '', cpf: '', whatsapp: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await customerRegister({
        name: form.name,
        email: form.email,
        cpf: form.cpf,
        whatsapp: form.whatsapp,
        password: form.password,
      });
      localStorage.setItem('customerToken', response.data.token);
      navigate(redirect);
    } catch (error) {
      alert(error?.response?.data?.message || 'Não foi possível cadastrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Criar conta</h1>
        <p className="auth-sub">Cadastre-se para continuar.</p>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="field">
            <label>Nome</label>
            <input name="name" value={form.name} onChange={onChange} required />
          </div>

          <div className="field">
            <label>E-mail</label>
            <input name="email" type="email" value={form.email} onChange={onChange} required />
          </div>

          <div className="field">
            <label>CPF</label>
            <input name="cpf" value={form.cpf} onChange={onChange} placeholder="000.000.000-00" required />
          </div>

          <div className="field">
            <label>WhatsApp</label>
            <input name="whatsapp" value={form.whatsapp} onChange={onChange} placeholder="(00) 00000-0000" required />
          </div>

          <div className="field">
            <label>Senha</label>
            <input name="password" type="password" value={form.password} onChange={onChange} minLength={6} required />
            <div className="hint">Mínimo de 6 caracteres.</div>
          </div>

          <button className="auth-primary" type="submit" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Já tem conta?</span>
          <Link to={`/entrar?redirect=${encodeURIComponent(redirect)}`} className="auth-link">
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
