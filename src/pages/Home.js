import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProducts } from '../services/api';
import {
  FaStar,
  FaGift,
  FaUserCircle,
  FaMapMarkerAlt,
  FaRegCreditCard,
  FaTags,
  FaFire,
  FaPlayCircle,
  FaGlobeAmericas,
  FaTshirt,
  FaMobileAlt,
} from 'react-icons/fa';
import './Home.css';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef(null);
  const scrollRafRef = useRef(null);
  const intervalRef = useRef(null);
  const activeSlideRef = useRef(0);
  const [isMobile, setIsMobile] = useState(false);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const isBrowsingHome = !category && !search;

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const params = {
          category: category || undefined,
          search: search || undefined,
        };
        const response = await getProducts(params);
        setProducts(response.data);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [category, search]);

  const carouselItems = useMemo(() => {
    if (!isBrowsingHome) return [];

    return [
      { src: '/imgs/D_NQ_633437-MLA101086311936_122025-F.webp', alt: 'Destaque 1' },
      { src: '/imgs/D_NQ_752223-MLA100484524594_122025-F.webp', alt: 'Destaque 2' },
      { src: '/imgs/D_NQ_806420-MLA101581534259_122025-F.webp', alt: 'Destaque 3' },
      { src: '/imgs/D_NQ_908710-MLA101185577013_122025-F.webp', alt: 'Destaque 4' },
      { src: '/imgs/download.webp', alt: 'Destaque 5' },
      { src: '/imgs/download (1).webp', alt: 'Destaque 6' },
    ];
  }, [isBrowsingHome]);

  useEffect(() => {
    setActiveSlide(0);
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = 0;
    }
  }, [carouselItems.length]);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    activeSlideRef.current = activeSlide;
  }, [activeSlide]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(Boolean(mq.matches));
    update();

    if (mq.addEventListener) mq.addEventListener('change', update);
    else mq.addListener(update);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', update);
      else mq.removeListener(update);
    };
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const homePills = useMemo(
    () => [
      { icon: <FaPlayCircle />, label: 'Mercado Play' },
      { icon: <FaTags />, label: 'Mercado' },
      { icon: <FaGlobeAmericas />, label: 'Internacional' },
      { icon: <FaTshirt />, label: 'Moda' },
      { icon: <FaMobileAlt />, label: 'Celulares' },
    ],
    []
  );

  const scrollToSlide = (index) => {
    const el = carouselRef.current;
    if (!el) return;

    const slides = el.querySelectorAll('.carousel-slide');
    const target = slides?.[index];
    if (!target) return;

    const viewportWidth = el.clientWidth || 1;
    const targetWidth = target.clientWidth || 1;
    const left = target.offsetLeft - (viewportWidth - targetWidth) / 2;
    el.scrollTo({ left, behavior: 'smooth' });
  };

  const onCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el) return;

    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
    }

    scrollRafRef.current = requestAnimationFrame(() => {
      const slides = el.querySelectorAll('.carousel-slide');
      if (!slides?.length) return;

      const viewportCenter = el.scrollLeft + (el.clientWidth || 0) / 2;
      let bestIndex = 0;
      let bestDist = Infinity;

      slides.forEach((slide, idx) => {
        const center = slide.offsetLeft + (slide.clientWidth || 0) / 2;
        const dist = Math.abs(center - viewportCenter);
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = idx;
        }
      });

      setActiveSlide((prev) => (prev === bestIndex ? prev : bestIndex));
    });
  };

  useEffect(() => {
    if (!isMobile) return;
    if (!isBrowsingHome) return;
    if (carouselItems.length <= 1) return;
    if (!carouselRef.current) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const next = (activeSlideRef.current + 1) % carouselItems.length;
      scrollToSlide(next);
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isMobile, isBrowsingHome, carouselItems.length]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div className="home">
      {isBrowsingHome && carouselItems.length > 0 && (
        <section className="home-carousel" aria-label="Destaques">
          <div className="home-carousel-inner">
            <div
              className="carousel-viewport"
              ref={carouselRef}
              onScroll={onCarouselScroll}
              role="region"
              aria-roledescription="carrossel"
              aria-label="Destaques"
              tabIndex={0}
            >
              {carouselItems.map((item, idx) => (
                <div
                  key={item.src}
                  className="carousel-slide"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${idx + 1} de ${carouselItems.length}`}
                >
                  <img src={item.src} alt={item.alt} loading={idx === 0 ? 'eager' : 'lazy'} />
                </div>
              ))}
            </div>

            <div className="carousel-dots" aria-label="Navegação do carrossel">
              {carouselItems.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`carousel-dot ${idx === activeSlide ? 'is-active' : ''}`}
                  onClick={() => scrollToSlide(idx)}
                  aria-label={`Ir para o slide ${idx + 1}`}
                  aria-current={idx === activeSlide ? 'true' : undefined}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {isBrowsingHome && (
        <section className="home-hero" aria-label="Destaque">
          <div className="home-hero-inner">
            <div className="home-hero-copy">
              <h1>Neste Natal tudo o que você quer, chega.</h1>
              <div className="hero-badges">
                <span className="badge badge-primary">
                  ATÉ <strong>70% OFF</strong>
                </span>
                <span className="badge badge-secondary">
                  <FaGift /> ENVIOS GRÁTIS E RÁPIDOS
                </span>
              </div>
              <p className="hero-footnote">Válido por tempo limitado.</p>
            </div>

            <div className="home-hero-art" aria-hidden="true">
              <div className="hero-art-card">
                <span className="hero-art-label">OFERTAS</span>
                <span className="hero-art-price">R$ 389,90</span>
                <span className="hero-art-sub">pagando no Pix</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {isBrowsingHome && (
        <section className="home-shortcuts" aria-label="Atalhos">
          <div className="home-container">
            <div className="shortcuts-grid">
              <div className="shortcut-card">
                <div className="shortcut-ico">
                  <FaGift />
                </div>
                <div>
                  <div className="shortcut-title">Frete grátis</div>
                  <div className="shortcut-sub">Benefício por ser sua primeira compra.</div>
                </div>
              </div>

              <div className="shortcut-card">
                <div className="shortcut-ico">
                  <FaUserCircle />
                </div>
                <div>
                  <div className="shortcut-title">Entre na sua conta</div>
                  <div className="shortcut-sub">Aproveite ofertas para comprar tudo o que quiser.</div>
                </div>
              </div>

              <div className="shortcut-card">
                <div className="shortcut-ico">
                  <FaMapMarkerAlt />
                </div>
                <div>
                  <div className="shortcut-title">Insira sua localização</div>
                  <div className="shortcut-sub">Confira custos e prazos de entrega.</div>
                </div>
              </div>

              <div className="shortcut-card">
                <div className="shortcut-ico">
                  <FaRegCreditCard />
                </div>
                <div>
                  <div className="shortcut-title">Meios de pagamento</div>
                  <div className="shortcut-sub">Pague com rapidez e segurança.</div>
                </div>
              </div>

              <div className="shortcut-card">
                <div className="shortcut-ico">
                  <FaTags />
                </div>
                <div>
                  <div className="shortcut-title">Menos de R$100</div>
                  <div className="shortcut-sub">Confira produtos com preços baixos.</div>
                </div>
              </div>

              <div className="shortcut-card">
                <div className="shortcut-ico">
                  <FaFire />
                </div>
                <div>
                  <div className="shortcut-title">Mais vendidos</div>
                  <div className="shortcut-sub">Explore os produtos que são tendência.</div>
                </div>
              </div>
            </div>

            <div className="pill-row" aria-label="Categorias rápidas">
              {homePills.map((p) => (
                <div key={p.label} className="pill">
                  {p.icon}
                  <span>{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="home-container">
        {category && (
          <div className="page-header">
            <h1>{category}</h1>
            <p>{products.length} produtos encontrados</p>
          </div>
        )}

        {search && (
          <div className="page-header">
            <h1>Resultados para "{search}"</h1>
            <p>{products.length} produtos encontrados</p>
          </div>
        )}

        {products.length === 0 ? (
          <div className="no-products">
            <h2>Nenhum produto encontrado</h2>
            <p>Tente buscar por outro termo ou categoria</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <Link key={product._id} to={`/produto/${product.slug}`} className="product-card">
                <div className="product-image">
                  <img
                    src={`http://localhost:5000${product.images[0]}`}
                    alt={product.title}
                  />
                  {product.price.discount > 0 && (
                    <span className="discount-badge">{product.price.discount}% OFF</span>
                  )}
                  {product.shipping.free && <span className="shipping-badge">Frete grátis</span>}
                </div>

                <div className="product-info">
                  <h3 className="product-title">{product.title}</h3>

                  <div className="product-rating">
                    <FaStar color="#FFD700" />
                    <span>{product.rating.average.toFixed(1)}</span>
                    <span className="rating-count">({product.rating.count})</span>
                  </div>

                  <div className="product-price">
                    {product.price.discount > 0 && (
                      <span className="price-original">{formatPrice(product.price.original)}</span>
                    )}
                    <span className="price-current">{formatPrice(product.price.current)}</span>
                  </div>

                  {product.seller.official && (
                    <div className="seller-info">
                      <img
                        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234CAF50'%3E%3Cpath d='M12 2L9 9H2l6 5-2 8 6-4 6 4-2-8 6-5h-7z'/%3E%3C/svg%3E"
                        alt="Oficial"
                      />
                      <span>Loja oficial {product.seller.name}</span>
                    </div>
                  )}

                  {!product.stock.available && <div className="out-of-stock">Esgotado</div>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
