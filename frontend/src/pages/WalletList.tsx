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
  ETH?: string;
  SIMPLE?: string;
}

const WalletList: React.FC = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [walletLabel, setWalletLabel] = useState('');
  const [creatingWallet, setCreatingWallet] = useState(false);

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

  const createNewWallet = async () => {
    if (creatingWallet) return;

    setCreatingWallet(true);
    setError('');
    try {
      const response = await walletAPI.create(walletLabel || undefined);
      setWallets([...wallets, response.data.wallet]);
      setShowCreateModal(false);
      setWalletLabel('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create wallet');
    } finally {
      setCreatingWallet(false);
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setShowCreateModal(true)}
              className={styles.primaryBtn}
              style={{ cursor: 'pointer' }}
            >
              + Create Wallet
            </button>
            <Link to="/wallets/import" className={styles.primaryBtn}>
              + Import Wallet
            </Link>
          </div>
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
                    {wallet.ETH !== undefined && (
                      <small style={{ color: '#667eea', fontWeight: 'bold' }}>
                        Ξ {parseFloat(wallet.ETH).toFixed(4)} ETH
                      </small>
                    )}
                    {wallet.SIMPLE !== undefined && (
                      <small style={{ color: '#764ba2', fontWeight: 'bold' }}>
                        🎫 {parseFloat(wallet.SIMPLE).toFixed(4)} SIMPLE
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

        {showCreateModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}>
              <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Create New Wallet</h2>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="newWalletLabel" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Wallet Label (Optional)
                </label>
                <input
                  id="newWalletLabel"
                  type="text"
                  value={walletLabel}
                  onChange={(e) => setWalletLabel(e.target.value)}
                  placeholder="e.g., My Savings Wallet"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                  disabled={creatingWallet}
                />
              </div>

              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                A new wallet will be created and securely stored. Make sure to save your seed phrase if needed.
              </p>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setWalletLabel('');
                  }}
                  disabled={creatingWallet}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#f5f5f5',
                    cursor: creatingWallet ? 'not-allowed' : 'pointer',
                    opacity: creatingWallet ? 0.6 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={createNewWallet}
                  disabled={creatingWallet}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    cursor: creatingWallet ? 'not-allowed' : 'pointer',
                    opacity: creatingWallet ? 0.6 : 1,
                    fontWeight: '500',
                  }}
                >
                  {creatingWallet ? 'Creating...' : 'Create Wallet'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletList;
