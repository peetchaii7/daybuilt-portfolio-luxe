import { describe, expect, it } from 'vitest';

import { getDesignImagePresentation } from '@workspace/api-zod';

const base = {
  sourceReady: false,
  generatedReady: false,
  sourceLoading: false,
  generatedLoading: false,
  sourceError: false,
  generatedError: false,
  generatedExpected: true,
  sourceExpected: true,
};

describe('Design Summary protected image presentation', () => {
  it('uses comparison only after both protected images render', () => {
    expect(
      getDesignImagePresentation({
        ...base,
        sourceReady: true,
        generatedReady: true,
      }),
    ).toBe('comparison');
  });

  it('keeps the AI render visible when the source image fails', () => {
    expect(
      getDesignImagePresentation({
        ...base,
        generatedReady: true,
        sourceError: true,
      }),
    ).toBe('generated-only');
  });

  it('keeps the source visible while the AI render is unavailable', () => {
    expect(
      getDesignImagePresentation({
        ...base,
        sourceReady: true,
        generatedError: true,
      }),
    ).toBe('source-only');
  });

  it('shows loading while an expected image is still being fetched', () => {
    expect(
      getDesignImagePresentation({
        ...base,
        generatedLoading: true,
      }),
    ).toBe('loading');
  });

  it('shows an error instead of claiming the result is ready', () => {
    expect(
      getDesignImagePresentation({
        ...base,
        sourceError: true,
        generatedError: true,
      }),
    ).toBe('error');
  });

  it('shows an error when a completed response has no image URLs', () => {
    expect(
      getDesignImagePresentation({
        ...base,
        sourceExpected: false,
        generatedExpected: false,
      }),
    ).toBe('error');
  });
});