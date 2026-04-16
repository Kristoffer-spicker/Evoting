import { MainMenuNavigation } from '@/components/main-menu-components/main-menu-comp';
import { QRCodeContent } from '@/components/qr-code-components/qr-code-comp';
import styles from '@/components/main-menu-components/main-menu-styled-comp/mainMenu.module.css';

const QRCode = () => {
  return (
    <div className={styles.mainMenuPage}>
      <MainMenuNavigation backPath="/" />
      <QRCodeContent />
    </div>
  );
};

export default QRCode;
