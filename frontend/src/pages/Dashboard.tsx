import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Dashboard.module.css';

const Dashboard: React.FC = () => {
  const { userEmail } = useAuth();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Welcome back! 👋</h1>
        <p className={styles.subtitle}>{userEmail}</p>

        <div className={styles.grid}>
          <Link to="/wallets/list" className={styles.card}>
            <div className={styles.icon}>💳</div>
            <h3>My Wallets</h3>
            <p>View and manage your imported wallets</p>
          </Link>

          <Link to="/wallets/import" className={styles.card}>
            <div className={styles.icon}>➕</div>
            <h3>Import Wallet</h3>
            <p>Add a new wallet using private key</p>
          </Link>

          <Link to="/transfer" className={styles.card}>
            <div className={styles.icon}>💸</div>
            <h3>Send Crypto</h3>
            <p>Transfer ETH or ERC20 tokens</p>
          </Link>

          <div className={styles.card + ' ' + styles.infoCard}>
            <div className={styles.icon}>ℹ️</div>
            <h3>Network</h3>
            <p>Connected to Hardhat local testnet</p>
          </div>
        </div>

        <div className={styles.infoBox}>
          <h2>Getting Started</h2>
          <ol className={styles.steps}>
            <li>Import your wallet using a private key</li>
            <li>View your wallet balance</li>
            <li>Send ETH or ERC20 tokens to any address</li>
            <li>Track all transactions</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
