import { ListModal } from '@/components/modals';

type Props = {
  fields: string[];
  message: string;
  buttonStyle: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  title?: string;
  cancelLabel?: string;
};

export default function ValidationPopup({
  fields,
  message,
  buttonStyle,
  onClose,
  onConfirm,
  confirmLabel,
  title,
  cancelLabel,
}: Props) {
  if (
    fields.length === 0 &&
    !onConfirm &&
    (!message.trim() || message === 'Fill in the following fields before executing the method:')
  ) {
    return null;
  }

  return (
    <ListModal
      isOpen
      title={title || 'Missing Required Fields'}
      message={message}
      items={fields}
      onClose={onClose}
      onConfirm={onConfirm}
      closeLabel={cancelLabel || 'Close'}
      confirmLabel={confirmLabel || 'Continue'}
      closeButtonClassName={buttonStyle}
      titleClassName="text-lg font-semibold text-red-400"
    />
  );
}
