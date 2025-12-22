import React, { useEffect, useState } from 'react';
import { getAdminSettings, updateAdminSettings } from '../../services/api';
import './AdminSettingsPix.css';

const AdminSettingsPix = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [pixKey, setPixKey] = useState('');
  const [pixTxidDefault, setPixTxidDefault] = useState('ABC');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAdminSettings();
      setPixKey(response.data.pixKey || '');
      setPixTxidDefault(response.data.pixTxidDefault || 'ABC');
      setWhatsappNumber(response.data.whatsappNumber || '');
    } catch (e) {
      setError('Não foi possível carregar as configurações.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await updateAdminSettings({ pixKey, pixTxidDefault, whatsappNumber });
      setSuccess('Configurações salvas.');
    } catch (e) {
      setError('Não foi possível salvar as configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-settings">
        <div className="admin-settings-card">
          <div className="spinner"></div>
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-settings">
      <div className="admin-settings-card">
        <h1>Configurações PIX</h1>
        <p className="hint">Essa chave será usada no checkout para gerar o QRCode e o código copia-e-cola.</p>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Chave PIX do recebedor</label>
            <input value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="sua-chave-pix" required />
          </div>

          <div className="field">
            <label>TXID padrão</label>
            <input value={pixTxidDefault} onChange={(e) => setPixTxidDefault(e.target.value)} placeholder="ABC" />
          </div>

          <div className="field">
            <label>WhatsApp para enviar comprovante</label>
            <input
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="Ex: 5591999999999"
            />
            <div className="hint">Use DDD + número. Ex.: 55 (Brasil) + DDD + número.</div>
          </div>

          <button className="btn-save" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminSettingsPix;
