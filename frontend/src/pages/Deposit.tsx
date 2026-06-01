import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { walletAPI, vaultAPI } from '../services/api';
import { TOKENS } from '../config/tokens';
import ErrorAlert from '../components/ErrorAlert';
import SuccessAlert from '../components/SuccessAlert';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from './Wallet.module.css';

interface Wallet {
  id: number;
  wallet_address: string;
  label: string;
}

const Deposit: React.FC = () => {
  const navigate = useNavigate();

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [amount, setAmount] = useState('');
  const [isETH, setIsETH] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [txHash, setTxHash] = useState('');

  const fetchWallets = useCallback(async () => {
    setLoadingWallets(true);
    try {
      const response = await walletAPI.list();
      const walletsList = response.data.wallets;
      setWallets(walletsList);
      if (walletsList.length > 0) {
        setSelectedWallet(walletsList[0].wallet_address);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load wallets');
    } finally {
      setLoadingWallets(false);
    }
  }, []);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const validateForm = () => {
    if (!selectedWallet) {
      setError('Please select a wallet');
      return false;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setTxHash('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const symbol = isETH ? 'ETH' : 'SIMPLE';
      const response = await vaultAPI.deposit(
        selectedWallet,
        amount,
        symbol
      );

      setTxHash(response.data.tx_hash);
      setSuccess(`Deposit successful! TX: ${response.data.tx_hash}`);

      setTimeout(() => {
        navigate('/wallets/list');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  if (loadingWallets) {
    return (
      <div className={styles.container}>
        <LoadingSpinner message="Loading wallets..." />
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Deposit to Vault</h1>
          <ErrorAlert
            message="No wallets available. Please create or import a wallet first."
            onDismiss={() => navigate('/wallets/import')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Deposit to Vault</h1>
        <p className={styles.subtitle}>Deposit crypto from your wallet to the payment vault</p>

        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
        {success && (
          <SuccessAlert
            message={success}
            onDismiss={() => setSuccess('')}
            duration={5000}
          />
        )}

        {loading && <LoadingSpinner message="Processing deposit..." />}

        {!loading && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="wallet">From Wallet</label>
              <select
                id="wallet"
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
                required
              >
                <option value="">Select a wallet</option>
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.wallet_address}>
                    {wallet.label} ({wallet.wallet_address.slice(0, 6)}...
                    {wallet.wallet_address.slice(-4)})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Asset Type</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="radio"
                    checked={isETH}
                    onChange={() => setIsETH(true)}
                  />
                  ETH
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="radio"
                    checked={!isETH}
                    onChange={() => setIsETH(false)}
                  />
                  SIMPLE Token
                </label>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="amount">Amount {isETH ? '(ETH)' : '(SIMPLE)'}</label>
              <input
                id="amount"
                type="number"
                step="0.0001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
              />
            </div>

            <button type="submit" className={styles.submitBtn}>
              Deposit to Vault
            </button>
          </form>
        )}

        {txHash && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '4px' }}>
            <strong>Transaction Hash:</strong>
            <p style={{ fontFamily: 'monospace', wordBreak: 'break-all', margin: '0.5rem 0' }}>
              {txHash}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Deposit;
