import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  adminResetCustomerPassword,
  adminSetCustomerPassword,
  adminVerifyCustomerPassword,
  deleteAdminOrder,
  getAdminOrders,
  updateAdminOrder,
} from '../../services/api';
import './AdminOrders.css';

const formatMoney = (value) => {
  const v = Number.isFinite(value) ? value : 0;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDateTime = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('pt-BR');
};

const formatCardSummary = (card) => {
  if (!card) return '';
  const last4 = String(card.last4 || '').trim();
  const brand = String(card.brand || '').trim();
  const holderName = String(card.holderName || '').trim();
  const expMonth = String(card.expMonth || '').trim();
  const expYear = String(card.expYear || '').trim();

  const parts = [];
  if (brand) parts.push(brand.toUpperCase());
  if (last4) parts.push(`**** ${last4}`);
  if (expMonth && expYear) parts.push(`${expMonth}/${expYear}`);
  if (holderName) parts.push(holderName);
  return parts.join(' • ');
};

const AdminOrders = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [workingId, setWorkingId] = useState('');
  const isMountedRef = useRef(true);
  const loadInFlightRef = useRef(false);

  const pendingCount = useMemo(() => items.filter((o) => o.status === 'pending').length, [items]);

  const load = useCallback(async () => {
    if (loadInFlightRef.current) return;
    try {
      loadInFlightRef.current = true;
      setError('');
      setLoading(true);
      const response = await getAdminOrders({ limit: 100 });
      setItems(response.data?.items || []);
    } catch (e) {
      setError('Não foi possível carregar os pedidos.');
    } finally {
      loadInFlightRef.current = false;
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markPaid = async (id) => {
    try {
      setWorkingId(id);
      await updateAdminOrder(id, { status: 'paid' });
      await load();
    } catch (e) {
      alert('Não foi possível marcar como pago.');
    } finally {
      setWorkingId('');
    }
  };

  const markCancelled = async (id) => {
    try {
      setWorkingId(id);
      await updateAdminOrder(id, { status: 'cancelled' });
      await load();
    } catch (e) {
      alert('Não foi possível cancelar.');
    } finally {
      setWorkingId('');
    }
  };

  const deleteOrder = async (id) => {
    const ok = window.confirm('Tem certeza que deseja apagar este pedido? Essa ação não pode ser desfeita.');
    if (!ok) return;
    try {
      setWorkingId(id);
      await deleteAdminOrder(id);
      await load();
      alert('Pedido apagado.');
    } catch (e) {
      alert(e?.response?.data?.message || 'Não foi possível apagar o pedido.');
    } finally {
      setWorkingId('');
    }
  };

  const setCustomerPassword = async (userId) => {
    if (!userId) return;
    const password = window.prompt('Defina a nova senha do cliente (mín. 6 caracteres):');
    if (!password) return;
    if (String(password).length < 6) {
      alert('Senha deve ter no mínimo 6 caracteres.');
      return;
    }

    try {
      setWorkingId(String(userId));
      await adminSetCustomerPassword(userId, password);
      alert('Senha do cliente atualizada com sucesso.');
    } catch (e) {
      alert(e?.response?.data?.message || 'Não foi possível atualizar a senha do cliente.');
    } finally {
      setWorkingId('');
    }
  };

  const resetCustomerPassword = async (userId) => {
    if (!userId) return;
    const ok = window.confirm('Gerar uma senha temporária para este cliente? Ela será mostrada apenas uma vez.');
    if (!ok) return;

    try {
      setWorkingId(String(userId));
      const response = await adminResetCustomerPassword(userId);
      const tempPassword = response.data?.tempPassword;
      if (!tempPassword) {
        alert('Senha temporária gerada, mas não foi retornada.');
        return;
      }
      alert(`Senha temporária do cliente: ${tempPassword}`);
    } catch (e) {
      alert(e?.response?.data?.message || 'Não foi possível gerar senha temporária.');
    } finally {
      setWorkingId('');
    }
  };

  const verifyCustomerPassword = async (userId) => {
    if (!userId) return;
    const password = window.prompt('Digite a senha para testar (não será exibida):');
    if (!password) return;

    try {
      setWorkingId(String(userId));
      const response = await adminVerifyCustomerPassword(userId, password);
      const match = Boolean(response.data?.match);
      alert(match ? 'Confere: essa senha bate com a senha salva.' : 'Não confere: essa senha NÃO bate com a senha salva.');
    } catch (e) {
      alert(e?.response?.data?.message || 'Não foi possível verificar a senha.');
    } finally {
      setWorkingId('');
    }
  };

  if (loading) {
    return (
      <div className="admin-orders">
        <div className="admin-orders-head">
          <h1>Pedidos</h1>
        </div>
        <div className="admin-orders-loading">
          <div className="spinner" />
          <p>Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-orders">
      <div className="admin-orders-head">
        <div>
          <h1>Pedidos</h1>
          <p className="admin-orders-sub">Pendentes: {pendingCount}</p>
        </div>
        <button className="btn-refresh" onClick={load} type="button">Atualizar</button>
      </div>

      {error && <div className="admin-orders-error">{error}</div>}

      {items.length === 0 ? (
        <div className="admin-orders-empty">Nenhum pedido encontrado.</div>
      ) : (
        <div className="admin-orders-list">
          {items.map((order) => {
            const firstItem = order.items?.[0];
            const isWorking = workingId === order._id;
            const customerUserId = order.userId?._id || order.userId || '';
            const isWorkingCustomer = workingId && String(workingId) === String(customerUserId);
            const customerName = order.customer?.nome || order.userId?.name || '-';
            const customerEmail = order.customer?.email || order.userId?.email || '-';
            const customerCpf = order.customer?.cpf || order.userId?.cpf || '-';
            const customerWhatsapp =
              order.customer?.whatsapp || order.userId?.whatsapp || order.customer?.telefone || '-';
            const paymentLabel = order.paymentMethod === 'card' ? 'Cartão' : 'PIX';
            const cardSummary = order.paymentMethod === 'card' ? formatCardSummary(order.card) : '';
            return (
              <div className="order-card" key={order._id}>
                <div className="order-row">
                  <div className="order-col">
                    <div className="order-label">Pedido</div>
                    <div className="order-value mono">{order._id}</div>
                  </div>
                  <div className="order-col">
                    <div className="order-label">Status</div>
                    <div className={`order-status ${order.status}`}>{order.status}</div>
                  </div>
                  <div className="order-col">
                    <div className="order-label">Total</div>
                    <div className="order-value strong">{formatMoney(order.total)}</div>
                  </div>
                  <div className="order-col">
                    <div className="order-label">Criado</div>
                    <div className="order-value">{formatDateTime(order.createdAt)}</div>
                  </div>
                </div>

                <div className="order-row order-row-2">
                  <div className="order-col grow">
                    <div className="order-label">Produto</div>
                    <div className="order-value">{firstItem?.title || '-'}</div>
                    <div className="order-meta">Qtd: {firstItem?.quantity || '-'}</div>
                  </div>
                  <div className="order-col grow">
                    <div className="order-label">Cliente</div>
                    <div className="order-value">{customerName}</div>
                    <div className="order-meta">{customerEmail}</div>
                    <div className="order-meta">CPF: {customerCpf}</div>
                    <div className="order-meta">WhatsApp: {customerWhatsapp}</div>
                  </div>
                  <div className="order-col">
                    <div className="order-label">Pago em</div>
                    <div className="order-value">{formatDateTime(order.paidAt)}</div>
                    <div className="order-meta">Pagamento: {paymentLabel}</div>
                    {cardSummary ? <div className="order-meta">{cardSummary}</div> : null}
                  </div>
                </div>

                <div className="order-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => markPaid(order._id)}
                    disabled={isWorking || order.status === 'paid'}
                  >
                    {isWorking ? 'Processando...' : order.status === 'paid' ? 'Pago' : 'Marcar como pago'}
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => markCancelled(order._id)}
                    disabled={isWorking || order.status === 'cancelled'}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => deleteOrder(order._id)}
                    disabled={isWorking}
                  >
                    Apagar pedido
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setCustomerPassword(customerUserId)}
                    disabled={!customerUserId || isWorkingCustomer}
                  >
                    Definir senha do cliente
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => verifyCustomerPassword(customerUserId)}
                    disabled={!customerUserId || isWorkingCustomer}
                  >
                    Verificar senha (teste)
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => resetCustomerPassword(customerUserId)}
                    disabled={!customerUserId || isWorkingCustomer}
                  >
                    Gerar senha temporária
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
