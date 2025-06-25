// File: components/shared/ScrollableDataList.tsx

'use client';

import React from 'react';
import styles from '@/styles/Modal.module.css';
import DataList from '@/components/Dialogs/Resources/DataList';
import { FEED_TYPE } from '@/lib/structure';

type ScrollableDataListProps<T> = {
  dataFeedType: FEED_TYPE;
  onSelect: (entry: T) => void;
};

// export default function ScrollableDataList<T>({
//   dataFeedType,
//   onSelect,
// }: ScrollableDataListProps<T>) {
//   return (
//     <div className={`${styles.modalScrollBar} ${styles.modalScrollBarHidden}`}>
//       <DataList<T> dataFeedType={dataFeedType} onSelect={onSelect} />
//     </div>
//   );
// }
