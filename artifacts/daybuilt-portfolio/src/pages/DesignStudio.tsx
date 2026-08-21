import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useSubmitLead, useStartLeadGeneration } from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
import { Check, X, Upload, Loader2, AlertCircle, RotateCcw, RotateCw } from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const ROOM_TYPES = [
  { id: "ห้องนั่งเล่น", th: "ห้องนั่งเล่น", en: "Living Room" },
  { id: "ห้องนอน", th: "ห้องนอน", en: "Bedroom" },
  { id: "ห้องครัว", th: "ห้องครัว", en: "Kitchen" },
  { id: "ห้องทำงาน", th: "ห้องทำงาน", en: "Home Office" },
  { id: "ห้องรับประทานอาหาร", th: "ห้องรับประทานอาหาร", en: "Dining Room" },
  { id: "ห้องน้ำ", th: "ห้องน้ำ", en: "Bathroom" },
  { id: "ห้องเด็ก", th: "ห้องเด็ก", en: "Kids Room" },
  { id: "พื้นที่อื่นๆ", th: "พื้นที่อื่นๆ", en: "Other" },
];

const ROOM_SIZES = [
  "น้อยกว่า 15 ตร.ม.",
  "15-30 ตร.ม.",
  "30-50 ตร.ม.",
  "50+ ตร.ม.",
];

const BUILT_IN_TYPES = [
  { id: "ครัวบิวท์อิน", th: "ครัวบิวท์อิน", en: "Built-in Kitchen" },
  { id: "ตู้เสื้อผ้า", th: "ตู้เสื้อผ้า", en: "Wardrobe" },
  { id: "ชั้นวางหนังสือ", th: "ชั้นวางหนังสือ", en: "Bookshelf" },
  { id: "ตู้โชว์", th: "ตู้โชว์", en: "Display Cabinet" },
  { id: "โต๊ะทำงานบิวท์อิน", th: "โต๊ะทำงานบิวท์อิน", en: "Study Desk" },
  { id: "ตู้รองเท้า", th: "ตู้รองเท้า", en: "Shoe Cabinet" },
  { id: "ตู้ทีวีและผนัง", th: "ตู้ทีวีและผนัง", en: "TV Wall" },
  { id: "หิ้งพระ", th: "หิ้งพระ", en: "Buddhist Altar Shelf" },
  { id: "อื่นๆ", th: "อื่นๆ", en: "Other" },
];

const STYLES = [
  { id: "Modern Luxury", label: "โมเดิร์นลักชัวรี", sub: "Modern Luxury", swatch: "from-zinc-700 to-black" },
  { id: "Minimal Luxury", label: "มินิมอลลักชัวรี", sub: "Minimal Luxury", swatch: "from-stone-200 to-stone-500" },
  { id: "Contemporary", label: "คอนเทมโพรารี", sub: "Contemporary", swatch: "from-slate-300 to-slate-700" },
  { id: "Warm Luxury", label: "วอร์มลักชัวรี", sub: "Warm Luxury", swatch: "from-amber-100 via-stone-400 to-amber-900" },
  { id: "Classic Modern", label: "คลาสสิกโมเดิร์น", sub: "Classic Modern", swatch: "from-neutral-200 via-neutral-500 to-neutral-900" },
  { id: "Luxury Dark", label: "ลักชัวรีดาร์ก", sub: "Luxury Dark", swatch: "from-stone-700 via-zinc-900 to-black" },
];

const COLOR_TONES = [
  { id: "Warm Neutral", label: "Warm Neutral", hex: "#e8d5b7" },
  { id: "Cool Gray", label: "Cool Gray", hex: "#c5c9d0" },
  { id: "Dark Wood", label: "Dark Wood", hex: "#6b4423" },
  { id: "Monochrome", label: "Monochrome", hex: "#2a2a2a" },
  { id: "Earthy Green", label: "Earthy Green", hex: "#6b7c5e" },
  { id: "Dusty Rose", label: "Dusty Rose", hex: "#c4967a" },
];

const BUDGET_OPTIONS = [
  { label: "50k – 150k", value: "50k-150k", min: 50000, max: 150000 },
  { label: "150k – 300k", value: "150k-300k", min: 150000, max: 300000 },
  { label: "300k – 500k", value: "300k-500k", min: 300000, max: 500000 },
  { label: "500k – 800k", value: "500k-800k", min: 500000, max: 800000 },
  { label: "800k+", value: "800k+", min: 800000, max: 0 },
];

const TIMELINE_OPTIONS = [
  "ทันที (ภายใน 1 เดือน)",
  "1-3 เดือน",
  "3-6 เดือน",
  "6 เดือนขึ้นไป",
  "ยังไม่แน่ใจ",
];

const TOTAL_STEPS = 7;

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex w-full items-center mb-10" aria-label={`ขั้นตอนที่ ${current} จาก ${TOTAL_STEPS}`}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const num = i + 1;
        const done = num < current;
        const active = num === current;
        return (
          <div key={num} className={`flex min-w-0 items-center ${num < TOTAL_STEPS ? "flex-1" : ""}`}>
            <div
              aria-current={active ? "step" : undefined}
              className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-medium border transition-all
                ${active ? "bg-[#c9a84c] text-black border-[#c9a84c]" : ""}
                ${done ? "border-[#c9a84c] text-[#c9a84c]" : ""}
                ${!active && !done ? "border-white/20 text-white/40" : ""}
              `}
            >
              {done ? <Check size={12} strokeWidth={2.5} /> : num}
            </div>
            {num < TOTAL_STEPS && (
              <div aria-hidden="true" className="mx-1 h-px min-w-1 flex-1 bg-[#c9a84c]/30" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DesignStudio() {
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step
  const [step, setStep] = useState(1);

  // Step 1 — Upload
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadProof, setUploadProof] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [normalizedFile, setNormalizedFile] = useState<File | null>(null);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [designRequestId] = useState(() => {
    const storageKey = "daybuilt_design_request_id";
    const existing = sessionStorage.getItem(storageKey);
    if (existing) return existing;
    const created = `${crypto.randomUUID()}${crypto.randomUUID()}`;
    sessionStorage.setItem(storageKey, created);
    return created;
  });

  // Step 2 — Room
  const [roomType, setRoomType] = useState("");
  const [roomSize, setRoomSize] = useState("");

  // Step 3 — Built-in
  const [builtInTypes, setBuiltInTypes] = useState<string[]>([]);

  // Step 4 — Style + Color
  const [style, setStyle] = useState("");
  const [colorTone, setColorTone] = useState("");

  // Step 5 — Layout + Budget + Timeline
  const [keepLayout, setKeepLayout] = useState<"yes" | "no">("yes");
  const [budgetValue, setBudgetValue] = useState("");
  const [timeline, setTimeline] = useState("");

  // Step 6 — Contact
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  // Step 7 — Generation state
  const [leadId, setLeadId] = useState<number | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState("");

  // Errors
  const [fieldError, setFieldError] = useState("");
  const [submitError, setSubmitError] = useState("");

  // Upload hook
  const { uploadFile, isUploading, progress, error: uploadError } = useUpload({
    onSuccess: (res: { objectPath: string; uploadURL: string; uploadProof: string; metadata: { name: string; size: number; contentType: string } }) => {
      setImageUrl(res.objectPath);
      setUploadProof(res.uploadProof);
    },
  });

  // Submit hook — mutate takes { data: LeadInput }
  const submitLead = useSubmitLead({
    mutation: {
      onSuccess: (data: { success: boolean; message: string; id: number; accessToken?: string }) => {
        setLeadId(data.id);
        if (data.accessToken) {
          setAccessToken(data.accessToken);
          sessionStorage.setItem(
            `daybuilt_lead_${data.id}`,
            JSON.stringify({ leadId: data.id, accessToken: data.accessToken }),
          );
        }
        sessionStorage.removeItem("daybuilt_design_request_id");
        setStep(7);
      },
      onError: (err: any) => {
        setSubmitError(err?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      },
    },
  });

  // Generation hook
  const startGeneration = useStartLeadGeneration({
    mutation: {
      onSuccess: (data) => {
        if (accessToken) {
          sessionStorage.setItem(
            `daybuilt_lead_${data.leadId}`,
            JSON.stringify({ leadId: data.leadId, accessToken }),
          );
          navigate(`/design-studio/summary/${data.leadId}`);
        }
      },
      onError: (err: any) => {
        const errorData = err?.data?.error || err?.message;
        if (err?.status === 503) {
          setGenerationError("ระบบ AI ยังไม่พร้อมให้บริการ กรุณาลองใหม่อีกครั้งในภายหลัง");
        } else if (errorData) {
          setGenerationError(errorData);
        } else {
          setGenerationError("เกิดข้อผิดพลาดในการสร้างภาพ กรุณาลองใหม่อีกครั้ง");
        }
      },
    },
    request: {
      headers: accessToken ? { "x-design-token": accessToken } : {},
    },
  });

  // ─── File handling ─────────────────────────────────────────────────────────

  const decodeOrientedImage = async (
    file: File,
  ): Promise<{
    width: number;
    height: number;
    draw: CanvasImageSource;
    cleanup: () => void;
  }> => {
    if ("createImageBitmap" in window) {
      try {
        const bitmap = await createImageBitmap(file, {
          imageOrientation: "from-image",
        });
        return {
          width: bitmap.width,
          height: bitmap.height,
          draw: bitmap,
          cleanup: () => bitmap.close(),
        };
      } catch {
        // Some mobile browsers expose createImageBitmap but reject the
        // imageOrientation option. Fall through to the HTMLImageElement
        // decoder, which applies EXIF orientation before canvas drawing.
      }
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      draw: image,
      cleanup: () => URL.revokeObjectURL(objectUrl),
    };
  };

  const normalizeImage = async (
    file: File,
    absoluteRotation: number = 0,
  ): Promise<File | null> => {
    let cleanupDecodedImage = () => {};
    try {
      setIsNormalizing(true);
      setFieldError("");

      // Browsers decode the EXIF orientation before these pixels are drawn.
      // Re-encoding the canvas bakes that corrected orientation into the file
      // that is both previewed and uploaded.
      const decoded = await decodeOrientedImage(file);
      cleanupDecodedImage = decoded.cleanup;
      if (decoded.width * decoded.height > 40_000_000) {
        throw new Error("ภาพมีความละเอียดสูงเกินไป กรุณาใช้ภาพไม่เกิน 40 ล้านพิกเซล");
      }
      const totalRotation = ((absoluteRotation % 360) + 360) % 360;

      // Determine canvas dimensions based on rotation
      const needsSwap = totalRotation === 90 || totalRotation === 270;
      const canvasWidth = needsSwap ? decoded.height : decoded.width;
      const canvasHeight = needsSwap ? decoded.width : decoded.height;

      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("ไม่สามารถสร้าง canvas context ได้");

      // Apply rotation transform
      ctx.translate(canvasWidth / 2, canvasHeight / 2);
      ctx.rotate((totalRotation * Math.PI) / 180);
      ctx.drawImage(
        decoded.draw,
        -decoded.width / 2,
        -decoded.height / 2,
      );

      // Convert to blob with quality reduction if needed
      let quality = 0.92;
      let blob: Blob | null = null;

      do {
        blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
        });
        if (!blob) throw new Error("ไม่สามารถแปลงภาพเป็น JPEG ได้");
        if (blob.size <= 10 * 1024 * 1024) break;
        quality -= 0.1;
      } while (quality > 0.3);

      if (!blob || blob.size > 10 * 1024 * 1024) {
        throw new Error("ไฟล์ใหญ่เกินไป ไม่สามารถลดขนาดให้ต่ำกว่า 10MB ได้");
      }

      const normalizedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      return normalizedFile;
    } catch (err: any) {
      setFieldError(err?.message || "เกิดข้อผิดพลาดในการประมวลผลภาพ");
      return null;
    } finally {
      cleanupDecodedImage();
      setIsNormalizing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setFieldError("กรุณาอัปโหลดไฟล์ jpg, png หรือ webp เท่านั้น");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFieldError("ไฟล์ต้องมีขนาดไม่เกิน 10MB");
      return;
    }

    // Normalize and upload
    const normalized = await normalizeImage(file, 0);
    if (!normalized) return;

    setNormalizedFile(normalized);
    setRotation(0);
    setPreviewUrl(URL.createObjectURL(normalized));
    await uploadFile(normalized);
  };

  const handleRotate = async (degrees: number) => {
    if (!normalizedFile || isNormalizing || isUploading) return;

    const newRotation = (rotation + degrees) % 360;

    // Get original file from input
    const originalFile = fileInputRef.current?.files?.[0];
    if (!originalFile) return;

    // Re-normalize from the original upload using one absolute rotation value,
    // avoiding cumulative quality loss and stale-state double rotation.
    const rotated = await normalizeImage(originalFile, newRotation);
    if (!rotated) return;

    setRotation(newRotation);
    setNormalizedFile(rotated);
    setPreviewUrl(URL.createObjectURL(rotated));

    // Re-upload
    await uploadFile(rotated);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleRemoveImage = () => {
    setImageUrl(null);
    setUploadProof(null);
    setPreviewUrl(null);
    setNormalizedFile(null);
    setRotation(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Navigation ────────────────────────────────────────────────────────────

  const goNext = () => {
    setFieldError("");
    if (step === 1) {
      if (!imageUrl || !uploadProof) {
        setFieldError("กรุณาอัปโหลดรูปห้องของคุณ (จำเป็นสำหรับการสร้างภาพ AI)");
        return;
      }
    }
    if (step === 2) {
      if (!roomType) { setFieldError("กรุณาเลือกประเภทห้อง"); return; }
      if (!roomSize) { setFieldError("กรุณาเลือกขนาดห้อง"); return; }
    }
    if (step === 3) {
      if (builtInTypes.length === 0) { setFieldError("กรุณาเลือกงานบิวท์อินอย่างน้อย 1 รายการ"); return; }
    }
    if (step === 4) {
      if (!style) { setFieldError("กรุณาเลือกสไตล์"); return; }
      if (!colorTone) { setFieldError("กรุณาเลือกโทนสี"); return; }
    }
    if (step === 5) {
      if (!keepLayout) { setFieldError("กรุณาเลือกตัวเลือก Layout"); return; }
      if (!budgetValue) { setFieldError("กรุณาเลือกงบประมาณ"); return; }
      if (!timeline) { setFieldError("กรุณาเลือกช่วงเวลา"); return; }
    }
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setFieldError("");
    setSubmitError("");
    setGenerationError("");
    setStep((s) => s - 1);
  };

  const canContinue =
    (step === 1 && Boolean(imageUrl && uploadProof) && !isNormalizing && !isUploading) ||
    (step === 2 && Boolean(roomType && roomSize)) ||
    (step === 3 && builtInTypes.length > 0) ||
    (step === 4 && Boolean(style && colorTone)) ||
    (step === 5 && Boolean(keepLayout && budgetValue && timeline));

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError("");
    setSubmitError("");
    if (!name || name.trim().length < 2) { setFieldError("กรุณากรอกชื่อ (อย่างน้อย 2 ตัวอักษร)"); return; }
    if (!email || !email.includes("@")) { setFieldError("กรุณากรอกอีเมลให้ถูกต้อง"); return; }
    if (!imageUrl || !uploadProof) { setFieldError("กรุณาอัปโหลดรูปห้อง"); return; }

    const budget = BUDGET_OPTIONS.find((b) => b.value === budgetValue);
    submitLead.mutate({
      data: {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        source: "design-studio",
        roomType,
        roomSize,
        builtInType: builtInTypes.join(", "),
        style,
        colorTone,
        keepLayout,
        timeline,
        budgetMin: budget?.min,
        budgetMax: budget?.max || undefined,
        description: description.trim() || undefined,
        imageUrl: imageUrl,
        uploadProof,
        designRequestId,
      },
    });
  };

  // ─── Generate ──────────────────────────────────────────────────────────────

  const handleGenerate = () => {
    if (!leadId || !accessToken) return;
    setGenerationError("");
    startGeneration.mutate({ id: leadId });
  };

  // ─── Toggle built-in ──────────────────────────────────────────────────────

  const toggleBuiltIn = (id: string) => {
    setBuiltInTypes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ─── Shared Classes ────────────────────────────────────────────────────────

  const cardBase =
    "relative z-10 min-h-16 w-full cursor-pointer touch-manipulation select-none border transition-all duration-150 bg-[#111] border-white/10 hover:border-[#c9a84c]/40 active:border-[#c9a84c] p-4 text-left pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";
  const cardSelected =
    "border-[#c9a84c] bg-[#1a1500] shadow-[inset_0_0_0_1px_rgba(201,168,76,0.2)]";
  const btnBack =
    "relative z-30 min-h-12 touch-manipulation border border-white/20 text-white px-6 md:px-8 py-3 text-sm tracking-wide hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]";
  const btnNext =
    "relative z-30 min-h-12 touch-manipulation bg-[#c9a84c] text-black px-6 md:px-8 py-3 text-sm font-medium tracking-wide hover:bg-[#b8943d] transition-colors disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";
  const actionRow =
    "sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6 z-30 flex justify-between gap-3 mt-8 border border-white/10 bg-[#0a0a0a]/95 p-3 shadow-2xl backdrop-blur";

  // ─── Render Steps ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-[calc(8rem+env(safe-area-inset-bottom))]">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[10px] tracking-[0.3em] text-[#c9a84c] uppercase mb-3">Design Studio</p>
          <h1 className="text-3xl md:text-4xl font-light tracking-wide">ออกแบบห้องของคุณ</h1>
          <p className="text-sm text-white/40 mt-2">
            {step < 7 ? "ตอบคำถามเพียง 7 ขั้นตอน — รับภาพ AI และทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง" : "กำลังสร้างภาพแนวคิดด้วย AI"}
          </p>
        </div>

        <StepIndicator current={step} />

        {/* ── STEP 1: Upload ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-light tracking-wide mb-2">อัปโหลดรูปห้องของคุณ</h2>
            <p className="text-sm text-white/40 mb-8">จำเป็นสำหรับการสร้างภาพ AI (jpg / png / webp, max 10MB)</p>

            {!previewUrl ? (
              <div
                className="border border-dashed border-white/20 rounded-none p-12 text-center cursor-pointer hover:border-[#c9a84c]/40 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={32} className="mx-auto mb-3 text-white/30" />
                <p className="text-sm text-white/50">คลิกเพื่อเลือกรูปภาพ</p>
                <p className="text-xs text-white/30 mt-1">หรือลากวางไฟล์ที่นี่</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 max-w-full object-contain border border-white/10"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={isNormalizing || isUploading}
                    className="absolute top-2 right-2 bg-black/70 border border-white/20 p-1 hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={14} />
                  </button>
                  {imageUrl && !isNormalizing && !isUploading && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-2 text-xs text-[#c9a84c] bg-black/70 border border-white/20 px-2 py-1">
                      <Check size={12} /> อัปโหลดสำเร็จ
                    </div>
                  )}
                  {(isNormalizing || isUploading) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 size={24} className="text-[#c9a84c] animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleRotate(-90)}
                    disabled={isNormalizing || isUploading}
                    className="flex items-center gap-2 border border-white/20 text-white px-4 py-2 text-xs tracking-wide hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="หัน 90° ทวนเข็ม"
                  >
                    <RotateCcw size={14} />
                    หมุนซ้าย
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRotate(90)}
                    disabled={isNormalizing || isUploading}
                    className="flex items-center gap-2 border border-white/20 text-white px-4 py-2 text-xs tracking-wide hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="หัน 90° ตามเข็ม"
                  >
                    <RotateCw size={14} />
                    หมุนขวา
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Progress bar */}
            {isNormalizing && (
              <div className="mt-4">
                <div className="h-px bg-white/10 w-full">
                  <div className="h-px bg-[#c9a84c] w-1/2 animate-pulse" />
                </div>
                <p className="text-xs text-white/40 mt-1">กำลังปรับแต่งภาพ...</p>
              </div>
            )}
            {isUploading && (
              <div className="mt-4">
                <div className="h-px bg-white/10 w-full">
                  <div
                    className="h-px bg-[#c9a84c] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-white/40 mt-1">กำลังอัปโหลด... {progress}%</p>
              </div>
            )}

            {uploadError && (
              <p className="text-red-400 text-sm mt-3">{uploadError.message}</p>
            )}
            {fieldError && <p className="text-red-400 text-sm mt-3">{fieldError}</p>}

            <div className={actionRow}>
              <div></div>
              <button
                type="button"
                data-testid="button-next-step1"
                className={btnNext}
                  disabled={isUploading || isNormalizing || !canContinue}
                onClick={goNext}
              >
                ถัดไป →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Room Type + Size ────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-light tracking-wide mb-6">ประเภทห้องและขนาด</h2>

            <p className="text-xs text-[#c9a84c] tracking-widest uppercase mb-3">ประเภทห้อง</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {ROOM_TYPES.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  className={`${cardBase} ${roomType === r.id ? cardSelected : ""}`}
                  onClick={() => setRoomType(r.id)}
                  aria-pressed={roomType === r.id}
                >
                  <span className="pointer-events-none block pr-6">
                    <span className="block text-sm font-medium">{r.th}</span>
                    <span className="mt-0.5 block text-[10px] text-white/40">{r.en}</span>
                  </span>
                  {roomType === r.id && <Check aria-hidden="true" size={16} className="pointer-events-none absolute right-3 top-3 text-[#c9a84c]" />}
                </button>
              ))}
            </div>

            <p className="text-xs text-[#c9a84c] tracking-widest uppercase mb-3">ขนาดห้อง</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ROOM_SIZES.map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`${cardBase} text-center ${roomSize === s ? cardSelected : ""}`}
                  onClick={() => setRoomSize(s)}
                  aria-pressed={roomSize === s}
                >
                  <span className="pointer-events-none block text-sm">{s}</span>
                  {roomSize === s && <Check aria-hidden="true" size={16} className="pointer-events-none absolute right-3 top-3 text-[#c9a84c]" />}
                </button>
              ))}
            </div>

            {fieldError && <p className="text-red-400 text-sm mt-4">{fieldError}</p>}

            <div className={actionRow}>
              <button type="button" data-testid="button-back-step2" className={btnBack} onClick={goBack}>← ย้อนกลับ</button>
              <button type="button" data-testid="button-next-step2" className={btnNext} disabled={!canContinue} onClick={goNext}>ถัดไป →</button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Built-in Types ──────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-light tracking-wide mb-2">งานบิวท์อินที่ต้องการ</h2>
            <p className="text-sm text-white/40 mb-6">เลือกได้มากกว่า 1 รายการ</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {BUILT_IN_TYPES.map((b) => (
                <button
                  type="button"
                  key={b.id}
                  className={`${cardBase} ${builtInTypes.includes(b.id) ? cardSelected : ""}`}
                  onClick={() => toggleBuiltIn(b.id)}
                  aria-pressed={builtInTypes.includes(b.id)}
                >
                  <div className="pointer-events-none flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{b.th}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">{b.en}</p>
                    </div>
                    {builtInTypes.includes(b.id) && (
                      <Check size={14} className="text-[#c9a84c] mt-0.5 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {fieldError && <p className="text-red-400 text-sm mt-4">{fieldError}</p>}

            <div className={actionRow}>
              <button type="button" data-testid="button-back-step3" className={btnBack} onClick={goBack}>← ย้อนกลับ</button>
              <button type="button" data-testid="button-next-step3" className={btnNext} disabled={!canContinue} onClick={goNext}>ถัดไป →</button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Style + Color Tone ──────────────────────────────────── */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-light tracking-wide mb-6">สไตล์และโทนสี</h2>

            <p className="text-xs text-[#c9a84c] tracking-widest uppercase mb-3">สไตล์การออกแบบ</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
              {STYLES.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  className={`${cardBase} overflow-hidden ${style === s.id ? cardSelected : ""}`}
                  onClick={() => setStyle(s.id)}
                  aria-pressed={style === s.id}
                >
                  <div className={`pointer-events-none w-full h-16 rounded-sm bg-gradient-to-br ${s.swatch} mb-3`} />
                  <span className="pointer-events-none block text-sm font-medium">{s.label}</span>
                  <span className="pointer-events-none block text-[10px] text-white/40">{s.sub}</span>
                  {style === s.id && <Check aria-hidden="true" size={17} className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/70 p-0.5 text-[#c9a84c]" />}
                </button>
              ))}
            </div>

            <p className="text-xs text-[#c9a84c] tracking-widest uppercase mb-3">โทนสี</p>
            <div className="flex flex-wrap gap-4">
              {COLOR_TONES.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setColorTone(c.id)}
                  aria-pressed={colorTone === c.id}
                  className={`relative z-10 min-h-24 min-w-24 flex-1 cursor-pointer touch-manipulation select-none border p-3 pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] ${
                    colorTone === c.id ? cardSelected : "border-white/10 bg-[#111] hover:border-[#c9a84c]/40"
                  }`}
                >
                  <div
                    className={`pointer-events-none mx-auto w-10 h-10 rounded-full border-2 transition-all ${
                      colorTone === c.id ? "border-[#c9a84c] scale-110" : "border-white/20 hover:border-white/40"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className={`pointer-events-none mt-2 block text-center text-[10px] tracking-wide ${colorTone === c.id ? "text-[#c9a84c]" : "text-white/40"}`}>
                    {c.label}
                  </span>
                  {colorTone === c.id && <Check aria-hidden="true" size={15} className="pointer-events-none absolute right-2 top-2 text-[#c9a84c]" />}
                </button>
              ))}
            </div>

            {fieldError && <p className="text-red-400 text-sm mt-4">{fieldError}</p>}

            <div className={actionRow}>
              <button type="button" data-testid="button-back-step4" className={btnBack} onClick={goBack}>← ย้อนกลับ</button>
              <button type="button" data-testid="button-next-step4" className={btnNext} disabled={!canContinue} onClick={goNext}>ถัดไป →</button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Layout + Budget + Timeline ─────────────────────────── */}
        {step === 5 && (
          <div>
            <h2 className="text-2xl font-light tracking-wide mb-6">Layout งบประมาณ และช่วงเวลา</h2>

            {/* Keep Layout */}
            <p className="text-xs text-[#c9a84c] tracking-widest uppercase mb-3">การปรับ Layout</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              {([
                { val: "yes", label: "รักษาสัดส่วนห้องและมุมกล้องเดิม", desc: "AI จะเพิ่มงานบิวท์อินลงในภาพต้นฉบับ โดยล็อกมุมกล้อง หน้าต่าง ประตู เสา ผนัง พื้น และเพดานไว้ตำแหน่งเดิม" },
                { val: "no", label: "ปรับตำแหน่งงานบิวท์อินเท่านั้น", desc: "AI ปรับการวางเฟอร์นิเจอร์ได้ แต่ยังล็อกมุมกล้อง สัดส่วนห้อง และองค์ประกอบโครงสร้างทั้งหมดตามภาพต้นฉบับ" },
              ] as const).map((o) => (
                <button
                  type="button"
                  key={o.val}
                  className={`${cardBase} ${keepLayout === o.val ? cardSelected : ""}`}
                  onClick={() => setKeepLayout(o.val)}
                  aria-pressed={keepLayout === o.val}
                >
                  <span className="pointer-events-none block pr-6">
                    <span className="block text-sm font-medium mb-2">{o.label}</span>
                    <span className="mt-1 block text-xs text-white/40 leading-relaxed">{o.desc}</span>
                  </span>
                  {keepLayout === o.val && <Check aria-hidden="true" size={16} className="pointer-events-none absolute right-3 top-3 text-[#c9a84c]" />}
                </button>
              ))}
            </div>

            {/* Budget */}
            <p className="text-xs text-[#c9a84c] tracking-widest uppercase mb-3">งบประมาณ (บาท)</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
              {BUDGET_OPTIONS.map((b) => (
                <button
                  type="button"
                  key={b.value}
                  onClick={() => setBudgetValue(b.value)}
                  aria-pressed={budgetValue === b.value}
                  className={`${cardBase} text-center ${budgetValue === b.value ? cardSelected : ""}`}
                >
                  <span className="pointer-events-none block text-sm">฿{b.label}</span>
                  {budgetValue === b.value && <Check aria-hidden="true" size={16} className="pointer-events-none absolute right-3 top-3 text-[#c9a84c]" />}
                </button>
              ))}
            </div>

            {/* Timeline */}
            <p className="text-xs text-[#c9a84c] tracking-widest uppercase mb-3">ช่วงเวลาที่ต้องการ</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {TIMELINE_OPTIONS.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTimeline(t)}
                  aria-pressed={timeline === t}
                  className={`${cardBase} ${timeline === t ? cardSelected : ""}`}
                >
                  <span className="pointer-events-none block pr-6 text-sm">{t}</span>
                  {timeline === t && <Check aria-hidden="true" size={16} className="pointer-events-none absolute right-3 top-3 text-[#c9a84c]" />}
                </button>
              ))}
            </div>

            {fieldError && <p className="text-red-400 text-sm mt-4">{fieldError}</p>}

            <div className={actionRow}>
              <button type="button" data-testid="button-back-step5" className={btnBack} onClick={goBack}>← ย้อนกลับ</button>
              <button type="button" data-testid="button-next-step5" className={btnNext} disabled={!canContinue} onClick={goNext}>ถัดไป →</button>
            </div>
          </div>
        )}

        {/* ── STEP 6: Contact + Submit ────────────────────────────────────── */}
        {step === 6 && (
          <form onSubmit={handleSubmit}>
            <h2 className="text-2xl font-light tracking-wide mb-6">ข้อมูลติดต่อ</h2>

            <div className="space-y-5">
              <div>
                <label className="text-xs text-[#c9a84c] tracking-widest uppercase block mb-2">
                  ชื่อ-นามสกุล *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="กรุณากรอกชื่อ-นามสกุล"
                  className="w-full bg-[#111] border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20"
                />
              </div>

              <div>
                <label className="text-xs text-[#c9a84c] tracking-widest uppercase block mb-2">
                  อีเมล *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-[#111] border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20"
                />
              </div>

              <div>
                <label className="text-xs text-[#c9a84c] tracking-widest uppercase block mb-2">
                  เบอร์โทรศัพท์ (ไม่บังคับ)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0xx-xxx-xxxx"
                  className="w-full bg-[#111] border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20"
                />
              </div>

              <div>
                <label className="text-xs text-[#c9a84c] tracking-widest uppercase block mb-2">
                  รายละเอียดเพิ่มเติม (ไม่บังคับ)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="บอกเล่าความต้องการพิเศษ หรือสิ่งที่อยากให้ทีมทราบ..."
                  className="w-full bg-[#111] border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20 resize-none"
                />
              </div>
            </div>

            {fieldError && <p className="text-red-400 text-sm mt-4">{fieldError}</p>}
            {submitError && <p className="text-red-400 text-sm mt-4">{submitError}</p>}

            <div className={actionRow}>
              <button type="button" data-testid="button-back-step6" className={btnBack} onClick={goBack}>← ย้อนกลับ</button>
              <button
                type="submit"
                data-testid="button-submit-step6"
                disabled={submitLead.isPending}
                className={btnNext}
              >
                {submitLead.isPending ? "กำลังบันทึก..." : "บันทึกและดำเนินการต่อ →"}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 7: Generate Design ─────────────────────────────────────── */}
        {step === 7 && (
          <div>
            <h2 className="text-2xl font-light tracking-wide mb-2">สร้างภาพแนวคิดด้วย AI</h2>
            <p className="text-sm text-white/40 mb-8">
              ระบบจะใช้ข้อมูลที่คุณให้มาเพื่อสร้างภาพ Concept Design ตามสไตล์และโทนสีที่เลือก
            </p>

            <div className="border border-white/10 bg-[#0f0f0f] p-8 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-[10px] tracking-[0.2em] text-[#c9a84c] uppercase mb-2">สไตล์</p>
                  <p className="text-sm text-white">{style}</p>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.2em] text-[#c9a84c] uppercase mb-2">โทนสี</p>
                  <p className="text-sm text-white">{colorTone}</p>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.2em] text-[#c9a84c] uppercase mb-2">ประเภทห้อง</p>
                  <p className="text-sm text-white">{roomType}</p>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.2em] text-[#c9a84c] uppercase mb-2">งานบิวท์อิน</p>
                  <p className="text-sm text-white">{builtInTypes.join(", ")}</p>
                </div>
              </div>

              {previewUrl && (
                <div className="mt-4">
                  <p className="text-[10px] tracking-[0.2em] text-[#c9a84c] uppercase mb-2">รูปห้องต้นฉบับ</p>
                  <img
                    src={previewUrl}
                    alt="Room preview"
                    className="max-h-48 max-w-full object-contain border border-white/10"
                  />
                </div>
              )}
            </div>

            <div className="border border-white/10 bg-[#111] p-6 mb-6">
              <p className="text-xs text-white/50 leading-relaxed mb-3">
                การสร้างภาพอาจใช้เวลา 30-60 วินาที กรุณารอจนกว่าจะเสร็จสมบูรณ์
              </p>
              <p className="text-[10px] text-white/30 tracking-wide">
                AI Concept Preview — not final construction drawing
              </p>
              <p className="mt-1 text-[10px] text-white/30 tracking-wide">
                ภาพแนวคิดจาก AI ไม่ใช่แบบก่อสร้างขั้นสุดท้าย
              </p>
            </div>

            {generationError && (
              <div className="border border-red-500/30 bg-red-500/5 p-5 mb-6 flex items-start gap-3" data-testid="text-generation-error">
                <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-400 mb-1 font-medium">เกิดข้อผิดพลาด</p>
                  <p className="text-xs text-red-300/80">{generationError}</p>
                </div>
              </div>
            )}

            <div className={actionRow}>
              <button
                type="button"
                data-testid="button-back-step7"
                className={btnBack}
                disabled
                title="ข้อมูลคำขอนี้ถูกบันทึกแล้ว"
              >
                ข้อมูลบันทึกแล้ว
              </button>
              <button
                type="button"
                data-testid="button-generate"
                disabled={startGeneration.isPending || !leadId || !accessToken}
                className={btnNext}
                onClick={handleGenerate}
              >
                {startGeneration.isPending ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 size={16} className="animate-spin" />
                    กำลังสร้างภาพ...
                  </span>
                ) : (
                  "สร้างภาพแนวคิด AI →"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
