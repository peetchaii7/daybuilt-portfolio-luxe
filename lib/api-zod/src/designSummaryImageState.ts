export type DesignImagePresentation =
  | "comparison"
  | "generated-only"
  | "source-only"
  | "loading"
  | "error";

export interface DesignImageStateInput {
  sourceReady: boolean;
  generatedReady: boolean;
  sourceLoading: boolean;
  generatedLoading: boolean;
  sourceError: boolean;
  generatedError: boolean;
  generatedExpected: boolean;
  sourceExpected: boolean;
}

/**
 * Decide what can truthfully be shown from the protected image fetches.
 *
 * Generation status alone is not evidence that either protected image is
 * renderable. Each image must load successfully before it is presented.
 */
export function getDesignImagePresentation(
  input: DesignImageStateInput,
): DesignImagePresentation {
  if (input.sourceReady && input.generatedReady) return "comparison";
  if (input.generatedReady) return "generated-only";
  if (input.sourceReady) return "source-only";

  if (
    input.sourceLoading ||
    input.generatedLoading ||
    (!input.sourceError && input.sourceExpected && !input.sourceReady) ||
    (!input.generatedError && input.generatedExpected && !input.generatedReady)
  ) {
    return "loading";
  }

  return "error";
}