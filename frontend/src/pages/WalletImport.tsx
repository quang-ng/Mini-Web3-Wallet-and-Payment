import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { walletAPI } from '../services/api';
import ErrorAlert from '../components/ErrorAlert';
import SuccessAlert from '../components/SuccessAlert';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from './Wallet.module.css';

const WalletImport: React.FC = () => {
  const [privateKey, setPrivateKey] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validatePrivateKey = (key: string) => {
    if (key.startsWith('0x')) {
      return key.length === 66;
    }
    return key.length === 64;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!privateKey || !label) {
      setError('Private key and label are required');
      return;
    }

    if (!validatePrivateKey(privateKey)) {
      setError('Invalid private key format (should be 64 hex characters or 0x + 64 hex)');
      return;
    }

    setLoading(true);
    try {
      const response = await walletAPI.import(privateKey, label);
      setSuccess(`Wallet imported successfully! Address: ${response.data.wallet_address}`);
      setTimeout(() => {
        navigate('/wallets/list');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to import wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Import Wallet</h1>
        <p className={styles.subtitle}>Add a wallet using your private key</p>

        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
        {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

        {loading && <LoadingSpinner message="Importing wallet..." />}

        {!loading && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="label">Wallet Label</label>
              <input
                id="label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Main Wallet"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="privateKey">Private Key</label>
              <textarea
                id="privateKey"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="0x... or without 0x prefix"
                rows={3}
              />
              <small className={styles.hint}>
                64 hex characters (with or without 0x prefix). Keep this secure!
              </small>
            </div>

            <button type="submit" className={styles.submitBtn}>
              Import Wallet
            </button>
          </form>
        )}

        <div className={styles.warning}>
          <strong>⚠️ Security Warning:</strong>
          <p>Never share your private key with anyone. This wallet stores your encrypted key securely.</p>
        </div>
      </div>
    </div>
  );
};

export default WalletImport;
