import React from 'react';
import styles from './Alert.module.css';

interface Props {
  message: string;
  onDismiss: () => void;
}

const ErrorAlert: React.FC<Props> = ({ message, onDismiss }) => {
  return (
    <div className={`${styles.alert} ${styles.error}`}>
      <span>{message}</span>
      <button onClick={onDismiss} className={styles.dismissBtn}>
        ×
      </button>
    </div>
  );
};

export default ErrorAlert;
