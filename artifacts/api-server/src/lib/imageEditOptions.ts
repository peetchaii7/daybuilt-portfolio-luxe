export type ProviderImageSize = '1024x1024' | '1536x1024' | '1024x1536';

export function buildImageEditOptions(
  _keepLayout: string | null | undefined,
  size: ProviderImageSize,
) {
  return {
    // The customer's room, camera and architecture are immutable in every
    // mode. The alternate mode may re-plan furniture only, so lowering input
    // fidelity there would contradict the original-room lock.
    inputFidelity: 'high' as const,
    size,
    quality: 'high' as const,
  };
}
