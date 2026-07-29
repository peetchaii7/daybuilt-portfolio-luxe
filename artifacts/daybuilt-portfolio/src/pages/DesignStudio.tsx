import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useSubmitLead } from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
import { Check, X, Upload } from "lucide-react";

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
  { id: "อื่นๆ", th: "อื่นๆ", en: "Other" },
];

const STYLES = [
  { id: "มินิมอล", label: "มินิมอล", sub: "Minimal", swatch: "from-stone-200 to-stone-400" },
  { id: "Modern Luxury", label: "Modern Luxury", sub: "Modern Luxury", swatch: "from-zinc-700 to-black" },
  { id: "อินดัสเทรียล", label: "อินดัสเทรียล", sub: "Industrial", swatch: "from-neutral-500 to-neutral-800" },
  { id: "ญี่ปุ่น-สแกนดิ", label: "ญี่ปุ่น-สแกนดิ", sub: "Japandi", swatch: "from-amber-50 to-orange-200" },
  { id: "คลาสสิกไทย", label: "คลาสสิกไทย", sub: "Classic Thai", swatch: "from-amber-700 via-amber-900 to-black" },
  { id: "วินเทจ", label: "วินเทจ", sub: "Vintage", swatch: "from-rose-200 via-amber-200 to-stone-300" },
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

const TOTAL_STEPS = 6;

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center mb-10 gap-0">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const num = i + 1;
        const done = num < current;
        const active = num === current;
        return (
          <div key={num} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border transition-all
                ${active ? "bg-[#c9a84c] text-black border-[#c9a84c]" : ""}
                ${done ? "border-[#c9a84c] text-[#c9a84c]" : ""}
                ${!active && !done ? "border-white/20 text-white/40" : ""}
              `}
            >
              {done ? <Check size={12} strokeWidth={2.5} /> : num}
            </div>
            {num < TOTAL_STEPS && (
              <div className="w-10 h-px bg-[#c9a84c]/30 mx-0.5" />
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Step 2 — Room
  const [roomType, setRoomType] = useState("");
  const [roomSize, setRoomSize] = useState("");

  // Step 3 — Built-in
  const [builtInTypes, setBuiltInTypes] = useState<string[]>([]);

  // Step 4 — Style + Color
  const [style, setStyle] = useState("");
  const [colorTone, setColorTone] = useState("");

  // Step 5 — Layout + Budget + Timeline
  const [keepLayout, setKeepLayout] = useState("");
  const [budgetValue, setBudgetValue] = useState("");
  const [timeline, setTimeline] = useState("");

  // Step 6 — Contact
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  // Errors
  const [fieldError, setFieldError] = useState("");
  const [submitError, setSubmitError] = useState("");

  // Upload hook
  const { uploadFile, isUploading, progress, error: uploadError } = useUpload({
    onSuccess: (res: { objectPath: string; uploadURL: string; metadata: { name: string; size: number; contentType: string } }) => {
      setImageUrl(res.objectPath);
    },
  });

  // Submit hook — mutate takes { data: LeadInput }
  const { mutate, isPending } = useSubmitLead({
    mutation: {
      onSuccess: (data: { success: boolean; message: string; id: number }) => {
        const budget = BUDGET_OPTIONS.find((b) => b.value === budgetValue);
        const lead = {
          name,
          email,
          phone,
          description,
          roomType,
          roomSize,
          builtInType: builtInTypes.join(", "),
          style,
          colorTone,
          keepLayout,
          timeline,
          budgetMin: budget?.min ?? null,
          budgetMax: budget?.max ?? null,
          imageUrl,
          id: data.id,
        };
        sessionStorage.setItem(`daybuilt_lead_${data.id}`, JSON.stringify(lead));
        navigate(`/design-studio/summary/${data.id}`);
      },
      onError: (err: any) => {
        setSubmitError(err?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      },
    },
  });

  // ─── File handling ─────────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setFieldError("ไฟล์ต้องมีขนาดไม่เกิน 10MB");
      return;
    }
    setFieldError("");
    setPreviewUrl(URL.createObjectURL(file));
    await uploadFile(file);
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Navigation ────────────────────────────────────────────────────────────

  const goNext = () => {
    setFieldError("");
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
    setStep((s) => s - 1);
  };

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError("");
    setSubmitError("");
    if (!name || name.trim().length < 2) { setFieldError("กรุณากรอกชื่อ (อย่างน้อย 2 ตัวอักษร)"); return; }
    if (!email || !email.includes("@")) { setFieldError("กรุณากรอกอีเมลให้ถูกต้อง"); return; }

    const budget = BUDGET_OPTIONS.find((b) => b.value === budgetValue);
    mutate({
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
        imageUrl: imageUrl || undefined,
      },
    });
  };

  // ─── Toggle built-in ──────────────────────────────────────────────────────

  const toggleBuiltIn = (id: string) => {
    setBuiltInTypes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ─── Shared Classes ────────────────────────────────────────────────────────

  const cardBase =
    "cursor-pointer border transition-all duration-150 bg-[#111] border-white/10 hover:border-[#c9a84c]/40 p-4 text-left";
  const cardSelected =
    "border-[#c9a84c] bg-[#1a1500]";
  const btnBack =
    "border border-white/20 text-white px-8 py-3 text-sm tracking-wide hover:bg-white/5 transition-colors";
  const btnNext =
    "bg-[#c9a84c] text-black px-8 py-3 text-sm font-medium tracking-wide hover:bg-[#b8943d] transition-colors disabled:opacity-40";

  // ─── Render Steps ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[10px] tracking-[0.3em] text-[#c9a84c] uppercase mb-3">Design Studio</p>
          <h1 className="text-3xl md:text-4xl font-light tracking-wide">ออกแบบห้องของคุณ</h1>
          <p className="text-sm text-white/40 mt-2">ตอบคำถามเพียง 6 ขั้นตอน — ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง</p>
        </div>

        <StepIndicator current={step} />

        {/* ── STEP 1: Upload ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-light tracking-wide mb-2">อัปโหลดรูปห้องของคุณ</h2>
            <p className="text-sm text-white/40 mb-8">ไม่บังคับ — ช่วยให้ทีมเข้าใจห้องได้ดีขึ้น (jpg / png / webp, max 10MB)</p>

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
              <div className="relative inline-block">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-64 max-w-full object-cover border border-white/10"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-black/70 border border-white/20 p-1 hover:bg-black transition-colors"
                >
                  <X size={14} />
                </button>
                {imageUrl && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-[#c9a84c]">
                    <Check size={12} /> อัปโหลดสำเร็จ
                  </div>
                )}
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

            <div className="flex items-center justify-between mt-8">
              <button
                className="text-sm text-white/40 hover:text-white/70 underline underline-offset-2 transition-colors"
                onClick={() => { setStep(2); setFieldError(""); }}
              >
                ข้ามขั้นตอนนี้
              </button>
              <button
                className={btnNext}
                disabled={isUploading}
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
                  key={r.id}
                  className={`${cardBase} ${roomType === r.id ? cardSelected : ""}`}
                  onClick={() => setRoomType(r.id)}
                >
                  <p className="text-sm font-medium">{r.th}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{r.en}</p>
                </button>
              ))}
            </div>

            <p className="text-xs text-[#c9a84c] tracking-widest uppercase mb-3">ขนาดห้อง</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ROOM_SIZES.map((s) => (
                <button
                  key={s}
                  className={`${cardBase} text-center ${roomSize === s ? cardSelected : ""}`}
                  onClick={() => setRoomSize(s)}
                >
                  <p className="text-sm">{s}</p>
                </button>
              ))}
            </div>

            {fieldError && <p className="text-red-400 text-sm mt-4">{fieldError}</p>}

            <div className="flex justify-between mt-8">
              <button className={btnBack} onClick={goBack}>← ย้อนกลับ</button>
              <button className={btnNext} onClick={goNext}>ถัดไป →</button>
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
                  key={b.id}
                  className={`${cardBase} ${builtInTypes.includes(b.id) ? cardSelected : ""}`}
                  onClick={() => toggleBuiltIn(b.id)}
                >
                  <div className="flex items-start justify-between gap-2">
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

            <div className="flex justify-between mt-8">
              <button className={btnBack} onClick={goBack}>← ย้อนกลับ</button>
              <button className={btnNext} onClick={goNext}>ถัดไป →</button>
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
                  key={s.id}
                  className={`${cardBase} overflow-hidden ${style === s.id ? cardSelected : ""}`}
                  onClick={() => setStyle(s.id)}
                >
                  <div className={`w-full h-16 rounded-sm bg-gradient-to-br ${s.swatch} mb-3`} />
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-[10px] text-white/40">{s.sub}</p>
                </button>
              ))}
            </div>

            <p className="text-xs text-[#c9a84c] tracking-widest uppercase mb-3">โทนสี</p>
            <div className="flex flex-wrap gap-4">
              {COLOR_TONES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setColorTone(c.id)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      colorTone === c.id ? "border-[#c9a84c] scale-110" : "border-white/20 hover:border-white/40"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className={`text-[10px] tracking-wide ${colorTone === c.id ? "text-[#c9a84c]" : "text-white/40"}`}>
                    {c.label}
                  </span>
                </button>
              ))}
            </div>

            {fieldError && <p className="text-red-400 text-sm mt-4">{fieldError}</p>}

            <div className="flex justify-between mt-8">
              <button className={btnBack} onClick={goBack}>← ย้อนกลับ</button>
              <button className={btnNext} onClick={goNext}>ถัดไป →</button>
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
              {[
                { val: "yes", label: "รักษา Layout เดิม", desc: "ต้องการคงตำแหน่งที่มีอยู่" },
                { val: "no", label: "ยินดีให้ปรับ Layout ใหม่", desc: "ให้ทีมออกแบบได้อิสระ" },
              ].map((o) => (
                <button
                  key={o.val}
                  className={`${cardBase} ${keepLayout === o.val ? cardSelected : ""}`}
                  onClick={() => setKeepLayout(o.val)}
                >
                  <p className="text-sm font-medium">{o.label}</p>
                  <p className="text-xs text-white/40 mt-1">{o.desc}</p>
                </button>
              ))}
            </div>

            {/* Budget */}
            <p className="text-xs text-[#c9a84c] tracking-widest uppercase mb-3">งบประมาณ (บาท)</p>
            <div className="mb-8">
              <select
                value={budgetValue}
                onChange={(e) => setBudgetValue(e.target.value)}
                className="w-full bg-[#111] border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 appearance-none"
              >
                <option value="" disabled>เลือกงบประมาณ</option>
                {BUDGET_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value}>฿{b.label}</option>
                ))}
              </select>
            </div>

            {/* Timeline */}
            <p className="text-xs text-[#c9a84c] tracking-widest uppercase mb-3">ช่วงเวลาที่ต้องการ</p>
            <div className="mb-4">
              <select
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className="w-full bg-[#111] border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 appearance-none"
              >
                <option value="" disabled>เลือกช่วงเวลา</option>
                {TIMELINE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {fieldError && <p className="text-red-400 text-sm mt-4">{fieldError}</p>}

            <div className="flex justify-between mt-8">
              <button className={btnBack} onClick={goBack}>← ย้อนกลับ</button>
              <button className={btnNext} onClick={goNext}>ถัดไป →</button>
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

            <div className="flex justify-between mt-8">
              <button type="button" className={btnBack} onClick={goBack}>← ย้อนกลับ</button>
              <button
                type="submit"
                disabled={isPending}
                className={btnNext}
              >
                {isPending ? "กำลังส่ง..." : "ส่งคำขอออกแบบ ✓"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
