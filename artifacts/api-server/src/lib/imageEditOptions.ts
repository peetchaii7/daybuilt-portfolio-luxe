export type ProviderImageSize = '1024x1024' | '1536x1024' | '1024x1536';

export function buildImageEditOptions(
  keepLayout: string | null | undefined,
  size: ProviderImageSize,
) {
  return {
    inputFidelity: keepLayout === 'no' ? ('low' as const) : ('high' as const),
    size,
    quality: 'high' as const,
  };
}
