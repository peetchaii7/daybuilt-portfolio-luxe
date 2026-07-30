import sharp from 'sharp';

export const MAX_SOURCE_PIXELS = 40_000_000;

export type ProviderImageSize =
  | '1024x1024'
  | '1536x1024'
  | '1024x1536';

export interface RoomImagePlan {
  sourceWidth: number;
  sourceHeight: number;
  providerWidth: number;
  providerHeight: number;
  providerSize: ProviderImageSize;
  contentLeft: number;
  contentTop: number;
  contentWidth: number;
  contentHeight: number;
}

const PROVIDER_SIZES = [
  { width: 1024, height: 1024, value: '1024x1024' as const },
  { width: 1536, height: 1024, value: '1536x1024' as const },
  { width: 1024, height: 1536, value: '1024x1536' as const },
];

/**
 * Chooses the closest supported provider canvas in log-ratio space, then fits
 * the complete room photo inside it. No source pixel is cropped or stretched.
 */
export function planRoomImage(
  sourceWidth: number,
  sourceHeight: number,
): RoomImagePlan {
  if (
    !Number.isInteger(sourceWidth) ||
    !Number.isInteger(sourceHeight) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0
  ) {
    throw new Error('Invalid source image dimensions');
  }

  const sourceRatio = sourceWidth / sourceHeight;
  const canvas = PROVIDER_SIZES.reduce((best, candidate) => {
    const bestDistance = Math.abs(
      Math.log(sourceRatio / (best.width / best.height)),
    );
    const candidateDistance = Math.abs(
      Math.log(sourceRatio / (candidate.width / candidate.height)),
    );
    return candidateDistance < bestDistance ? candidate : best;
  });

  const scale = Math.min(
    canvas.width / sourceWidth,
    canvas.height / sourceHeight,
  );
  const contentWidth = Math.max(1, Math.round(sourceWidth * scale));
  const contentHeight = Math.max(1, Math.round(sourceHeight * scale));
  const contentLeft = Math.floor((canvas.width - contentWidth) / 2);
  const contentTop = Math.floor((canvas.height - contentHeight) / 2);

  return {
    sourceWidth,
    sourceHeight,
    providerWidth: canvas.width,
    providerHeight: canvas.height,
    providerSize: canvas.value,
    contentLeft,
    contentTop,
    contentWidth,
    contentHeight,
  };
}

export async function prepareRoomImage(
  source: Buffer,
): Promise<{ buffer: Buffer; plan: RoomImagePlan }> {
  const normalized = sharp(source, {
    failOn: 'error',
    limitInputPixels: MAX_SOURCE_PIXELS,
  }).rotate();
  const metadata = await normalized.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Source image dimensions are unavailable');
  }

  // metadata() reports stored dimensions. EXIF rotations 5-8 swap axes.
  const swapsAxes =
    metadata.orientation !== undefined && metadata.orientation >= 5;
  const sourceWidth = swapsAxes ? metadata.height : metadata.width;
  const sourceHeight = swapsAxes ? metadata.width : metadata.height;
  const initialPlan = planRoomImage(sourceWidth, sourceHeight);
  const { data: resized, info } = await normalized
    .resize(initialPlan.contentWidth, initialPlan.contentHeight, {
      fit: 'inside',
      kernel: sharp.kernel.lanczos3,
    })
    .removeAlpha()
    .png()
    .toBuffer({ resolveWithObject: true });
  const contentLeft = Math.floor(
    (initialPlan.providerWidth - info.width) / 2,
  );
  const contentTop = Math.floor(
    (initialPlan.providerHeight - info.height) / 2,
  );
  const plan: RoomImagePlan = {
    ...initialPlan,
    contentLeft,
    contentTop,
    contentWidth: info.width,
    contentHeight: info.height,
  };

  const buffer = await sharp(resized)
    .extend({
      top: plan.contentTop,
      bottom:
        plan.providerHeight - plan.contentHeight - plan.contentTop,
      left: plan.contentLeft,
      right:
        plan.providerWidth - plan.contentWidth - plan.contentLeft,
      background: { r: 24, g: 24, b: 24 },
    })
    .png()
    .toBuffer();

  return { buffer, plan };
}

/**
 * Removes only the temporary padding added by prepareRoomImage and restores
 * the normalized source aspect ratio. It never crops room content.
 */
export async function restoreRoomAspectRatio(
  generated: Buffer,
  plan: RoomImagePlan,
): Promise<Buffer> {
  const metadata = await sharp(generated, {
    failOn: 'error',
    limitInputPixels: MAX_SOURCE_PIXELS,
  }).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error('Generated image dimensions are unavailable');
  }

  const returnedRatio = metadata.width / metadata.height;
  const requestedRatio = plan.providerWidth / plan.providerHeight;
  const ratioError = Math.abs(returnedRatio / requestedRatio - 1);
  if (ratioError > 0.005) {
    throw new Error(
      'Image model returned an unexpected aspect ratio; refusing to distort room geometry',
    );
  }

  // A provider may return a different resolution with the same ratio. Use one
  // isotropic scale so crop coordinates can never stretch the room.
  const scale = metadata.width / plan.providerWidth;
  const expectedHeight = plan.providerHeight * scale;
  if (Math.abs(metadata.height - expectedHeight) > 2) {
    throw new Error(
      'Image model returned inconsistent dimensions; refusing to distort room geometry',
    );
  }

  const left = Math.max(0, Math.round(plan.contentLeft * scale));
  const top = Math.max(0, Math.round(plan.contentTop * scale));
  const width = Math.min(
    metadata.width - left,
    Math.max(1, Math.round(plan.contentWidth * scale)),
  );
  const height = Math.min(
    metadata.height - top,
    Math.max(1, Math.round(plan.contentHeight * scale)),
  );

  return sharp(generated)
    .extract({ left, top, width, height })
    .resize(plan.sourceWidth, plan.sourceHeight, {
      fit: 'contain',
      kernel: sharp.kernel.lanczos3,
      background: { r: 24, g: 24, b: 24 },
    })
    .png()
    .toBuffer();
}