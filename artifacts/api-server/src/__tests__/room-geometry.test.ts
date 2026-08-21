import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { buildDesignPrompt, buildPromptSummary } from '../lib/designPrompt';
import { buildImageEditOptions } from '../lib/imageEditOptions';
import {
  planRoomImage,
  prepareRoomImage,
  restoreRoomAspectRatio,
} from '../lib/roomImageGeometry';

describe('room image geometry', () => {
  it.each([
    [1600, 900, '1536x1024'],
    [900, 1600, '1024x1536'],
    [1200, 1100, '1024x1024'],
  ] as const)(
    'chooses the closest provider canvas for %sx%s',
    (width, height, expected) => {
      const plan = planRoomImage(width, height);
      expect(plan.providerSize).toBe(expected);
      expect(plan.contentWidth).toBeLessThanOrEqual(plan.providerWidth);
      expect(plan.contentHeight).toBeLessThanOrEqual(plan.providerHeight);
      expect(plan.contentWidth / plan.contentHeight).toBeCloseTo(
        width / height,
        2,
      );
    },
  );

  it('applies EXIF orientation before planning the provider canvas', async () => {
    const portraitStoredAsLandscape = await sharp({
      create: {
        width: 1200,
        height: 800,
        channels: 3,
        background: '#a07040',
      },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();

    const { plan, buffer } = await prepareRoomImage(portraitStoredAsLandscape);
    const prepared = await sharp(buffer).metadata();

    expect(plan.sourceWidth).toBe(800);
    expect(plan.sourceHeight).toBe(1200);
    expect(plan.providerSize).toBe('1024x1536');
    expect(prepared.width).toBe(1024);
    expect(prepared.height).toBe(1536);
    expect(prepared.orientation).toBeUndefined();
  });

  it('restores the exact source aspect ratio by removing only added padding', async () => {
    const source = await sharp({
      create: {
        width: 1400,
        height: 700,
        channels: 3,
        background: { r: 220, g: 80, b: 40 },
      },
    })
      .png()
      .toBuffer();
    const { buffer: prepared, plan } = await prepareRoomImage(source);
    const restored = await restoreRoomAspectRatio(prepared, plan);
    const metadata = await sharp(restored).metadata();
    const { data, info } = await sharp(restored)
      .raw()
      .toBuffer({ resolveWithObject: true });

    expect(metadata.width).toBe(1400);
    expect(metadata.height).toBe(700);
    expect(metadata.width! / metadata.height!).toBe(2);

    // The source colour reaches every restored edge; padding was removed and
    // no room content was cropped away.
    const edgeOffsets = [
      0,
      (info.width - 1) * info.channels,
      (info.height - 1) * info.width * info.channels,
      (info.height * info.width - 1) * info.channels,
    ];
    for (const offset of edgeOffsets) {
      expect(data[offset]).toBeGreaterThan(200);
      expect(data[offset + 1]).toBeLessThan(100);
    }
  });

  it('supports a different provider resolution when its aspect ratio is unchanged', async () => {
    const source = await sharp({
      create: {
        width: 1200,
        height: 800,
        channels: 3,
        background: '#735c42',
      },
    })
      .png()
      .toBuffer();
    const { buffer: prepared, plan } = await prepareRoomImage(source);
    const smallerSameRatio = await sharp(prepared)
      .resize(768, 512, { fit: 'fill' })
      .png()
      .toBuffer();
    const restored = await restoreRoomAspectRatio(smallerSameRatio, plan);
    const metadata = await sharp(restored).metadata();

    expect(metadata.width).toBe(1200);
    expect(metadata.height).toBe(800);
  });

  it('fails safely instead of stretching when provider aspect ratio differs', async () => {
    const source = await sharp({
      create: {
        width: 1600,
        height: 900,
        channels: 3,
        background: '#735c42',
      },
    })
      .png()
      .toBuffer();
    const { buffer: prepared, plan } = await prepareRoomImage(source);
    const unexpectedSquare = await sharp(prepared)
      .resize(1024, 1024, { fit: 'fill' })
      .png()
      .toBuffer();

    await expect(
      restoreRoomAspectRatio(unexpectedSquare, plan),
    ).rejects.toThrow('refusing to distort room geometry');
  });
});

describe('generation fidelity settings', () => {
  it('uses high input fidelity in every furniture-layout mode', () => {
    expect(buildImageEditOptions('yes', '1536x1024')).toEqual({
      inputFidelity: 'high',
      size: '1536x1024',
      quality: 'high',
    });
    expect(buildImageEditOptions('no', '1024x1536').inputFidelity).toBe('high');
  });
});

describe('room-edit prompt', () => {
  it('makes structure and camera preservation dominant in Keep Layout mode', () => {
    const prompt = buildDesignPrompt({ keepLayout: 'yes' });
    expect(prompt).toContain('primary structural and composition reference');
    expect(prompt).toContain('Preserve the exact perspective');
    expect(prompt).toContain('field of view');
    expect(prompt).toContain('horizon line, vanishing points and perspective lines');
    expect(prompt).toContain('exact crop, framing boundaries');
    expect(prompt).toContain('window, door, column, beam, opening');
    expect(prompt).toContain('Make no structural changes');
    expect(prompt).toContain('Perform furniture insertion only');
    expect(prompt).toContain('accuracy has priority over visual drama');
  });

  it('allows furniture re-planning without unlocking the room or camera', () => {
    const prompt = buildDesignPrompt({ keepLayout: 'no' });
    expect(prompt).toContain('permits furniture-layout changes only');
    expect(prompt).toContain('re-plan only the placement and composition');
    expect(prompt).toContain('never applies to the camera, framing, architecture');
    expect(prompt).toContain('Perform furniture insertion only');
    expect(prompt).toContain('vanishing points');
  });

  it('carries the Buddhist altar shelf selection into the prompt and summary', () => {
    const input = { builtInType: 'หิ้งพระ', keepLayout: 'yes' };
    expect(buildDesignPrompt(input)).toContain(
      '- Built-in work to design: หิ้งพระ',
    );
    expect(buildPromptSummary(input)).toContain('หิ้งพระ');
  });
});
