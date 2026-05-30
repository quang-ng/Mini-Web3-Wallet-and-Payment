import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { walletAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import styles from './Wallet.module.css';

interface Wallet {
  id: number;
  wallet_address: string;
  label: string;
  added_at: string;
  balance?: string;
  tokenBalance?: string;
}

const WalletList: React.FC = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await walletAPI.list();
      setWallets(response.data.wallets);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch wallets');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  const maskAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Wallets</h1>
          <Link to="/wallets/import" className={styles.primaryBtn}>
            + Import Wallet
          </Link>
        </div>

        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

        {loading && <LoadingSpinner message="Loading wallets..." />}

        {!loading && wallets.length === 0 && (
          <div className={styles.emptyState}>
            <p>No wallets imported yet</p>
            <Link to="/wallets/import" className={styles.primaryBtn}>
              Import Your First Wallet
            </Link>
          </div>
        )}

        {!loading && wallets.length > 0 && (
          <div className={styles.walletList}>
            {wallets.map((wallet) => (
              <div key={wallet.id} className={styles.walletItem}>
                <div className={styles.walletInfo}>
                  <h3 className={styles.walletLabel}>{wallet.label}</h3>
                  <p className={styles.walletAddress} title={wallet.wallet_address}>
                    {maskAddress(wallet.wallet_address)}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                    <small className={styles.addedAt}>
                      Added: {new Date(wallet.added_at).toLocaleDateString()}
                    </small>
                    {wallet.balance !== undefined && (
                      <small style={{ color: '#667eea', fontWeight: 'bold' }}>
                        Ξ {parseFloat(wallet.balance).toFixed(4)} ETH
                      </small>
                    )}
                    {wallet.tokenBalance !== undefined && (
                      <small style={{ color: '#764ba2', fontWeight: 'bold' }}>
                        🎫 {parseFloat(wallet.tokenBalance).toFixed(4)} SIMPLE
                      </small>
                    )}
                  </div>
                </div>
                <div className={styles.walletActions}>
                  <button
                    onClick={() => copyToClipboard(wallet.wallet_address)}
                    className={styles.copyBtn}
                    title="Copy address"
                  >
                    📋
                  </button>
                  <Link
                    to="/transfer"
                    state={{ wallet_address: wallet.wallet_address }}
                    className={styles.transferBtn}
                  >
                    Send
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletList;
