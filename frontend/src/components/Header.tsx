import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Header.module.css';

const Header: React.FC = () => {
  const { isAuthenticated, userEmail, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          💰 Web3 Wallet
        </Link>
        <nav className={styles.nav}>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={styles.link}>
                Dashboard
              </Link>
              <Link to="/wallets/list" className={styles.link}>
                Wallets
              </Link>
              <Link to="/transfer" className={styles.link}>
                Transfer
              </Link>
              <div className={styles.userMenu}>
                <span className={styles.email}>{userEmail}</span>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.link}>
                Login
              </Link>
              <Link to="/register" className={styles.link}>
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
