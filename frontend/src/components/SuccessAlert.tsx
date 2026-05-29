import React, { useEffect } from 'react';
import styles from './Alert.module.css';

interface Props {
  message: string;
  onDismiss: () => void;
  duration?: number;
}

const SuccessAlert: React.FC<Props> = ({ message, onDismiss, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  return (
    <div className={`${styles.alert} ${styles.success}`}>
      <span>{message}</span>
      <button onClick={onDismiss} className={styles.dismissBtn}>
        ×
      </button>
    </div>
  );
};

export default SuccessAlert;
