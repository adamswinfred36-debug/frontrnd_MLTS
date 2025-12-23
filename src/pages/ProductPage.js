import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { customerRegister, customerRegisterLogin, getProductBySlug } from '../services/api';
import { FaStar, FaTruck, FaShieldAlt, FaChevronRight, FaHeart } from 'react-icons/fa';
import './ProductPage.css';
import { resolveImageUrl } from '../services/api';

const AuthModal = ({ open, mode, setMode, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    identifier: '',
    name: '',
    email: '',
    cpf: '',
    whatsapp: '',
    password: '',
  });

  useEffect(() => {
    if (!open) return;
    setLoading(false);
    setStep(1);
    setForm((prev) => ({ ...prev, password: '' }));
  }, [open, mode]);

  if (!open) return null;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitLogin = async () => {
    try {
      setLoading(true);
      const email = String(form.identifier || '').trim();
      const response = await customerRegisterLogin({ email, password: form.password });
      localStorage.setItem('customerToken', response.data.token);
      onSuccess();
    } catch (error) {
      alert(error?.response?.data?.message || 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async () => {
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
      onSuccess();
    } catch (error) {
      alert(error?.response?.data?.message || 'Não foi possível cadastrar.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueLogin = (e) => {
    e.preventDefault();
    const value = String(form.identifier || '').trim();
    if (!value) {
      alert('Informe seu e-mail ou telefone.');
      return;
    }
    setStep(2);
  };

  return (
    <div className="ml-auth" role="dialog" aria-modal="true">
      <div className="ml-auth-top">
        <div className="ml-auth-top-inner">
          <Link to="/" className="ml-auth-logo" aria-label="Página inicial">
            <img src="/pt_logo_large_plus@2x.webp" alt="Logo" />
          </Link>
        </div>
      </div>

      <div className="ml-auth-body">
        <div className="ml-auth-left">
          <h1>Digite seu e-mail ou telefone para iniciar sessão</h1>
        </div>

        <div className="ml-auth-right">
          <div className="ml-auth-card">
            {mode === 'login' ? (
              <>
                {step === 1 ? (
                  <form onSubmit={handleContinueLogin}>
                    <div className="ml-auth-field">
                      <label>E-mail ou telefone</label>
                      <input name="identifier" value={form.identifier} onChange={onChange} autoFocus />
                    </div>

                    <button className="ml-auth-continue" type="submit" disabled={loading}>
                      Continuar
                    </button>

                    <button
                      type="button"
                      className="ml-auth-create"
                      onClick={() => {
                        setMode('register');
                        setStep(1);
                      }}
                      disabled={loading}
                    >
                      Criar conta
                    </button>

                    <div className="ml-auth-sep">
                      <span />
                      <em>ou</em>
                      <span />
                    </div>

                    <button
                      type="button"
                      className="ml-auth-google"
                      onClick={() => alert('Login com Google não configurado neste projeto.')}
                      disabled={loading}
                    >
                      <span className="ml-auth-g">G</span>
                      Fazer Login com o Google
                    </button>
                  </form>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitLogin();
                    }}
                  >
                    <div className="ml-auth-back-row">
                      <button type="button" className="ml-auth-back" onClick={() => setStep(1)} disabled={loading}>
                        Voltar
                      </button>
                      <div className="ml-auth-id">{String(form.identifier || '').trim()}</div>
                    </div>

                    <div className="ml-auth-field">
                      <label>Senha</label>
                      <input name="password" type="password" value={form.password} onChange={onChange} minLength={6} required autoFocus />
                    </div>

                    <button className="ml-auth-continue" type="submit" disabled={loading}>
                      {loading ? 'Aguarde...' : 'Entrar'}
                    </button>
                  </form>
                )}
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitRegister();
                }}
              >
                <div className="ml-auth-register-title">Criar conta</div>

                <div className="ml-auth-field">
                  <label>Nome</label>
                  <input name="name" value={form.name} onChange={onChange} required autoFocus />
                </div>

                <div className="ml-auth-field">
                  <label>E-mail</label>
                  <input name="email" type="email" value={form.email} onChange={onChange} required />
                </div>

                <div className="ml-auth-field">
                  <label>CPF</label>
                  <input name="cpf" value={form.cpf} onChange={onChange} placeholder="000.000.000-00" required />
                </div>

                <div className="ml-auth-field">
                  <label>WhatsApp</label>
                  <input name="whatsapp" value={form.whatsapp} onChange={onChange} placeholder="(00) 00000-0000" required />
                </div>

                <div className="ml-auth-field">
                  <label>Senha</label>
                  <input name="password" type="password" value={form.password} onChange={onChange} minLength={6} required />
                </div>

                <button className="ml-auth-continue" type="submit" disabled={loading}>
                  {loading ? 'Aguarde...' : 'Criar conta'}
                </button>

                <button type="button" className="ml-auth-create" onClick={() => setMode('login')} disabled={loading}>
                  Já tenho conta
                </button>
              </form>
            )}
          </div>

          <button type="button" className="ml-auth-help" onClick={() => alert('Preciso de ajuda')}>Preciso de ajuda</button>
        </div>
      </div>
    </div>
  );
};

const ProductPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('register');

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const response = await getProductBySlug(slug);
        setProduct(response.data);
        setSelectedImage(0);
        setQuantity(1);
      } catch (error) {
        console.error('Erro ao carregar produto:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [slug]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleBuyNow = () => {
    if (!product?.stock?.available) return;
    const checkoutUrl = `/frete?slug=${encodeURIComponent(slug)}&q=${quantity}`;
    const customerToken = localStorage.getItem('customerToken');
    if (!customerToken) {
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }
    navigate(checkoutUrl, { state: { product, quantity } });
  };

  const handleAuthSuccess = () => {
    const checkoutUrl = `/frete?slug=${encodeURIComponent(slug)}&q=${quantity}`;
    setAuthOpen(false);
    navigate(checkoutUrl, { state: { product, quantity } });
  };

  const specs = useMemo(() => {
    if (!product?.specifications || typeof product.specifications !== 'object') return {};
    return product.specifications;
  }, [product]);

  const getSpecByKey = useCallback((keys) => {
    const entries = Object.entries(specs);
    const found = entries.find(([k]) => keys.some((needle) => String(k).toLowerCase().includes(needle)));
    return found ? found[1] : '';
  }, [specs]);

  const colorSpec = useMemo(() => getSpecByKey(['cor', 'color']), [getSpecByKey]);
  const voltageSpec = useMemo(() => getSpecByKey(['voltag', 'tensao', 'tensão', 'voltage']), [getSpecByKey]);

  const maxQty = Math.max(1, Math.min(10, Number(product?.stock?.quantity || 1)));
  const qtyOptions = useMemo(() => Array.from({ length: maxQty }, (_, i) => i + 1), [maxQty]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando produto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="error-container">
        <h2>Produto não encontrado</h2>
        <p>O produto que você está procurando não existe ou foi removido.</p>
      </div>
    );
  }

  return (
    <div className="product-page">
      <AuthModal
        open={authOpen}
        mode={authMode}
        setMode={setAuthMode}
        onSuccess={handleAuthSuccess}
      />
      <div className="product-container">
        {/* Topo / Breadcrumb + Ações */}
        <div className="product-head">
          <div className="breadcrumb">
            <Link to="/" className="crumb-link">Voltar a lista</Link>
            <span className="crumb-sep">|</span>
            <span>Início</span>
            <FaChevronRight size={10} />
            <span>{product.category}</span>
            <FaChevronRight size={10} />
            <span className="current">{product.title}</span>
          </div>

          <div className="product-head-actions">
            <button type="button" className="head-action" onClick={(e) => e.preventDefault()}>
              Vender um igual
            </button>
            <button type="button" className="head-action" onClick={(e) => e.preventDefault()}>
              Compartilhar
            </button>
          </div>
        </div>

        {/* Seção Principal do Produto */}
        <div className="product-main">
          {/* Galeria de Imagens */}
          <div className="product-gallery">
            <div className="gallery-thumbnails">
              {product.images.map((image, index) => (
                <img
                  key={index}
                  src={resolveImageUrl(image)}
                  alt={`${product.title} ${index + 1}`}
                  className={selectedImage === index ? 'active' : ''}
                  onClick={() => setSelectedImage(index)}
                />
              ))}
            </div>
            <div className="gallery-main">
              <img
                src={resolveImageUrl(product.images[selectedImage])}
                alt={product.title}
              />
            </div>
          </div>

          {/* Coluna central: detalhes */}
          <div className="product-info">
            <div className="product-meta">
              <span className={product.stock.available ? 'new-badge' : 'sold-out'}>
                {product.stock.available ? `Novo | +${product.seller.sales} vendidos` : 'Esgotado'}
              </span>

              <button type="button" className="fav-btn" aria-label="Favoritar" onClick={(e) => e.preventDefault()}>
                <FaHeart />
              </button>
            </div>

            <button type="button" className="brand-link" onClick={(e) => e.preventDefault()}>
              Conferir mais produtos da marca {product.brand}
            </button>

            <h1 className="product-title">{product.title}</h1>

            <div className="product-rating-section">
              <div className="rating">
                <span className="rating-number">{product.rating.average.toFixed(1)}</span>
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      color={i < Math.round(product.rating.average) ? '#FFD700' : '#ddd'}
                    />
                  ))}
                </div>
              </div>
              <span className="rating-count">({product.rating.count})</span>
            </div>

            <div className="price-section">
              {product.price.discount > 0 && (
                <span className="price-original">{formatPrice(product.price.original)}</span>
              )}
              <div className="price-row">
                <span className="price-current">{formatPrice(product.price.current)}</span>
                {product.price.discount > 0 && (
                  <span className="discount-tag">{product.price.discount}% OFF</span>
                )}
              </div>
              {product.price.discount > 0 && <div className="offer-badge">OFERTA DO DIA</div>}
              <button type="button" className="pay-link" onClick={(e) => e.preventDefault()}>
                Ver os meios de pagamento
              </button>
            </div>

            {(colorSpec || voltageSpec) && (
              <div className="variations">
                {colorSpec && (
                  <div className="variation">
                    <div className="variation-label">Cor: <strong>{String(colorSpec)}</strong></div>
                  </div>
                )}
                {voltageSpec && (
                  <div className="variation">
                    <div className="variation-label">Voltagem: <strong>{String(voltageSpec)}</strong></div>
                  </div>
                )}
              </div>
            )}

            <div className="product-need">
              <h2>O que você precisa saber sobre este produto</h2>
              <div className="features-list">
                {product.features && product.features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <span>•</span>
                    <p>{feature}</p>
                  </div>
                ))}
              </div>
              <button type="button" className="details-link" onClick={(e) => e.preventDefault()}>
                Ver características
              </button>
            </div>
          </div>

          {/* Coluna direita: compra */}
          <aside className="product-purchase">
            <div className="purchase-card">
              <div className="delivery-info">
                <h3>Chegará sexta-feira</h3>
                <p className="delivery-subtitle">Mais detalhes e formas de entrega</p>
              </div>

              <div className="stock-info">
                <h4>Estoque disponível</h4>
                <p>{product.stock.available ? `${product.stock.quantity} disponíveis` : 'Sem estoque'}</p>
              </div>

              {product.stock.available && (
                <div className="quantity-row">
                  <label htmlFor="qty">Quantidade:</label>
                  <select
                    id="qty"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  >
                    {qtyOptions.map((q) => (
                      <option key={q} value={q}>{q} unidade{q > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="action-buttons">
                <button className="btn-buy" disabled={!product.stock.available} onClick={handleBuyNow}>
                  Comprar agora
                </button>
                <button className="btn-cart" disabled={!product.stock.available}>
                  Adicionar ao carrinho
                </button>
              </div>

              <div className="seller-section">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234CAF50'%3E%3Cpath d='M12 2L9 9H2l6 5-2 8 6-4 6 4-2-8 6-5h-7z'/%3E%3C/svg%3E" alt="Loja Oficial" />
                <div>
                  <p className="seller-name">Loja oficial {product.seller.name}</p>
                  <p className="seller-sales">+{product.seller.sales}M vendas</p>
                </div>
              </div>

              {product.shipping.fast && (
                <div className="shipping-badge">
                  <FaTruck /> Armazenado e enviado pelo <strong>FULL</strong>
                </div>
              )}

              <div className="guarantees">
                <div className="guarantee-item">
                  <FaTruck color="#00A650" />
                  <div>
                    <strong>Devolução grátis.</strong>
                    <p>Você tem 7 dias a partir da data de recebimento.</p>
                  </div>
                </div>
                <div className="guarantee-item">
                  <FaShieldAlt color="#00A650" />
                  <div>
                    <strong>Compra Garantida,</strong>
                    <p>receba o produto que está esperando ou devolvemos o dinheiro.</p>
                  </div>
                </div>
                <div className="guarantee-item">
                  <FaShieldAlt color="#00A650" />
                  <div>
                    <strong>12 meses de garantia de fábrica.</strong>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Descrição do Produto (mantida para SEO/conteúdo) */}
        <div className="product-description">
          <h2>Descrição</h2>
          <p className="desc-text">{product.description}</p>
        </div>

        {/* Características */}
        <div className="product-specifications">
          <h2>Características do produto</h2>
          
          <div className="specs-section">
            <h3>Características principais</h3>
            <table className="specs-table">
              <tbody>
                {product.specifications && Object.entries(product.specifications).map(([key, value], index) => (
                  <tr key={index}>
                    <td className="spec-label">{key}</td>
                    <td className="spec-value">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="specs-section">
            <h3>Características gerais</h3>
            <table className="specs-table">
              <tbody>
                <tr>
                  <td className="spec-label">Marca</td>
                  <td className="spec-value">{product.brand}</td>
                </tr>
                <tr>
                  <td className="spec-label">Categoria</td>
                  <td className="spec-value">{product.category}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Fotos do Produto */}
        <div className="product-photos">
          <h2>Fotos do produto</h2>
          <div className="photos-grid">
            {product.images.map((image, index) => (
              <img
                key={index}
                src={resolveImageUrl(image)}
                alt={`${product.title} foto ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Informações da Loja */}
        <div className="store-info">
          <h2>Informações da loja</h2>
          <div className="store-card">
            <img width="150px" src="/pt_logo_large_plus@2x.webp" alt={product.seller.name} />
            <div className="store-details">
              <h3>Mercadoria</h3>
              {product.seller.official && <span className="badge-platinum">MercadoLíder Platinum</span>}
              <p className="store-badge">É um dos melhores do site!</p>
            </div>
          </div>
          <div className="store-stats">
            <div className="stat">
              <strong>+{product.seller.sales}M</strong>
              <p>Vendas nos últimos 365 dias</p>
            </div>
            <div className="stat">
              <span className="icon-check">✓</span>
              <p>Presta bom atendimento</p>
            </div>
            <div className="stat">
              <span className="icon-check">✓</span>
              <p>Entrega os produtos dentro do prazo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
