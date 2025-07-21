// File: components/containers/AssetSelectScrollPanels/BaseScrollPanel.tsx

'use client';

import styles from '@/styles/Modal.module.css';

export default function BaseScrollPanel({
  id,
  children
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className={styles.baseSelectPanel}>
      <div className={`${styles.modalBox} flex flex-col h-screen min-h-0`}>
        {children}
      </div>
    </div>
  );
}
