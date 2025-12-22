import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { customerRegisterLogin } from '../services/api';
import { FaEye, FaEyeSlash, FaUserCircle } from 'react-icons/fa';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ emailOrPhone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const trimmedIdentifier = useMemo(() => form.emailOrPhone.trim(), [form.emailOrPhone]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (step === 1) {
      emailInputRef.current?.focus();
    } else {
      passwordInputRef.current?.focus();
    }
  }, [step]);

  const goToPassword = (e) => {
    e.preventDefault();
    if (!trimmedIdentifier) return;
    setStep(2);
  };

  const goBackToIdentifier = (e) => {
    e.preventDefault();
    setStep(1);
    setForm((prev) => ({ ...prev, password: '' }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await customerRegisterLogin({ email: trimmedIdentifier, password: form.password });
      localStorage.setItem('customerToken', response.data.token);
      navigate(redirect);
    } catch (error) {
      alert(error?.response?.data?.message || 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-ml">
      <header className="auth-ml-header" aria-label="Topo">
        <div className="auth-ml-header-inner">
          <Link to="/" className="auth-ml-logo" aria-label="Página inicial">
            <img src="/pt_logo_large_plus@2x.webp" alt="Logo Mercado Livre" />
          </Link>
        </div>
      </header>

      <main className="auth-ml-main">
        <div className="auth-ml-grid">
          <section className="auth-ml-left" aria-label="Informações">
            {step === 1 ? (
              <>
                <h1>sssDigite seu e-mail ou telefone para iniciar sessão</h1>
              </>
            ) : (
              <>
                <div className="auth-ml-kicker">INÍCIO DE SESSÃO</div>
                <h1>Digite sua senha</h1>
                <div className="auth-ml-account" aria-label="Conta selecionada">
                  <FaUserCircle className="auth-ml-account-icon" aria-hidden="true" />
                  <div className="auth-ml-account-meta">
                    <div className="auth-ml-account-id">{trimmedIdentifier}</div>
                    <button type="button" className="auth-ml-link" onClick={goBackToIdentifier}>
                      Trocar conta
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="auth-ml-card" aria-label="Formulário">
            {step === 1 ? (
              <form onSubmit={goToPassword} className="auth-ml-form">
                <div className="auth-ml-field">
                  <label htmlFor="emailOrPhone">E-mail ou telefone</label>
                  <input
                    id="emailOrPhone"
                    ref={emailInputRef}
                    name="emailOrPhone"
                    value={form.emailOrPhone}
                    onChange={onChange}
                    autoComplete="username"
                    required
                  />
                </div>

                <button className="auth-ml-primary" type="submit" disabled={!trimmedIdentifier}>
                  Continuar
                </button>

                <div className="auth-ml-center">
                  <Link to={`/cadastro?redirect=${encodeURIComponent(redirect)}`} className="auth-ml-link">
                    Criar conta
                  </Link>
                </div>

                <div className="auth-ml-sep" aria-hidden="true">
                  <span />
                  <div>ou</div>
                  <span />
                </div>

                <button type="button" className="auth-ml-secondary" onClick={() => alert('Login com Google (wireframe)')}>
                  <span className="auth-ml-google">G</span>
                  Fazer Login com o Google
                </button>
              </form>
            ) : (
              <form onSubmit={onSubmit} className="auth-ml-form">
                <div className="auth-ml-field">
                  <label htmlFor="password">Senha</label>
                  <div className="auth-ml-password">
                    <input
                      id="password"
                      ref={passwordInputRef}
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={onChange}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="auth-ml-eye"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="auth-ml-actions">
                  <button className="auth-ml-primary" type="submit" disabled={loading}>
                    {loading ? 'Confirmando...' : 'Confirmar'}
                  </button>
                  <button type="button" className="auth-ml-link" onClick={() => alert('Escolher outro método (wireframe)')}>
                    Escolher outro método
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>

        <div className="auth-ml-bottom" aria-label="Ajuda">
          <button type="button" className="auth-ml-problem" onClick={() => alert('Ajuda (wireframe)')}>
            Tenho um problema de segurança
          </button>
          <button type="button" className="auth-ml-link" onClick={() => alert('Preciso de ajuda (wireframe)')}>
            Preciso de ajuda
          </button>
        </div>
      </main>
    </div>
  );
};

export default Login;
