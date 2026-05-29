import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { walletAPI, transferAPI } from '../services/api';
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

const Transfer: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const preSelectedAddress = (location.state as any)?.wallet_address || '';

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState(preSelectedAddress);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [isETH, setIsETH] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [txHash, setTxHash] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('TOKEN');

  const fetchWallets = useCallback(async () => {
    setLoadingWallets(true);
    try {
      const response = await walletAPI.list();
      const walletsList = response.data.wallets;
      setWallets(walletsList);
      if (preSelectedAddress) {
        setSelectedWallet(preSelectedAddress);
      } else if (walletsList.length > 0) {
        setSelectedWallet(walletsList[0].wallet_address);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load wallets');
    } finally {
      setLoadingWallets(false);
    }
  }, [preSelectedAddress]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleTokenSelect = (address: string) => {
    setTokenAddress(address);
    const token = TOKENS.find(t => t.address.toLowerCase() === address.toLowerCase());
    if (token) {
      setTokenSymbol(token.symbol);
    } else {
      setTokenSymbol('TOKEN');
    }
  };

  const validateForm = () => {
    if (!selectedWallet) {
      setError('Please select a wallet');
      return false;
    }
    if (!recipientAddress || recipientAddress.length !== 42) {
      setError('Invalid recipient address format');
      return false;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }
    if (!isETH && !tokenAddress) {
      setError('Token address required for ERC20 transfers');
      return false;
    }
    if (!isETH && tokenAddress.length !== 42) {
      setError('Invalid token address format');
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
      const response = await transferAPI.transfer(
        selectedWallet,
        recipientAddress,
        amount,
        isETH ? undefined : tokenAddress
      );

      setTxHash(response.data.tx_hash);
      setSuccess(`Transfer successful! TX: ${response.data.tx_hash}`);

      setTimeout(() => {
        navigate('/wallets/list');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Transfer failed');
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
          <h1 className={styles.title}>Send Crypto</h1>
          <ErrorAlert
            message="No wallets available. Please import a wallet first."
            onDismiss={() => navigate('/wallets/import')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Send Crypto</h1>

        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
        {success && (
          <SuccessAlert
            message={success}
            onDismiss={() => setSuccess('')}
            duration={5000}
          />
        )}

        {loading && <LoadingSpinner message="Processing transfer..." />}

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
              <label htmlFor="recipient">Recipient Address</label>
              <input
                id="recipient"
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>Transfer Type</label>
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
                  ERC20 Token
                </label>
              </div>
            </div>

            {!isETH && (
              <div className={styles.formGroup}>
                <label htmlFor="tokenSelect">Select Token</label>
                <select
                  id="tokenSelect"
                  value={tokenAddress}
                  onChange={(e) => handleTokenSelect(e.target.value)}
                  required
                >
                  <option value="">-- Select a token --</option>
                  {TOKENS.map((token) => (
                    <option key={token.address} value={token.address}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="amount">Amount {isETH ? '(ETH)' : `(${tokenSymbol})`}</label>
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
              Send Transaction
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

export default Transfer;
