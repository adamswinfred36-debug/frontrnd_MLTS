import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { createOrder, customerMe, getProductBySlug } from '../services/api';
import './Checkout.css';

const onlyDigits = (value) => String(value || '').replace(/\D+/g, '');

const formatCardNumber = (value) => {
  const digits = onlyDigits(value).slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

const formatExpiry = (value) => {
  const digits = onlyDigits(value).slice(0, 6);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const formatCvv = (value, maxLen = 4) => {
  return onlyDigits(value).slice(0, maxLen);
};

const formatCpf = (value) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const formatCep = (value) => {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const formatPhoneBr = (value) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length < 3) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length < 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const luhnCheck = (digits) => {
  const num = onlyDigits(digits);
  if (num.length < 12) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = num.length - 1; i >= 0; i -= 1) {
    let digit = Number(num[i]);
    if (Number.isNaN(digit)) return false;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

const detectBrand = (digits) => {
  const d = onlyDigits(digits);
  if (!d) return '';
  if (d.startsWith('4')) return 'visa';
  const first2 = Number(d.slice(0, 2));
  const first4 = Number(d.slice(0, 4));
  if ((first2 >= 51 && first2 <= 55) || (first4 >= 2221 && first4 <= 2720)) return 'mastercard';
  if (d.startsWith('34') || d.startsWith('37')) return 'amex';
  return '';
};

const parseExpiry = (value) => {
  const raw = String(value || '').trim();
  const m = raw.match(/^(\d{2})\s*\/\s*(\d{2,4})$/);
  if (!m) return { expMonth: '', expYear: '' };
  const expMonth = m[1];
  let expYear = m[2];
  if (expYear.length === 2) expYear = `20${expYear}`;
  return { expMonth, expYear };
};

const isExpiryValid = (expMonth, expYear) => {
  const mm = Number(expMonth);
  const yyyy = Number(expYear);
  if (!mm || mm < 1 || mm > 12) return false;
  if (!yyyy || yyyy < 2000 || yyyy > 2100) return false;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  if (yyyy < currentYear) return false;
  if (yyyy === currentYear && mm < currentMonth) return false;
  return true;
};

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectAfterLogin = useMemo(() => {
    const path = location.pathname || '/checkout';
    const search = location.search || '';
    return `${path}${search}`;
  }, [location.pathname, location.search]);

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    if (!token) {
      navigate(`/cadastro?redirect=${encodeURIComponent(redirectAfterLogin)}`);
    }
  }, [navigate, redirectAfterLogin]);

  const stateProduct = location.state?.product || null;
  const stateQuantity = location.state?.quantity;

  const slug = searchParams.get('slug') || stateProduct?.slug;
  const quantityParam = Number(searchParams.get('q') || stateQuantity || 1);
  const quantity = Number.isFinite(quantityParam) && quantityParam > 0 ? quantityParam : 1;

  // Antes do checkout, pede CEP na tela de frete.
  useEffect(() => {
    if (!slug) return;
    const persistedCep = String(localStorage.getItem('checkoutCep') || '').trim();
    if (!persistedCep) {
      navigate(`/frete?slug=${encodeURIComponent(slug)}&q=${quantity}`, {
        replace: true,
        state: stateProduct ? { product: stateProduct, quantity } : { quantity },
      });
    }
  }, [navigate, quantity, slug, stateProduct]);

  const [product, setProduct] = useState(stateProduct);
  const [loading, setLoading] = useState(!stateProduct);

  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    cep: formatCep(localStorage.getItem('checkoutCep') || ''),
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    pagamento: 'pix',
    cartaoNumero: '',
    cartaoNome: '',
    cartaoValidade: '',
    cartaoCvv: '',
  });

  // Carrega dados do usuário logado para pré-preencher checkout.
  useEffect(() => {
    const loadMe = async () => {
      const token = localStorage.getItem('customerToken');
      if (!token) return;
      try {
        const response = await customerMe();
        const me = response.data?.user;
        if (!me) return;
        setForm((prev) => ({
          ...prev,
          nome: prev.nome || me.name || '',
          cpf: prev.cpf || me.cpf || '',
          telefone: prev.telefone || me.whatsapp || '',
        }));
      } catch (e) {
        // silencioso
      }
    };
    loadMe();
  }, []);

  // Autopreenchimento de endereço por CEP (ViaCEP)
  useEffect(() => {
    const digits = String(form.cep || '').replace(/\D+/g, '');
    if (digits.length !== 8) return;

    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (cancelled) return;
        if (!data || data.erro) return;
        setForm((prev) => ({
          ...prev,
          endereco: prev.endereco || data.logradouro || '',
          bairro: prev.bairro || data.bairro || '',
          cidade: prev.cidade || data.localidade || '',
          estado: prev.estado || data.uf || '',
        }));
      } catch (e) {
        // silencioso
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [form.cep]);

  useEffect(() => {
    const load = async () => {
      if (product || !slug) return;
      try {
        setLoading(true);
        const response = await getProductBySlug(slug);
        setProduct(response.data);
      } catch (error) {
        console.error('Erro ao carregar produto no checkout:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [product, slug]);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === 'cartaoNumero') {
      setForm((prev) => ({ ...prev, [name]: formatCardNumber(value) }));
      return;
    }
    if (name === 'cartaoValidade') {
      setForm((prev) => ({ ...prev, [name]: formatExpiry(value) }));
      return;
    }
    if (name === 'cartaoCvv') {
      const digits = onlyDigits(form.cartaoNumero);
      const brand = detectBrand(digits);
      const maxLen = brand === 'amex' ? 4 : 3;
      setForm((prev) => ({ ...prev, [name]: formatCvv(value, maxLen) }));
      return;
    }
    if (name === 'cpf') {
      setForm((prev) => ({ ...prev, [name]: formatCpf(value) }));
      return;
    }
    if (name === 'telefone') {
      setForm((prev) => ({ ...prev, [name]: formatPhoneBr(value) }));
      return;
    }
    if (name === 'cep') {
      setForm((prev) => ({ ...prev, [name]: formatCep(value) }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const cpfDigits = String(form.cpf || '').replace(/\D+/g, '');
    const phoneDigits = String(form.telefone || '').replace(/\D+/g, '');
    const cepDigits = String(form.cep || '').replace(/\D+/g, '');

    if (!form.nome || String(form.nome).trim().length < 2) return 'Informe seu nome completo.';
    if (cpfDigits.length < 11) return 'Informe um CPF válido.';
    if (phoneDigits.length < 10) return 'Informe um telefone/WhatsApp válido.';
    if (cepDigits.length !== 8) return 'Informe um CEP válido.';
    if (!form.endereco) return 'Informe o endereço.';
    if (!form.numero) return 'Informe o número.';
    if (!form.bairro) return 'Informe o bairro.';
    if (!form.cidade) return 'Informe a cidade.';
    if (!form.estado || String(form.estado).trim().length < 2) return 'Informe o estado (UF).';
    return '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const paymentMethod = form.pagamento === 'cartao' ? 'card' : 'pix';

      const errorMessage = validate();
      if (errorMessage) {
        alert(errorMessage);
        return;
      }

      if (paymentMethod === 'card') {
        const cardDigits = onlyDigits(form.cartaoNumero);
        if (!cardDigits || cardDigits.length < 12) {
          alert('Informe um número de cartão válido.');
          return;
        }
        if (!luhnCheck(cardDigits)) {
          alert('Número do cartão inválido (falhou na validação).');
          return;
        }
        if (!form.cartaoNome) {
          alert('Informe o nome no cartão.');
          return;
        }

        const { expMonth: expMonthParsed, expYear: expYearParsed } = parseExpiry(form.cartaoValidade);
        if (!expMonthParsed || !expYearParsed) {
          alert('Informe a validade no formato MM/AA.');
          return;
        }
        if (!isExpiryValid(expMonthParsed, expYearParsed)) {
          alert('Validade do cartão inválida ou expirada.');
          return;
        }

        const brandParsed = detectBrand(cardDigits);
        const requiredCvvLen = brandParsed === 'amex' ? 4 : 3;
        const cvvDigits = onlyDigits(form.cartaoCvv);
        if (!cvvDigits || cvvDigits.length !== requiredCvvLen) {
          alert(`Informe o CVV (${requiredCvvLen} dígitos).`);
          return;
        }
      }

      const cardNumberDigits = onlyDigits(form.cartaoNumero);
      const last4 = cardNumberDigits.slice(-4);

      const { expMonth, expYear } = parseExpiry(form.cartaoValidade);
      const brand = detectBrand(cardNumberDigits);

      const payload = {
        slug,
        quantity,
        customer: {
          nome: form.nome,
          cpf: form.cpf,
          telefone: form.telefone,
        },
        shipping: {
          cep: form.cep,
          endereco: form.endereco,
          numero: form.numero,
          complemento: form.complemento,
          bairro: form.bairro,
          cidade: form.cidade,
          estado: form.estado,
        },
        paymentMethod,
        card:
          paymentMethod === 'card'
            ? {
                last4,
                brand,
                holderName: form.cartaoNome,
                expMonth,
                expYear,
              }
            : undefined,
      };

      const response = await createOrder(payload);
      const order = response.data;

      if (paymentMethod === 'pix') {
        const startedAtMs = Date.now();
        navigate(
          `/pix?slug=${encodeURIComponent(slug)}&q=${quantity}&orderId=${encodeURIComponent(order._id)}&t=${encodeURIComponent(
            String(startedAtMs)
          )}`,
          { state: { product, quantity, form, orderId: order._id, startedAtMs } }
        );
        return;
      }

      alert('Não Conseguimos Aprovar o seu Pagamento com Cartão no Momento. Tente FAzer Via Pix');
      navigate('/');
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      alert(error?.response?.data?.message || 'Não foi possível criar o pedido. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-loading">
            <div className="spinner" />
            <p>Carregando checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-error">
            <h2>Não foi possível abrir o checkout</h2>
            <p>Produto não encontrado. Volte e tente novamente.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page is-form">
      <div className="checkout-container">
        <h1 className="checkout-title">Checkout</h1>

        <div className="checkout-grid">
          <form className="checkout-form" onSubmit={onSubmit}>
              <section className="card">
                <h2>Entrega</h2>
                <div className="two-cols">
                  <div className="field">
                    <label>Nome completo</label>
                    <input name="nome" value={form.nome} onChange={onChange} placeholder="Seu nome" required />
                  </div>
                  <div className="field">
                    <label>CPF</label>
                    <input name="cpf" value={form.cpf} onChange={onChange} placeholder="000.000.000-00" required />
                  </div>
                </div>

                <div className="two-cols">
                  <div className="field">
                    <label>Telefone</label>
                    <input name="telefone" value={form.telefone} onChange={onChange} placeholder="(00) 00000-0000" required />
                  </div>
                  <div className="field">
                    <label>CEP</label>
                    <input name="cep" value={form.cep} onChange={onChange} placeholder="00000-000" required />
                  </div>
                </div>

                <div className="two-cols">
                  <div className="field">
                    <label>Endereço</label>
                    <input name="endereco" value={form.endereco} onChange={onChange} placeholder="Rua, Avenida..." required />
                  </div>
                  <div className="field">
                    <label>Número</label>
                    <input name="numero" value={form.numero} onChange={onChange} placeholder="123" required />
                  </div>
                </div>

                <div className="two-cols">
                  <div className="field">
                    <label>Complemento</label>
                    <input name="complemento" value={form.complemento} onChange={onChange} placeholder="Apto, Bloco..." />
                  </div>
                  <div className="field">
                    <label>Bairro</label>
                    <input name="bairro" value={form.bairro} onChange={onChange} placeholder="Centro" required />
                  </div>
                </div>

                <div className="two-cols">
                  <div className="field">
                    <label>Cidade</label>
                    <input name="cidade" value={form.cidade} onChange={onChange} placeholder="São Paulo" required />
                  </div>
                  <div className="field">
                    <label>Estado</label>
                    <input name="estado" value={form.estado} onChange={onChange} placeholder="SP" required />
                  </div>
                </div>
              </section>

              <section className="card">
                <h2>Pagamento</h2>
                <div className="payment-options">
                  <label className={`payment-option ${form.pagamento === 'pix' ? 'active' : ''}`}>
                    <input type="radio" name="pagamento" value="pix" checked={form.pagamento === 'pix'} onChange={onChange} />
                    <span>PIX</span>
                  </label>
                  <label className={`payment-option ${form.pagamento === 'cartao' ? 'active' : ''}`}>
                    <input type="radio" name="pagamento" value="cartao" checked={form.pagamento === 'cartao'} onChange={onChange} />
                    <span>Cartão</span>
                  </label>
                </div>

                {form.pagamento === 'pix' ? (
                  <p className="payment-hint">Ao continuar, você será direcionado para o pagamento via PIX.</p>
                ) : (
                  <div className="card-fields">
                    <div className="card-brands" aria-label="Bandeiras aceitas">
                      <img
                        className="card-brands-img"
                        src="https://danielfarias.net.br/wp-content/webp-express/webp-images/uploads/2022/10/400-icones-cartoes-de-credito.jpg.webp"
                        alt="Bandeiras de cartões aceitos"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="two-cols">
                      <div className="field">
                        <label>Número do cartão</label>
                        <input name="cartaoNumero" value={form.cartaoNumero} onChange={onChange} placeholder="0000 0000 0000 0000" required />
                      </div>
                      <div className="field">
                        <label>Nome no cartão</label>
                        <input name="cartaoNome" value={form.cartaoNome} onChange={onChange} placeholder="Como está no cartão" required />
                      </div>
                    </div>
                    <div className="two-cols">
                      <div className="field">
                        <label>Validade</label>
                        <input name="cartaoValidade" value={form.cartaoValidade} onChange={onChange} placeholder="MM/AA" required />
                      </div>
                      <div className="field">
                        <label>CVV</label>
                        <input name="cartaoCvv" value={form.cartaoCvv} onChange={onChange} placeholder="123" required />
                      </div>
                    </div>
                    <p className="payment-hint">Pagamento por cartão é simulado neste projeto.</p>
                  </div>
                )}
              </section>

              <button className="btn-finish" type="submit">Continuar</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
