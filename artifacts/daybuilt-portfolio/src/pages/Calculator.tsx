import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  BedDouble, Sofa, ChefHat, Bath, UtensilsCrossed,
  Monitor, Layout, Plus, Minus, ArrowRight, Sparkles, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const ROOM_TYPES = [
  { id: "master-bedroom", label: "ห้องนอนหลัก", sublabel: "Master Bedroom", icon: BedDouble, defaultArea: 40 },
  { id: "bedroom", label: "ห้องนอน", sublabel: "Bedroom", icon: BedDouble, defaultArea: 25 },
  { id: "living", label: "ห้องนั่งเล่น", sublabel: "Living Room", icon: Sofa, defaultArea: 50 },
  { id: "kitchen", label: "ห้องครัว", sublabel: "Kitchen", icon: ChefHat, defaultArea: 20 },
  { id: "master-bath", label: "ห้องน้ำหลัก", sublabel: "Master Bathroom", icon: Bath, defaultArea: 15 },
  { id: "bathroom", label: "ห้องน้ำ", sublabel: "Bathroom", icon: Bath, defaultArea: 8 },
  { id: "dining", label: "ห้องอาหาร", sublabel: "Dining Room", icon: UtensilsCrossed, defaultArea: 30 },
  { id: "office", label: "ห้องทำงาน", sublabel: "Home Office", icon: Monitor, defaultArea: 20 },
  { id: "multipurpose", label: "ห้องเอนกประสงค์", sublabel: "Multi-purpose", icon: Layout, defaultArea: 25 },
];

const MATERIAL_GRADES = [
  {
    id: "classic",
    label: "Classic",
    sublabel: "คุณภาพมาตรฐาน",
    pricePerSqm: 8000,
    color: "from-stone-700 to-stone-500",
    accent: "border-stone-500",
    textAccent: "text-stone-400",
    materials: {
      flooring: "กระเบื้องเซรามิค / Ceramic Tile",
      wall: "สีทาเรียบ / Matte Paint",
      ceiling: "ฝ้าเรียบ / Standard Plaster",
      lighting: "ไฟดาวน์ไลท์ทั่วไป / Basic Downlights",
      furniture: "เฟอร์นิเจอร์สำเร็จรูป / Ready-made",
    },
  },
  {
    id: "prestige",
    label: "Prestige",
    sublabel: "คุณภาพพรีเมียม",
    pricePerSqm: 22000,
    color: "from-amber-800 to-amber-600",
    accent: "border-amber-600",
    textAccent: "text-amber-500",
    materials: {
      flooring: "หินวิศวกรรม / Engineered Stone",
      wall: "ผนังปูน Texture / Textured Plaster",
      ceiling: "ฝ้า Coffer พร้อม Cove Light / Coffered + Cove",
      lighting: "ไฟ Designer / Designer Fixtures",
      furniture: "Custom Built-in / Bespoke Cabinetry",
    },
  },
  {
    id: "signature",
    label: "Signature",
    sublabel: "สุดยอดความหรูหรา",
    pricePerSqm: 55000,
    color: "from-yellow-700 to-yellow-400",
    accent: "border-yellow-500",
    textAccent: "text-yellow-400",
    materials: {
      flooring: "หินอ่อน / Marble & Onyx",
      wall: "แผ่น Bespoke / Custom Wall Panels",
      ceiling: "ออกแบบพิเศษ / Architectural Ceiling",
      lighting: "Art Lighting System / ระบบแสง Art",
      furniture: "European Custom / เฟอร์นิเจอร์นำเข้า",
    },
  },
];

type RoomConfig = {
  area: number;
  grade: string;
};

function formatThb(value: number): string {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(value);
}

export default function Calculator() {
  const [selectedRooms, setSelectedRooms] = useState<Record<string, RoomConfig>>({});
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  const toggleRoom = (roomId: string) => {
    setSelectedRooms((prev) => {
      if (prev[roomId]) {
        const next = { ...prev };
        delete next[roomId];
        if (expandedRoom === roomId) setExpandedRoom(null);
        return next;
      }
      const room = ROOM_TYPES.find((r) => r.id === roomId)!;
      setExpandedRoom(roomId);
      return { ...prev, [roomId]: { area: room.defaultArea, grade: "prestige" } };
    });
  };

  const updateRoom = (roomId: string, updates: Partial<RoomConfig>) => {
    setSelectedRooms((prev) => ({
      ...prev,
      [roomId]: { ...prev[roomId], ...updates },
    }));
  };

  const roomTotals = useMemo(() => {
    return Object.entries(selectedRooms).map(([roomId, config]) => {
      const room = ROOM_TYPES.find((r) => r.id === roomId)!;
      const grade = MATERIAL_GRADES.find((g) => g.id === config.grade)!;
      return {
        roomId,
        label: room.label,
        sublabel: room.sublabel,
        area: config.area,
        grade: grade.label,
        pricePerSqm: grade.pricePerSqm,
        total: config.area * grade.pricePerSqm,
      };
    });
  }, [selectedRooms]);

  const grandTotal = useMemo(() => roomTotals.reduce((s, r) => s + r.total, 0), [roomTotals]);

  return (
    <div className="w-full pt-24 min-h-screen bg-background">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 border-b border-border">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <p className="text-xs font-sans tracking-[0.35em] text-primary uppercase mb-4">Material & Cost Estimator</p>
          <h1 className="text-4xl md:text-6xl font-serif text-foreground mb-6">
            ออกแบบพื้นที่<br />
            <span className="text-primary italic">คำนวณวัสดุ</span>
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
            เลือกประเภทห้อง กำหนดพื้นที่ใช้สอย และเลือกระดับวัสดุ ระบบจะคำนวณงบประมาณโดยประมาณสำหรับโครงการของคุณ
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

          {/* LEFT: Room Selection */}
          <div className="lg:col-span-3 space-y-8">
            {/* Room type grid */}
            <div>
              <h2 className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6 font-sans">
                1. เลือกประเภทห้อง
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ROOM_TYPES.map((room) => {
                  const selected = !!selectedRooms[room.id];
                  return (
                    <motion.button
                      key={room.id}
                      data-testid={`room-toggle-${room.id}`}
                      onClick={() => toggleRoom(room.id)}
                      whileTap={{ scale: 0.97 }}
                      className={`relative group flex flex-col items-start p-4 border transition-all duration-300 text-left ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-border/80"
                      }`}
                    >
                      {selected && (
                        <CheckCircle2 size={14} className="absolute top-3 right-3 text-primary" />
                      )}
                      <room.icon
                        size={22}
                        strokeWidth={1}
                        className={`mb-3 transition-colors ${selected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                      />
                      <span className={`text-sm font-serif transition-colors ${selected ? "text-foreground" : "text-foreground/70"}`}>
                        {room.label}
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5">{room.sublabel}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Room configuration */}
            <AnimatePresence>
              {Object.keys(selectedRooms).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h2 className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6 font-sans">
                    2. กำหนดพื้นที่และวัสดุแต่ละห้อง
                  </h2>

                  <div className="space-y-4">
                    {Object.entries(selectedRooms).map(([roomId, config]) => {
                      const room = ROOM_TYPES.find((r) => r.id === roomId)!;
                      const grade = MATERIAL_GRADES.find((g) => g.id === config.grade)!;
                      const isOpen = expandedRoom === roomId;

                      return (
                        <motion.div
                          key={roomId}
                          layout
                          className="border border-border bg-card overflow-hidden"
                        >
                          {/* Room header */}
                          <button
                            className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
                            onClick={() => setExpandedRoom(isOpen ? null : roomId)}
                          >
                            <div className="flex items-center gap-4">
                              <room.icon size={18} strokeWidth={1} className="text-primary" />
                              <div className="text-left">
                                <p className="text-sm font-serif text-foreground">{room.label}</p>
                                <p className="text-xs text-muted-foreground">{config.area} ตร.ม. · {grade.label}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`text-sm font-serif ${grade.textAccent}`}>
                                {formatThb(config.area * grade.pricePerSqm)}
                              </span>
                              {isOpen ? <Minus size={14} className="text-muted-foreground" /> : <Plus size={14} className="text-muted-foreground" />}
                            </div>
                          </button>

                          {/* Room detail panel */}
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="border-t border-border"
                              >
                                <div className="p-5 space-y-6">
                                  {/* Area Slider */}
                                  <div>
                                    <div className="flex items-center justify-between mb-3">
                                      <label className="text-xs tracking-widest uppercase text-muted-foreground font-sans">
                                        พื้นที่ใช้สอย
                                      </label>
                                      <span className="text-sm font-serif text-foreground">
                                        {config.area} ตร.ม.
                                      </span>
                                    </div>
                                    <Slider
                                      data-testid={`slider-area-${roomId}`}
                                      min={5}
                                      max={200}
                                      step={1}
                                      value={[config.area]}
                                      onValueChange={([v]) => updateRoom(roomId, { area: v })}
                                      className="[&>[data-orientation=horizontal]]:h-px [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-primary [&_[role=slider]]:bg-primary"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                      <span>5 ตร.ม.</span>
                                      <span>200 ตร.ม.</span>
                                    </div>
                                  </div>

                                  {/* Grade selection */}
                                  <div>
                                    <label className="text-xs tracking-widest uppercase text-muted-foreground font-sans mb-4 block">
                                      ระดับวัสดุ
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                      {MATERIAL_GRADES.map((g) => (
                                        <button
                                          key={g.id}
                                          data-testid={`grade-${roomId}-${g.id}`}
                                          onClick={() => updateRoom(roomId, { grade: g.id })}
                                          className={`p-3 border text-left transition-all duration-200 ${
                                            config.grade === g.id
                                              ? `${g.accent} bg-white/5`
                                              : "border-border hover:border-border/80"
                                          }`}
                                        >
                                          <p className={`text-xs font-serif ${config.grade === g.id ? g.textAccent : "text-foreground"}`}>
                                            {g.label}
                                          </p>
                                          <p className="text-xs text-muted-foreground mt-0.5">
                                            ฿{(g.pricePerSqm / 1000).toFixed(0)}K/ตร.ม.
                                          </p>
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Material details */}
                                  <div className="bg-background border border-border p-4 space-y-2">
                                    <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3 font-sans">
                                      <Sparkles size={11} className="inline mr-2 text-primary" />
                                      วัสดุที่รวมอยู่ใน {grade.label}
                                    </p>
                                    {Object.entries(grade.materials).map(([key, value]) => (
                                      <div key={key} className="flex items-start gap-3">
                                        <span className="text-xs text-muted-foreground capitalize w-24 shrink-0 pt-0.5">
                                          {key === "flooring" ? "พื้น" : key === "wall" ? "ผนัง" : key === "ceiling" ? "ฝ้า" : key === "lighting" ? "แสงสว่าง" : "เฟอร์นิเจอร์"}
                                        </span>
                                        <span className="text-xs text-foreground/80 leading-relaxed">{value}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: Price Summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-28">
              <div className="border border-border bg-card p-6 md:p-8 space-y-6">
                <div>
                  <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-1 font-sans">
                    สรุปงบประมาณ
                  </p>
                  <h3 className="text-xl font-serif text-foreground">Cost Estimate</h3>
                </div>

                {roomTotals.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border/40">
                    <p className="text-muted-foreground text-sm">เลือกห้องเพื่อเริ่มคำนวณ</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">Select rooms to begin</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {roomTotals.map((r) => (
                        <motion.div
                          key={r.roomId}
                          layout
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="flex items-start justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-foreground font-serif truncate">{r.label}</p>
                            <p className="text-xs text-muted-foreground">{r.area} ตร.ม. · {r.grade}</p>
                          </div>
                          <p className="text-sm font-serif text-foreground shrink-0">{formatThb(r.total)}</p>
                        </motion.div>
                      ))}
                    </div>

                    <div className="border-t border-border pt-5">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xs tracking-widest uppercase text-muted-foreground font-sans">ประมาณการรวม</p>
                          <p className="text-xs text-muted-foreground/60 mt-0.5">Total Estimated Budget</p>
                        </div>
                        <motion.p
                          key={grandTotal}
                          initial={{ scale: 0.95, opacity: 0.7 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-2xl font-serif text-primary"
                        >
                          {formatThb(grandTotal)}
                        </motion.p>
                      </div>
                    </div>

                    {/* Grade breakdown */}
                    <div className="space-y-2 border-t border-border/30 pt-5">
                      <p className="text-xs tracking-widest uppercase text-muted-foreground font-sans mb-3">
                        อ้างอิงราคาต่อตร.ม.
                      </p>
                      {MATERIAL_GRADES.map((g) => (
                        <div key={g.id} className="flex items-center justify-between">
                          <span className={`text-xs font-serif ${g.textAccent}`}>{g.label}</span>
                          <span className="text-xs text-muted-foreground">฿{g.pricePerSqm.toLocaleString()} / ตร.ม.</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground/50 leading-relaxed border-t border-border/20 pt-4">
                      * ราคาประมาณการ ไม่รวมงานโครงสร้าง, ระบบวิศวกรรม, และค่าออกแบบ. กรุณาติดต่อทีมงานเพื่อรับใบเสนอราคาที่แม่นยำ
                    </p>
                  </>
                )}

                <Link href="/contact">
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none py-5 font-serif tracking-widest uppercase text-sm group"
                    data-testid="button-contact-cta"
                  >
                    ติดต่อขอใบเสนอราคา
                    <ArrowRight size={14} className="ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
