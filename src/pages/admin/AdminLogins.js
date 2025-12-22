import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { deleteAdminUser, getAdminUsers } from '../../services/api';
import './AdminLogins.css';

const formatDateTime = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('pt-BR');
};

const AdminLogins = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const loadInFlightRef = useRef(false);

  const total = useMemo(() => items.length, [items]);

  const load = useCallback(async () => {
    if (loadInFlightRef.current) return;
    try {
      loadInFlightRef.current = true;
      setError('');
      setLoading(true);
      const response = await getAdminUsers({ page: 1, limit: 200 });
      setItems(response.data?.items || []);
    } catch (e) {
      setError('Não foi possível carregar os logins.');
    } finally {
      loadInFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = useCallback(
    async (user) => {
      if (!user?._id) return;
      const email = user.email || 'este login';
      const ok = window.confirm(`Tem certeza que deseja apagar o login: ${email} ?`);
      if (!ok) return;

      try {
        setDeletingId(user._id);
        await deleteAdminUser(user._id);
        await load();
        window.alert('Login apagado com sucesso.');
      } catch (e) {
        window.alert('Não foi possível apagar o login.');
      } finally {
        setDeletingId('');
      }
    },
    [load]
  );

  if (loading) {
    return (
      <div className="admin-logins">
        <div className="admin-logins-head">
          <h1>Logins</h1>
        </div>
        <div className="admin-logins-loading">
          <div className="spinner" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-logins">
      <div className="admin-logins-head">
        <div>
          <h1>Logins</h1>
          <p className="admin-logins-sub">Total: {total}</p>
        </div>
        <button className="btn-refresh" onClick={load} type="button">
          Atualizar
        </button>
      </div>

      {error && <div className="admin-logins-error">{error}</div>}

      {items.length === 0 ? (
        <div className="admin-logins-empty">Nenhum login encontrado.</div>
      ) : (
        <div className="admin-logins-table-wrap">
          <table className="admin-logins-table">
            <thead>
              <tr>
                <th>E-mail</th>
                <th>Nome</th>
                <th>CPF</th>
                <th>WhatsApp</th>
                <th>Criado</th>
                <th>Senha alterada</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u._id}>
                  <td className="mono">{u.email || '-'}</td>
                  <td>{u.name || '-'}</td>
                  <td className="mono">{u.cpf || '-'}</td>
                  <td className="mono">{u.whatsapp || '-'}</td>
                  <td>{formatDateTime(u.createdAt)}</td>
                  <td>{formatDateTime(u.passwordUpdatedAt)}</td>
                  <td>
                    <button
                      className="btn-danger"
                      type="button"
                      onClick={() => handleDelete(u)}
                      disabled={deletingId === u._id}
                      title="Apagar login"
                    >
                      {deletingId === u._id ? 'Apagando...' : 'Apagar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminLogins;
