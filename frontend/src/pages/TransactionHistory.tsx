import React, { useState, useEffect } from 'react';
import { transactionAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import styles from './Wallet.module.css';

interface Transaction {
  id: number;
  tx_hash: string;
  from_address: string;
  to_address: string;
  amount: string;
  token_address: string | null;
  type: string;
  status: string;
  created_at: string;
}

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;

  useEffect(() => {
    fetchTransactions();
  }, [offset]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await transactionAPI.history(limit, offset);
      setTransactions(response.data.transactions);
      setHasMore(response.data.pagination.hasMore);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Transaction History</h1>

        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

        {loading && <LoadingSpinner message="Loading transactions..." />}

        {!loading && transactions.length === 0 && (
          <p style={{ textAlign: 'center', color: '#999' }}>No transactions yet</p>
        )}

        {!loading && transactions.length > 0 && (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>From</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>To</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem' }}>Amount</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>TX Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.75rem' }}>{formatDate(tx.created_at)}</td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        <a href={`https://sepolia.etherscan.io/address/${tx.from_address}`} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#667eea', textDecoration: 'none' }}>
                          {formatAddress(tx.from_address)}
                        </a>
                      </td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        <a href={`https://sepolia.etherscan.io/address/${tx.to_address}`} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#667eea', textDecoration: 'none' }}>
                          {formatAddress(tx.to_address)}
                        </a>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {tx.amount} {tx.token_address ? 'tokens' : 'ETH'}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          backgroundColor: tx.status === 'success' ? '#d4edda' : '#fff3cd',
                          color: tx.status === 'success' ? '#155724' : '#856404'
                        }}>
                          {tx.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <a href={`https://sepolia.etherscan.io/tx/${tx.tx_hash}`} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#667eea', textDecoration: 'none', fontSize: '0.85rem' }}>
                          View →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                style={{ padding: '0.5rem 1rem', cursor: offset === 0 ? 'not-allowed' : 'pointer', opacity: offset === 0 ? 0.5 : 1 }}
              >
                ← Previous
              </button>
              <span>Page {Math.floor(offset / limit) + 1}</span>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={!hasMore}
                style={{ padding: '0.5rem 1rem', cursor: !hasMore ? 'not-allowed' : 'pointer', opacity: !hasMore ? 0.5 : 1 }}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
