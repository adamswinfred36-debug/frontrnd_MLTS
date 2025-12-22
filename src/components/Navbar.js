import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaBars, FaTimes, FaSearch, FaMapMarkerAlt } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const isCustomerLoggedIn = Boolean(localStorage.getItem('customerToken'));

  const categories = [
    'Casa, Móveis e Decoração',
    'Ferramentas',
    'Celulares e Telefones',
    'Informática',
    'Beleza e Cuidado Pessoal',
    'Bebês',
    'Indústria e Comércio'
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?search=${searchTerm}`);
    }
  };

  const handleCustomerLogout = () => {
    localStorage.removeItem('customerToken');

    const params = new URLSearchParams(location.search || '');
    const slug = params.get('slug');

    if (location.pathname.startsWith('/produto/')) {
      navigate(location.pathname + (location.search || ''), { replace: true });
      return;
    }

    if (slug) {
      navigate(`/produto/${encodeURIComponent(slug)}`, { replace: true });
      return;
    }

    navigate('/', { replace: true });
  };

  return (
    <>
      {/* Navbar Superior */}
      <nav className="navbar" aria-label="Navegação principal">
        <div className="navbar-container">
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}>
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>

          <Link to="/" className="navbar-logo" aria-label="Página inicial">
            <img className="navbar-logo" src="/pt_logo_large_plus@2x.webp" alt="Logo Mercado Livre" />
          </Link>

          <form className="navbar-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Buscar produtos, marcas e muito mais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="search-btn">
              <FaSearch />
            </button>
          </form>

          <div className="navbar-icons">
            <div className="navbar-links desktop-only" aria-label="Ações">
              {!isCustomerLoggedIn ? (
                <>
                  <Link to="/cadastro" className="nav-link">
                    Crie a sua conta
                  </Link>
                  <Link to="/entrar" className="nav-link">
                    Entre
                  </Link>
                </>
              ) : (
                <button type="button" className="nav-link nav-link-logout" onClick={handleCustomerLogout}>
                  Sair
                </button>
              )}
              <button type="button" className="nav-link" onClick={(e) => e.preventDefault()}>
                Compras
              </button>
            </div>

            <Link to="/carrinho" className="cart-icon" aria-label="Carrinho">
              <FaShoppingCart />
              <span className="cart-badge">0</span>
            </Link>
          </div>
        </div>

        <div className="navbar-sub desktop-only">
          <div className="navbar-sub-container">
            <div className="navbar-location" role="button" tabIndex={0}>
              <FaMapMarkerAlt />
              <span>Informe seu CEP</span>
            </div>

            <div className="navbar-sub-links" aria-label="Atalhos">
              <button type="button" className="sub-link" onClick={(e) => e.preventDefault()}>
                Categorias
              </button>
              <button type="button" className="sub-link" onClick={(e) => e.preventDefault()}>
                Ofertas
              </button>
              <button type="button" className="sub-link" onClick={(e) => e.preventDefault()}>
                Cupons
              </button>
              <button type="button" className="sub-link" onClick={(e) => e.preventDefault()}>
                Supermercado
              </button>
              <button type="button" className="sub-link" onClick={(e) => e.preventDefault()}>
                Moda
              </button>
              <button type="button" className="sub-link" onClick={(e) => e.preventDefault()}>
                Mercado Play
              </button>
              <button type="button" className="sub-link" onClick={(e) => e.preventDefault()}>
                Vender
              </button>
              <button type="button" className="sub-link" onClick={(e) => e.preventDefault()}>
                Contato
              </button>
            </div>
          </div>
        </div>

        {/* Categorias (scroll) */}
        <div className="navbar-categories desktop-only" aria-label="Categorias">
          <div className="categories-container">
            {categories.map((category, index) => (
              <Link key={index} to={`/?category=${encodeURIComponent(category)}`} className="category-link">
                {category}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Menu Mobile */}
      <div className={`mobile-menu ${menuOpen ? 'active' : ''}`} aria-label="Menu mobile">
        <div className="mobile-menu-header">
          <h3>Categorias</h3>
          <button onClick={() => setMenuOpen(false)}>
            <FaTimes />
          </button>
        </div>
        <div className="mobile-menu-content">
          {categories.map((category, index) => (
            <Link
              key={index}
              to={`/?category=${encodeURIComponent(category)}`}
              className="mobile-category-link"
              onClick={() => setMenuOpen(false)}
            >
              {category}
            </Link>
          ))}
        </div>
      </div>

      {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)}></div>}
    </>
  );
};

export default Navbar;
