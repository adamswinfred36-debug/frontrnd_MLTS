import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import './Frete.css';

const onlyDigits = (value) => String(value || '').replace(/\D+/g, '');

const formatCep = (value) => {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const Frete = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const stateProduct = location.state?.product || null;
  const stateQuantity = location.state?.quantity;

  const slug = searchParams.get('slug') || stateProduct?.slug;
  const quantityParam = Number(searchParams.get('q') || stateQuantity || 1);
  const quantity = Number.isFinite(quantityParam) && quantityParam > 0 ? quantityParam : 1;

  const persistedCep = useMemo(() => {
    const raw = localStorage.getItem('checkoutCep') || '';
    return formatCep(raw);
  }, []);

  const [cep, setCep] = useState(persistedCep);
  const [selected, setSelected] = useState('amanha');
  const [addressText, setAddressText] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(localStorage.getItem('checkoutDeliveryDate') || '');
  const dateInputRef = useRef(null);

  const hasValidCep = useMemo(() => onlyDigits(cep).length === 8, [cep]);

  useEffect(() => {
    const digits = onlyDigits(cep);
    if (digits.length !== 8) {
      setAddressText('');
      setAddressLoading(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        setAddressLoading(true);
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (cancelled) return;
        if (!data || data.erro) {
          setAddressText('');
          return;
        }

        const parts = [data.logradouro, data.bairro, `${data.localidade}/${data.uf}`]
          .map((p) => String(p || '').trim())
          .filter(Boolean);
        setAddressText(parts.join(' • '));
      } catch (e) {
        if (!cancelled) setAddressText('');
      } finally {
        if (!cancelled) setAddressLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [cep]);

  const onContinue = useCallback(() => {
    if (!slug) {
      window.alert('Produto não encontrado. Volte e tente novamente.');
      navigate('/', { replace: true });
      return;
    }

    if (!hasValidCep) {
      window.alert('Informe um CEP válido.');
      return;
    }

    if (selected === 'seu-dia' && !deliveryDate) {
      window.alert('Escolha um dia de entrega.');
      return;
    }

    localStorage.setItem('checkoutCep', onlyDigits(cep));
    localStorage.setItem('checkoutFrete', selected);
    if (selected === 'seu-dia') {
      localStorage.setItem('checkoutDeliveryDate', String(deliveryDate));
    } else {
      localStorage.removeItem('checkoutDeliveryDate');
    }

    navigate(`/checkout?slug=${encodeURIComponent(slug)}&q=${quantity}`, {
      state: stateProduct ? { product: stateProduct, quantity } : { quantity },
    });
  }, [cep, deliveryDate, hasValidCep, navigate, quantity, selected, slug, stateProduct]);

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  return (
    <div className="frete-page">
      <div className="frete-top">
        <button type="button" className="frete-back" onClick={() => navigate(-1)} aria-label="Voltar">
          ←
        </button>
        <div className="frete-title">Escolha quando sua compra chegará</div>
      </div>

      <div className="frete-body">
        <div className="frete-address">
          📍 Envio para{' '}
          {hasValidCep ? (
            addressLoading ? (
              'carregando endereço...'
            ) : addressText ? (
              addressText
            ) : (
              `CEP ${formatCep(cep)}`
            )
          ) : (
            'informar CEP'
          )}
        </div>

        {!hasValidCep ? (
          <div className="frete-cep-card">
            <label className="frete-cep-label">CEP</label>
            <input
              className="frete-cep-input"
              value={cep}
              onChange={(e) => setCep(formatCep(e.target.value))}
              placeholder="00000-000"
              inputMode="numeric"
              autoFocus
            />
            <button className="frete-cep-btn" type="button" onClick={onContinue}>
              Continuar
            </button>
          </div>
        ) : (
          <div className="frete-card">
            <div className="frete-card-head">
              <div className="frete-card-title">Envio 1</div>
              <div className="frete-card-badge">⚡ FULL</div>
            </div>

            <div className="frete-options">
              <label className="frete-option">
                <input
                  type="radio"
                  name="frete"
                  checked={selected === 'amanha'}
                  onChange={() => setSelected('amanha')}
                />
                <div className="frete-option-main">
                  <div className="frete-option-row">
                    <div className="frete-option-title">Amanhã</div>
                    <div className="frete-option-price">Grátis</div>
                  </div>
                  <div className="frete-option-sub">CHEGA ANTES DO NATAL</div>
                </div>
              </label>

              <label className="frete-option">
                <input
                  type="radio"
                  name="frete"
                  checked={selected === 'sexta'}
                  onChange={() => setSelected('sexta')}
                />
                <div className="frete-option-main">
                  <div className="frete-option-row">
                    <div className="frete-option-title">Sexta-feira</div>
                    <div className="frete-option-price">Grátis</div>
                  </div>
                </div>
              </label>

              <label className="frete-option">
                <input
                  type="radio"
                  name="frete"
                  checked={selected === 'seu-dia'}
                  onChange={() => setSelected('seu-dia')}
                />
                <div className="frete-option-main">
                  <div className="frete-option-row">
                    <div className="frete-option-title">Seu dia de entregas</div>
                    <div className="frete-option-price">Grátis</div>
                  </div>
                  <div className="frete-choose-day-row">
                    <button
                      type="button"
                      className="frete-choose-day"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelected('seu-dia');
                        window.setTimeout(() => {
                          dateInputRef.current?.focus();
                          dateInputRef.current?.showPicker?.();
                        }, 0);
                      }}
                    >
                      Escolher dia
                    </button>

                    <input
                      ref={dateInputRef}
                      className="frete-date"
                      type="date"
                      value={deliveryDate}
                      min={minDate}
                      onChange={(e) => {
                        setSelected('seu-dia');
                        setDeliveryDate(e.target.value);
                      }}
                      onClick={() => setSelected('seu-dia')}
                    />
                  </div>
                  {selected === 'seu-dia' && deliveryDate ? (
                    <div className="frete-date-selected">Selecionado: {deliveryDate.split('-').reverse().join('/')}</div>
                  ) : null}
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {hasValidCep && (
        <div className="frete-bottom">
          <div className="frete-bottom-row">
            <div className="frete-bottom-label">Frete</div>
            <div className="frete-bottom-value">Grátis</div>
          </div>
          <button className="frete-continue" type="button" onClick={onContinue}>
            Continuar
          </button>
        </div>
      )}
    </div>
  );
};

export default Frete;
