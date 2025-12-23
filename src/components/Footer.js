import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="ml-footer" aria-label="Rodapé">
      <div className="ml-footer-top">
        <div className="ml-footer-container">
          <div className="ml-footer-cols">
            <div className="ml-footer-col">
              <h4>Sobre</h4>
              <button type="button" className="ml-footer-link" onClick={(e) => e.preventDefault()}>
                Mercadoria Livre
              </button>
              <button type="button" className="ml-footer-link" onClick={(e) => e.preventDefault()}>
                Trabalhe conosco
              </button>
              <button type="button" className="ml-footer-link" onClick={(e) => e.preventDefault()}>
                Sustentabilidade
              </button>
            </div>

            <div className="ml-footer-col">
              <h4>Ajuda</h4>
              <button type="button" className="ml-footer-link" onClick={(e) => e.preventDefault()}>
                Central de ajuda
              </button>
              <button type="button" className="ml-footer-link" onClick={(e) => e.preventDefault()}>
                Compra protegida
              </button>
              <button type="button" className="ml-footer-link" onClick={(e) => e.preventDefault()}>
                Como comprar
              </button>
            </div>

            <div className="ml-footer-col">
              <h4>Conta</h4>
              <button type="button" className="ml-footer-link" onClick={(e) => e.preventDefault()}>
                Crie sua conta
              </button>
              <Link to="/admin/login" className="ml-footer-link">
                Entre
              </Link>
              <button type="button" className="ml-footer-link" onClick={(e) => e.preventDefault()}>
                Minhas compras
              </button>
            </div>

            <div className="ml-footer-col">
              <h4>Mais</h4>
              <button type="button" className="ml-footer-link" onClick={(e) => e.preventDefault()}>
                Termos e condições
              </button>
              <button type="button" className="ml-footer-link" onClick={(e) => e.preventDefault()}>
                Privacidade
              </button>
              <button type="button" className="ml-footer-link" onClick={(e) => e.preventDefault()}>
                Contato
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="ml-footer-bottom">
        <div className="ml-footer-container">
          <div className="ml-footer-bottom-row">
            <div className="ml-footer-bottom-links">
              <button type="button" className="ml-footer-bottom-link" onClick={(e) => e.preventDefault()}>
                Trabalhe conosco
              </button>
              <button type="button" className="ml-footer-bottom-link" onClick={(e) => e.preventDefault()}>
                Termos e condições
              </button>
              <button type="button" className="ml-footer-bottom-link" onClick={(e) => e.preventDefault()}>
                Como cuidamos da sua privacidade
              </button>
            </div>
            <div className="ml-footer-copy">
              © {new Date().getFullYear()} Mercadoria Livre Clone — PIX manual
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
