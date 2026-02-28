export const ACCOUNT_REGISTRY_UPDATED_EVENT = 'spcoin:account-registry-updated';

export function emitAccountRegistryUpdated(address: string) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent(ACCOUNT_REGISTRY_UPDATED_EVENT, {
      detail: { address },
    }),
  );
}
