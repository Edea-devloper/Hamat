import * as React from 'react';
import styles from './JobShareModal.module.scss';

export interface IShareJobModalProps {
  isOpen: boolean;
  jobId: number | string;
  senderMail: string; // logged-in user email
  onClose: () => void;
  flowAPIUrl: string;
}


const ShareJobModal: React.FC<IShareJobModalProps> = ({
  isOpen,
  jobId,
  senderMail,
  onClose,
  flowAPIUrl
}) => {
  const [email, setEmail] = React.useState('');
  const [isValid, setIsValid] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // const FLOW_URL =
  //   'https://defaultc58d5722294e42379bfede1fe4913b.f9.environment.api.powerplatform.com/powerautomate/automations/direct/workflows/567ea71454cf4189a3e1c330be3fa1da/triggers/manual/paths/invoke';

  const FLOW_URL = flowAPIUrl;

  if (!isOpen) return null;

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setIsValid(validateEmail(value) || value.length === 0);
  };

  // const onSend = async () => {
  //   if (!validateEmail(email)) {
  //     setIsValid(false);
  //     return;
  //   }

  //   setIsSubmitting(true);

  //   try {
  //     const url =
  //       `${FLOW_URL}` +
  //       `?api-version=1` +
  //       `&sp=%2Ftriggers%2Fmanual%2Frun` +
  //       `&sv=1.0` +
  //       `&sig=i4fFEDQpQWUEZEUJVm8mvO-rJeFLhDeTXUoM7Mimk6U`+
  //       `&SenderMail=${encodeURIComponent(senderMail)}` +
  //       `&SharedMail=${encodeURIComponent(email)}` +
  //       `&CareerID=${encodeURIComponent(jobId)}`;

  //     await fetch(url, {
  //       method: 'POST'
  //     });

  //     setEmail('');
  //     onClose();
  //   } catch (error) {
  //     console.error('Share Job failed', error);
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const onSend = async () => {
    if (!validateEmail(email)) {
      setIsValid(false);
      return;
    }

    setIsSubmitting(true);

    try {
      const url =
        `${FLOW_URL}` +
        `?api-version=1` +
        `&sp=%2Ftriggers%2Fmanual%2Frun` +
        `&sv=1.0` +
        `&sig=i4fFEDQpQWUEZEUJVm8mvO-rJeFLhDeTXUoM7Mimk6U` +
        `&SenderMail=${encodeURIComponent(senderMail)}` +
        `&SharedMail=${encodeURIComponent(email)}` +
        `&CareerID=${encodeURIComponent(jobId)}`;

      await fetch(url, {
        method: 'GET'
      });

      setEmail('');
      onClose();
    } catch (error) {
      console.error('Share Job failed', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} dir="rtl">
        <div className={styles.header}>
          <span>שיתוף משרה</span>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <label className={styles.label}>אימייל</label>
          <input
            type="email"
            value={email}
            onChange={onEmailChange}
            placeholder="אנא הקלד מייל לשיתוף"
            className={`${styles.input} ${!isValid ? styles.error : ''}`}
          />
          {!isValid && (
            <span className={styles.errorText}>
              נא להזין כתובת אימייל תקינה
            </span>
          )}
        </div>

        <div className={styles.footer}>
          <button
            className={styles.sendButton}
            onClick={onSend}
            disabled={!validateEmail(email) || isSubmitting}
          >
            {isSubmitting ? 'שולח...' : 'שלח'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareJobModal;
