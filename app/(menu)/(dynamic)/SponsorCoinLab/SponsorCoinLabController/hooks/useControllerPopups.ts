'use client';

import { useCallback, useRef, useState } from 'react';

type ValidationPopupOptions = {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
};

export function useControllerPopups() {
  const [invalidFieldIds, setInvalidFieldIds] = useState<string[]>([]);
  const [validationPopupFields, setValidationPopupFields] = useState<string[]>([]);
  const [validationPopupMessage, setValidationPopupMessage] = useState(
    'Fill in the following fields before executing the method:',
  );
  const [validationPopupTitle, setValidationPopupTitle] = useState('Missing Required Fields');
  const [validationPopupConfirmLabel, setValidationPopupConfirmLabel] = useState('');
  const [validationPopupCancelLabel, setValidationPopupCancelLabel] = useState('Close');
  const validationPopupConfirmRef = useRef<(() => void | Promise<void>) | null>(null);
  const [isDiscardChangesPopupOpen, setIsDiscardChangesPopupOpen] = useState(false);
  const discardChangesConfirmRef = useRef<(() => void | Promise<void>) | null>(null);

  const clearInvalidField = useCallback((fieldId: string) => {
    if (!fieldId) return;
    setInvalidFieldIds((prev) => prev.filter((entry) => entry !== fieldId));
  }, []);

  const clearValidationPopup = useCallback(() => {
    setValidationPopupFields([]);
    setValidationPopupTitle('Missing Required Fields');
    setValidationPopupMessage('Fill in the following fields before executing the method:');
    setValidationPopupConfirmLabel('');
    setValidationPopupCancelLabel('Close');
    validationPopupConfirmRef.current = null;
  }, []);

  const showValidationPopup = useCallback(
    (
      fieldIds: string[],
      labels: string[],
      message?: string,
      options?: ValidationPopupOptions,
    ) => {
      setInvalidFieldIds(fieldIds);
      setValidationPopupFields(labels);
      setValidationPopupTitle(options?.title || 'Missing Required Fields');
      setValidationPopupMessage(message || 'Fill in the following fields before executing the method:');
      setValidationPopupConfirmLabel(options?.confirmLabel || '');
      setValidationPopupCancelLabel(options?.cancelLabel || 'Close');
      validationPopupConfirmRef.current = options?.onConfirm || null;
      if (typeof window !== 'undefined' && fieldIds[0]) {
        window.setTimeout(() => {
          const target = document.querySelector(`[data-field-id="${fieldIds[0]}"]`) as
            | HTMLInputElement
            | HTMLSelectElement
            | null;
          target?.focus();
        }, 0);
      }
    },
    [],
  );

  const handleValidationConfirm = useCallback(() => {
    const confirmAction = validationPopupConfirmRef.current;
    clearValidationPopup();
    void confirmAction?.();
  }, [clearValidationPopup]);

  const clearDiscardChangesPopup = useCallback(() => {
    setIsDiscardChangesPopupOpen(false);
    discardChangesConfirmRef.current = null;
  }, []);

  const openDiscardChangesPopup = useCallback((action: () => void | Promise<void>) => {
    discardChangesConfirmRef.current = action;
    setIsDiscardChangesPopupOpen(true);
  }, []);

  const handleDiscardConfirm = useCallback(() => {
    const confirmAction = discardChangesConfirmRef.current;
    clearDiscardChangesPopup();
    void confirmAction?.();
  }, [clearDiscardChangesPopup]);

  return {
    invalidFieldIds,
    setInvalidFieldIds,
    clearInvalidField,
    validationPopupFields,
    validationPopupMessage,
    validationPopupTitle,
    validationPopupConfirmLabel,
    validationPopupCancelLabel,
    showValidationPopup,
    clearValidationPopup,
    handleValidationConfirm,
    hasValidationConfirmAction: Boolean(validationPopupConfirmRef.current),
    isDiscardChangesPopupOpen,
    openDiscardChangesPopup,
    clearDiscardChangesPopup,
    handleDiscardConfirm,
  };
}
