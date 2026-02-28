export const TOKEN_REGISTRY_UPDATED_EVENT = 'spcoin:token-registry-updated';

export function emitTokenRegistryUpdated(chainId: number, address: string) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent(TOKEN_REGISTRY_UPDATED_EVENT, {
      detail: { chainId, address },
    }),
  );
}
