import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import QRious from 'qrious';
import { getProductBySlug, getPublicSettings } from '../services/api';
import './PixPage.css';

const PixPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const stateProduct = location.state?.product || null;
  const stateQuantity = location.state?.quantity;
  const stateOrderId = location.state?.orderId;
  const stateStartedAtMs = location.state?.startedAtMs;

  const slug = searchParams.get('slug') || stateProduct?.slug;
  const quantityParam = Number(searchParams.get('q') || stateQuantity || 1);
  const quantity = Number.isFinite(quantityParam) && quantityParam > 0 ? quantityParam : 1;

  const orderId = searchParams.get('orderId') || stateOrderId || '';
  const startedAtMsRaw = Number(searchParams.get('t') || stateStartedAtMs || Date.now());
  const startedAtMs = Number.isFinite(startedAtMsRaw) ? startedAtMsRaw : Date.now();
  const expiresAtMs = startedAtMs + 30 * 60 * 1000;
  const [nowMs, setNowMs] = useState(Date.now());

  const [product, setProduct] = useState(stateProduct);
  const [productLoading, setProductLoading] = useState(!stateProduct);

  const [pixLoading, setPixLoading] = useState(true);
  const [delayDone, setDelayDone] = useState(false);

  const [pixSettings, setPixSettings] = useState({ pixKey: '', pixTxidDefault: 'ABC', whatsappNumber: '' });
  const [pixTxid, setPixTxid] = useState('ABC');

  const qrCanvasRef = useRef(null);
  const qriousRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDelayDone(true), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const loadProduct = async () => {
      if (product || !slug) return;
      try {
        setProductLoading(true);
        const response = await getProductBySlug(slug);
        setProduct(response.data);
      } catch (error) {
        console.error('Erro ao carregar produto no PIX:', error);
      } finally {
        setProductLoading(false);
      }
    };

    loadProduct();
  }, [product, slug]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setPixLoading(true);
        const response = await getPublicSettings();
        const pixKey = response.data?.pixKey || '';
        const pixTxidDefault = response.data?.pixTxidDefault || 'ABC';
        const whatsappNumber = response.data?.whatsappNumber || '';
        setPixSettings({ pixKey, pixTxidDefault, whatsappNumber });
        setPixTxid((prev) => prev || pixTxidDefault || 'ABC');
      } catch (error) {
        console.error('Erro ao carregar settings PIX:', error);
        setPixSettings({ pixKey: '', pixTxidDefault: 'ABC', whatsappNumber: '' });
      } finally {
        setPixLoading(false);
      }
    };

    loadSettings();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const copyTextToClipboard = async (text) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {
      // fallback abaixo
    }

    try {
      const textArea = document.createElement('textarea');
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (_) {
      return false;
    }
  };

  const computeCRC16 = (input) => {
    const bytes = new TextEncoder().encode(input);
    const crcTable = [
      0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7, 0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad,
      0xe1ce, 0xf1ef, 0x1231, 0x0210, 0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6, 0x9339, 0x8318, 0xb37b, 0xa35a,
      0xd3bd, 0xc39c, 0xf3ff, 0xe3de, 0x2462, 0x3443, 0x0420, 0x1401, 0x64e6, 0x74c7, 0x44a4, 0x5485, 0xa56a, 0xb54b,
      0x8528, 0x9509, 0xe5ee, 0xf5cf, 0xc5ac, 0xd58d, 0x3653, 0x2672, 0x1611, 0x0630, 0x76d7, 0x66f6, 0x5695, 0x46b4,
      0xb75b, 0xa77a, 0x9719, 0x8738, 0xf7df, 0xe7fe, 0xd79d, 0xc7bc, 0x48c4, 0x58e5, 0x6886, 0x78a7, 0x0840, 0x1861,
      0x2802, 0x3823, 0xc9cc, 0xd9ed, 0xe98e, 0xf9af, 0x8948, 0x9969, 0xa90a, 0xb92b, 0x5af5, 0x4ad4, 0x7ab7, 0x6a96,
      0x1a71, 0x0a50, 0x3a33, 0x2a12, 0xdbfd, 0xcbdc, 0xfbbf, 0xeb9e, 0x9b79, 0x8b58, 0xbb3b, 0xab1a, 0x6ca6, 0x7c87,
      0x4ce4, 0x5cc5, 0x2c22, 0x3c03, 0x0c60, 0x1c41, 0xedae, 0xfd8f, 0xcdec, 0xddcd, 0xad2a, 0xbd0b, 0x8d68, 0x9d49,
      0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13, 0x2e32, 0x1e51, 0x0e70, 0xff9f, 0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a,
      0x9f59, 0x8f78, 0x9188, 0x81a9, 0xb1ca, 0xa1eb, 0xd10c, 0xc12d, 0xf14e, 0xe16f, 0x1080, 0x00a1, 0x30c2, 0x20e3,
      0x5004, 0x4025, 0x7046, 0x6067, 0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e, 0x02b1, 0x1290,
      0x22f3, 0x32d2, 0x4235, 0x5214, 0x6277, 0x7256, 0xb5ea, 0xa5cb, 0x95a8, 0x8589, 0xf56e, 0xe54f, 0xd52c, 0xc50d,
      0x34e2, 0x24c3, 0x14a0, 0x0481, 0x7466, 0x6447, 0x5424, 0x4405, 0xa7db, 0xb7fa, 0x8799, 0x97b8, 0xe75f, 0xf77e,
      0xc71d, 0xd73c, 0x26d3, 0x36f2, 0x0691, 0x16b0, 0x6657, 0x7676, 0x4615, 0x5634, 0xd94c, 0xc96d, 0xf90e, 0xe92f,
      0x99c8, 0x89e9, 0xb98a, 0xa9ab, 0x5844, 0x4865, 0x7806, 0x6827, 0x18c0, 0x08e1, 0x3882, 0x28a3, 0xcb7d, 0xdb5c,
      0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a, 0x4a75, 0x5a54, 0x6a37, 0x7a16, 0x0af1, 0x1ad0, 0x2ab3, 0x3a92,
      0xfd2e, 0xed0f, 0xdd6c, 0xcd4d, 0xbdaa, 0xad8b, 0x9de8, 0x8dc9, 0x7c26, 0x6c07, 0x5c64, 0x4c45, 0x3ca2, 0x2c83,
      0x1ce0, 0x0cc1, 0xef1f, 0xff3e, 0xcf5d, 0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8, 0x6e17, 0x7e36, 0x4e55, 0x5e74,
      0x2e93, 0x3eb2, 0x0ed1, 0x1ef0,
    ];

    let crc = 0xffff;
    for (let i = 0; i < bytes.length; i++) {
      const c = bytes[i];
      const j = (c ^ (crc >> 8)) & 0xff;
      crc = (crcTable[j] ^ (crc << 8)) & 0xffff;
    }

    let hex = (crc & 0xffff).toString(16).toUpperCase();
    while (hex.length < 4) hex = '0' + hex;
    return hex;
  };

  const getLen = (str) => {
    const s = String(str);
    return s.length < 10 ? '0' + s.length : String(s.length);
  };

  const generatePix = useCallback(({ chavePix, valorReais, txid }) => {
    const merchantInfo = `0014br.gov.bcb.pix01${getLen(chavePix)}${chavePix}`;

    const nome = 'COMPRA';
    const cidade = 'JOAO PESSOA';
    const txID = txid || 'ABC';

    const txqrcode =
      '000201' +
      '26' +
      getLen(merchantInfo) +
      merchantInfo +
      '52040000' +
      '5303986' +
      '54' +
      getLen(valorReais) +
      valorReais +
      '5802BR' +
      '59' +
      getLen(nome) +
      nome +
      '60' +
      getLen(cidade) +
      cidade +
      '620705' +
      getLen(txID) +
      txID +
      '6304';

    const crc16 = computeCRC16(txqrcode);
    return txqrcode + crc16;
  }, []);

  const unitPrice = product?.price?.current || 0;
  const total = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);
  const totalPix = useMemo(() => {
    const v = Number.isFinite(total) ? total : 0;
    return v.toFixed(2);
  }, [total]);

  const pixPayload = useMemo(() => {
    if (!pixSettings.pixKey) return '';
    return generatePix({
      chavePix: pixSettings.pixKey.trim(),
      valorReais: totalPix,
      txid: (pixTxid || pixSettings.pixTxidDefault || 'ABC').trim(),
    });
  }, [pixSettings.pixKey, pixSettings.pixTxidDefault, pixTxid, totalPix, generatePix]);

  const remainingMs = Math.max(0, expiresAtMs - nowMs);
  const isExpired = remainingMs <= 0;
  const remainingText = useMemo(() => {
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [remainingMs]);

  const showLoading = !delayDone || pixLoading || productLoading;

  useEffect(() => {
    if (showLoading) return;
    if (!qrCanvasRef.current) return;
    if (!pixPayload) return;

    if (!qriousRef.current) {
      qriousRef.current = new QRious({
        element: qrCanvasRef.current,
        background: '#ffffff',
        backgroundAlpha: 1,
        foreground: '#000000',
        foregroundAlpha: 1,
        level: 'L',
        padding: 0,
        size: 256,
        value: pixPayload,
      });
      return;
    }

    qriousRef.current.set({ value: pixPayload });
  }, [showLoading, pixPayload]);

  const handleCopyPix = async () => {
    if (!pixPayload) return;
    const ok = await copyTextToClipboard(pixPayload);
    alert(ok ? 'Código PIX copiado.' : 'Não foi possível copiar.');
  };

  const handlePaidWhatsapp = () => {
    const raw = String(pixSettings.whatsappNumber || '').trim();
    const digits = raw.replace(/\D+/g, '');
    if (!digits) {
      alert('WhatsApp não configurado. Cadastre o número no admin em: Configurações → PIX.');
      return;
    }

    const txid = (pixTxid || pixSettings.pixTxidDefault || 'ABC').trim();
    const messageLines = [
      'Olá! Já realizei o pagamento via PIX e vou enviar o comprovante.',
      orderId ? `Pedido: ${orderId}` : null,
      product?.title ? `Produto: ${product.title}` : null,
      `Quantidade: ${quantity}`,
      `Valor: ${formatPrice(total)}`,
      txid ? `TXID: ${txid}` : null,
    ].filter(Boolean);

    const text = encodeURIComponent(messageLines.join('\n'));
    const url = `https://wa.me/${digits}?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!slug) {
    return (
      <div className="pix-only-page">
        <div className="pix-only-container">
          <div className="pix-only-card">
            <h2>Pagamento PIX</h2>
            <p>Produto não informado.</p>
            <button className="btn-secondary" onClick={() => navigate('/')}>Voltar</button>
          </div>
        </div>
      </div>
    );
  }

  if (!product && !productLoading) {
    return (
      <div className="pix-only-page">
        <div className="pix-only-container">
          <div className="pix-only-card">
            <h2>Pagamento PIX</h2>
            <p>Produto não encontrado.</p>
            <button className="btn-secondary" onClick={() => navigate('/')}>Voltar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pix-only-page">
      <div className="pix-only-container">
        {showLoading ? (
          <div className="pix-loading-modern">
            <div className="modern-spinner" />
            <div className="loading-lines">
              <div className="shimmer line" />
              <div className="shimmer line short" />
            </div>
            <p>Preparando seu pagamento PIX...</p>
          </div>
        ) : (
          <div className="pix-only-card">
            <div className="pix-only-header">
              <div>
                <h2>Pagamento via PIX</h2>
                <p className="subtitle">Escaneie o QR Code ou copie o código.</p>
              </div>
              <div className="amount">
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </div>
            </div>

            <div className={`pix-timer ${isExpired ? 'expired' : ''}`} aria-label="Tempo para pagamento">
              <strong>{isExpired ? 'Tempo expirou' : 'Tempo para pagar'}</strong>
              <span>{remainingText}</span>
            </div>

            {!pixSettings.pixKey && (
              <div className="pix-warn">
                <strong>Chave PIX não configurada.</strong>
                <p>Configure no admin em: Configurações → PIX.</p>
              </div>
            )}

            <div className="pix-only-grid">
              <div className="qrbox">
                <canvas ref={qrCanvasRef} />
                <p className="qrnote">Aponte a câmera do seu banco para o QR Code.</p>
              </div>

              <div className="side">
                <div className="field">
                  <label>TXID</label>
                  <input value={pixTxid} onChange={(e) => setPixTxid(e.target.value)} placeholder={pixSettings.pixTxidDefault || 'ABC'} />
                </div>

                <div className="field">
                  <label>Copia e cola</label>
                  <textarea readOnly value={pixPayload} rows={7} />
                </div>

                <div className="actions">
                  <button className="btn-primary" onClick={handleCopyPix} disabled={!pixPayload}>
                    Copiar código PIX
                  </button>
                  <button className="btn-primary" onClick={handlePaidWhatsapp} disabled={!pixPayload}>
                    Já paguei
                  </button>
                  <button className="btn-secondary" onClick={() => navigate(`/checkout?slug=${encodeURIComponent(slug)}&q=${quantity}`, { state: { product, quantity } })}>
                    Voltar
                  </button>
                </div>
              </div>
            </div>

            {product && (
              <div className="summary">
                <div className="summary-product">
                  <img src={`http://localhost:5000${product.images?.[0] || ''}`} alt={product.title} />
                  <div>
                    <p className="summary-title">{product.title}</p>
                    <p className="summary-qty">Quantidade: {quantity}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PixPage;
