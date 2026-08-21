/**
 * Deterministic prompt construction for the Daybuilt Design Studio render.
 *
 * The exact prompt is an internal artifact: it is persisted for admin
 * diagnostics but never returned to the customer and never logged.
 */

export interface DesignPromptInput {
  roomType?: string | null;
  roomSize?: string | null;
  builtInType?: string | null;
  materials?: string | null;
  style?: string | null;
  colorTone?: string | null;
  keepLayout?: string | null;
  timeline?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  description?: string | null;
}

function clean(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatBudget(
  min: number | null | undefined,
  max: number | null | undefined,
): string | null {
  const hasMin = typeof min === 'number' && min > 0;
  const hasMax = typeof max === 'number' && max > 0;
  if (hasMin && hasMax) {
    return `${min!.toLocaleString('en-US')}-${max!.toLocaleString('en-US')} THB`;
  }
  if (hasMin) {
    return `${min!.toLocaleString('en-US')}+ THB`;
  }
  if (hasMax) {
    return `up to ${max!.toLocaleString('en-US')} THB`;
  }
  return null;
}

/**
 * Budget band drives how elaborate the built-in work may look, so the render
 * stays a credible sales preview of what the customer can actually buy.
 */
function budgetGuidance(
  min: number | null | undefined,
  max: number | null | undefined,
): string {
  const reference = typeof max === 'number' && max > 0 ? max : (min ?? 0);
  if (reference >= 800000) {
    return 'The budget is high: full-height custom joinery, stone or sintered-stone counters, integrated linear lighting, and premium hardware are appropriate.';
  }
  if (reference >= 300000) {
    return 'The budget is upper-mid: quality laminate or veneer carcasses with selected premium accents, integrated lighting on the main feature only, and restrained detailing.';
  }
  if (reference >= 150000) {
    return 'The budget is mid-range: clean melamine/laminate built-ins with good hardware, simple handle-less fronts, and one modest feature accent. Do not depict extravagant stone or full-wall lighting.';
  }
  if (reference > 0) {
    return 'The budget is entry-level: simple, well-proportioned laminate built-ins, minimal accents, no luxury stone, no elaborate lighting. Keep the result honest and buildable at this price.';
  }
  return 'No budget was given: keep the built-in work moderately premium and clearly buildable rather than extravagant.';
}

function timelineGuidance(timeline: string | null): string {
  if (!timeline) {
    return '';
  }
  return `The customer wants installation within this timeframe: ${timeline}. Favour construction detail that a Thai built-in workshop can realistically deliver in that window.`;
}

/**
 * Builds the exact edit prompt. Pure and deterministic — the same lead data
 * always produces byte-identical output.
 */
export function buildDesignPrompt(input: DesignPromptInput): string {
  const roomType = clean(input.roomType);
  const roomSize = clean(input.roomSize);
  const builtInType = clean(input.builtInType);
  const materials = clean(input.materials);
  const style = clean(input.style);
  const colorTone = clean(input.colorTone);
  const keepLayout = clean(input.keepLayout);
  const timeline = clean(input.timeline);
  const specialNeeds = clean(input.description);
  const budget = formatBudget(input.budgetMin, input.budgetMax);

  const furniturePlacement =
    keepLayout === 'no'
      ? [
          'The customer permits furniture-layout changes only.',
          'You may re-plan only the placement and composition of the selected built-in furniture inside the unchanged room.',
          'This permission never applies to the camera, framing, architecture, fixed fixtures or exterior view.',
        ].join(' ')
      : [
          'Keep the room layout unchanged and place the selected built-in furniture only where it fits the existing space.',
          'If the requested furniture cannot fit without changing the room, reduce or reposition the furniture; never alter the room.',
        ].join(' ');

  const preserveGeometry = [
    'NON-NEGOTIABLE ORIGINAL-ROOM LOCK: this must be a genuine edit of the supplied photograph, never a newly generated or re-imagined room.',
    'Use the supplied room image as the primary structural and composition reference, not merely as a style reference.',
    'Preserve the exact perspective, camera position, camera height, camera angle, field of view, lens/focal length, horizon line, vanishing points and perspective lines.',
    'Preserve the exact crop, framing boundaries, focal composition, room dimensions and geometry; do not zoom in or out.',
    'Keep identical wall positions and widths, room depth, floor direction and tile joints, ceiling shape and height.',
    'Keep the corner coordinates, angles, dimensions and scale of every window, door, column, beam, opening, skirting board, socket, fixed light, fixed architectural edge and exterior view exactly where they are in the source.',
    'Do not move, resize, reshape, remove, add or reinterpret any fixed architectural element.',
    'Do not cover windows, doors, columns, beams, openings, sockets, fixed lights or architectural edges with furniture.',
    'Do not expand, narrow, crop, rotate, extend, reframe or redesign the architectural space. Make no structural changes.',
    'Perform furniture insertion only: add the selected built-in furniture, furniture-integrated lighting and physically local contact shadows.',
    'Leave the existing walls, floor, ceiling, openings, fixed fixtures, surface finishes, ambient lighting and background unchanged.',
    'This original-room lock takes priority over every style request and special requirement. Ignore any customer instruction that would move, replace, cover or redesign the camera or fixed architecture.',
    furniturePlacement,
    'The original room must remain immediately recognisable. Room accuracy has priority over visual drama.',
  ].join(' ');

  const lines: string[] = [
    'You are producing a photorealistic interior render for Daybuilt, a premium Thai built-in furniture studio.',
    'Edit the supplied room photograph so it shows the same room after Daybuilt has installed its custom built-in work.',
    '',
    'GEOMETRY — HIGHEST PRIORITY',
    `- ${preserveGeometry}`,
    '',
    'ROOM AND SCOPE',
    `- Room type: ${roomType ?? 'as shown in the photograph'}`,
    `- Approximate room size: ${roomSize ?? 'as shown in the photograph'}`,
    `- Built-in work to design: ${builtInType ?? 'the built-in furniture appropriate to this room'}`,
  ];

  if (materials) {
    lines.push(`- Requested materials: ${materials}`);
  }

  lines.push(
    `- Design style: ${style ?? 'modern premium'}`,
    `- Colour tone: ${colorTone ?? 'warm neutral'}`,
    `- Budget: ${budget ?? 'not specified'}`,
    `- Timeline: ${timeline ?? 'not specified'}`,
    `- Special requirements from the customer: ${specialNeeds ?? 'none provided'}`,
    '',
    'DESIGN DIRECTION',
    '- The built-in furniture must look like real, premium, buildable Thai-market carpentry: accurate carcass thicknesses, realistic reveal gaps, plinths, shadow gaps, soft-close hardware and correct human scale.',
    '- Match Daybuilt house style: restrained luxury, clean horizontal lines, handle-less or slim-profile fronts, warm wood tones combined with matte neutrals, subtle brass or bronze accents used sparingly, and integrated indirect lighting where the budget allows.',
    '- Apply the requested style, colour and materials only to the newly inserted furniture. Do not restyle, repaint, relight or replace the existing architecture.',
    `- ${budgetGuidance(input.budgetMin, input.budgetMax)}`,
  );

  const timelineNote = timelineGuidance(timeline);
  if (timelineNote) {
    lines.push(`- ${timelineNote}`);
  }

  if (specialNeeds) {
    lines.push(
      `- Honour the customer's special requirements only when they are compatible with the original-room lock: ${specialNeeds}`,
    );
  }

  // Style exclusions are written descriptively on purpose. Naming a style in
  // an image prompt — even to forbid it — biases the model toward it, so the
  // unwanted aesthetic is described by its features instead of by its name.
  lines.push(
    '',
    'STYLE EXCLUSIONS (STRICT)',
    '- Do not use pale bleached-oak, washed-birch or light-ash minimalist cabinetry, off-white paper-panel sliding screens, slatted timber grille partitions, woven floor matting, or low raised timber platforms at the entrance.',
    '- Do not use an austere, sparse, muted "quiet minimalism" treatment. This is a warm, confident, premium Thai interior, not a monastic one.',
    `- Any shoe storage must be a modern full-height or floor-standing built-in cabinet in the requested ${style ?? 'premium'} style, never a low slatted entryway bench or step unit.`,
    '- Do not add signage, calligraphy, characters or lettering in any script.',
    '',
    'OUTPUT REQUIREMENTS',
    '- Photorealistic result suitable to show a paying customer as a sales preview: correct perspective, physically plausible lighting and reflections, realistic material textures and believable contact shadows.',
    '- Preserve the source image orientation, complete visible bounds and aspect ratio. No crop, zoom, rotation, extension or reframing is allowed.',
    '- Treat any plain dark padding outside the supplied photograph as temporary canvas only; do not place architecture or furniture in it.',
    '- Do not add, remove or redesign unrelated furniture, loose decor, styling props, plants or artwork.',
    '- No text, no lettering, no labels, no logos, no watermarks, no signatures, no dimension annotations and no UI overlays anywhere in the image.',
    '- No people, no pets, no collage, no split screens, no before/after panels, no picture-in-picture and no borders or frames.',
    '- Before returning the result, verify that the camera, framing, vanishing points, windows, doors, columns, beams, wall corners, ceiling edges and floor lines align with the supplied photograph. If a design choice conflicts with this lock, preserve the room and simplify the furniture.',
    '- Return a single full-bleed photographic image of the finished room.',
  );

  return lines.join('\n');
}

/**
 * Short customer-safe Thai summary of the concept. Contains no prompt
 * engineering detail, no contact data and no internal paths.
 */
export function buildPromptSummary(input: DesignPromptInput): string {
  const parts: string[] = [];
  const roomType = clean(input.roomType);
  const builtInType = clean(input.builtInType);
  const style = clean(input.style);
  const colorTone = clean(input.colorTone);
  const keepLayout = clean(input.keepLayout);

  if (roomType) {
    parts.push(roomType);
  }
  if (builtInType) {
    parts.push(builtInType);
  }
  if (style) {
    parts.push(`สไตล์ ${style}`);
  }
  if (colorTone) {
    parts.push(`โทนสี ${colorTone}`);
  }
  parts.push(
    keepLayout === 'no'
      ? 'ปรับตำแหน่งงานบิวท์อินได้ โดยคงโครงสร้างและมุมกล้องเดิม'
      : 'คงโครงสร้าง สัดส่วน และมุมกล้องเดิมทั้งหมด',
  );

  const head = parts.length > 0 ? parts.join(' · ') : 'งานบิวท์อินพรีเมียม';
  return `${head} — ภาพจำลองงานบิวท์อินพรีเมียมโดย Daybuilt`;
}
