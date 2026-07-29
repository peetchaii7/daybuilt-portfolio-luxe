import { useParams } from "wouter";
import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

interface LeadSummary {
  id: number;
  name: string;
  email: string;
  phone?: string;
  description?: string;
  roomType?: string;
  roomSize?: string;
  builtInType?: string;
  style?: string;
  colorTone?: string;
  keepLayout?: string;
  timeline?: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  imageUrl?: string | null;
}

function formatThb(val?: number | null): string {
  if (!val) return "-";
  return `฿${new Intl.NumberFormat("th-TH").format(val)}`;
}

function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="py-4 border-b border-white/5">
      <p className="text-[10px] tracking-[0.2em] text-[#c9a84c] uppercase mb-1">{label}</p>
      <p className="text-sm text-white">{value}</p>
    </div>
  );
}

export default function DesignSummary() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [lead, setLead] = useState<LeadSummary | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!id) return;
    const raw = sessionStorage.getItem(`daybuilt_lead_${id}`);
    if (raw) {
      try {
        setLead(JSON.parse(raw));
      } catch {
        // malformed — show minimal view
      }
    }
    setLoaded(true);
  }, [id]);

  const budgetLabel =
    lead?.budgetMin || lead?.budgetMax
      ? `${formatThb(lead?.budgetMin)}${lead?.budgetMax ? ` – ${formatThb(lead?.budgetMax)}` : "+"}`
      : null;

  const keepLayoutLabel =
    lead?.keepLayout === "yes"
      ? "รักษา Layout เดิม"
      : lead?.keepLayout === "no"
      ? "ยินดีให้ปรับ Layout ใหม่"
      : lead?.keepLayout || null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-6">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <CheckCircle size={48} className="text-[#c9a84c]" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl md:text-4xl font-light tracking-wide mb-3">
            คำขอออกแบบของคุณได้รับแล้ว
          </h1>
          <p className="text-white/40 text-sm">
            หมายเลขคำขอ{" "}
            <span className="text-[#c9a84c] font-medium tracking-widest">#{id}</span>
          </p>
          <p className="text-white/30 text-xs mt-2">
            ทีมงาน Daybuilt จะติดต่อกลับภายใน 24 ชั่วโมง
          </p>
        </div>

        {loaded && !lead && (
          // Minimal view for direct URL access
          <div className="border border-white/10 bg-[#111] p-8 text-center mb-8">
            <p className="text-white/50 text-sm">ข้อมูลคำขอหมายเลข #{id}</p>
            <p className="text-white/30 text-xs mt-2">ทีมงานได้รับคำขอของคุณเรียบร้อยแล้ว</p>
          </div>
        )}

        {lead && (
          <>
            {/* ── Photo ─────────────────────────────────────────────────────── */}
            <div className="mb-8">
              {lead.imageUrl ? (
                <img
                  src={`/api/storage/objects/${lead.imageUrl}`}
                  alt="ห้องต้นฉบับ"
                  className="w-full max-h-72 object-cover border border-white/10"
                />
              ) : (
                <div className="w-full h-36 bg-[#111] border border-white/10 flex items-center justify-center">
                  <p className="text-white/20 text-sm">ไม่มีรูปห้องต้นฉบับ</p>
                </div>
              )}
            </div>

            {/* ── Summary Grid ──────────────────────────────────────────────── */}
            <div className="border border-white/10 bg-[#0f0f0f] mb-8">
              <div className="px-6 py-4 border-b border-white/10">
                <p className="text-xs tracking-[0.2em] text-white/40 uppercase">สรุปคำขอออกแบบ</p>
              </div>
              <div className="px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <SummaryRow label="ชื่อ" value={lead.name} />
                  <SummaryRow label="ประเภทห้อง" value={lead.roomType} />
                  <SummaryRow label="ขนาดห้อง" value={lead.roomSize} />
                  <SummaryRow label="งานบิวท์อิน" value={lead.builtInType} />
                  <SummaryRow label="สไตล์" value={lead.style} />
                  <SummaryRow label="โทนสี" value={lead.colorTone} />
                  <SummaryRow label="งบประมาณ" value={budgetLabel} />
                  <SummaryRow label="ช่วงเวลา" value={lead.timeline} />
                  <SummaryRow label="Layout" value={keepLayoutLabel} />
                  {lead.description && (
                    <div className="md:col-span-2 py-4 border-b border-white/5">
                      <p className="text-[10px] tracking-[0.2em] text-[#c9a84c] uppercase mb-1">รายละเอียดเพิ่มเติม</p>
                      <p className="text-sm text-white/80">{lead.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── AI Visualization Notice ───────────────────────────────────── */}
            <div className="border border-white/10 bg-[#111] p-6 mb-8">
              <p className="text-[10px] tracking-[0.2em] text-[#c9a84c] uppercase mb-3">
                AI Visualization
              </p>
              <p className="text-sm text-white/70 mb-2">
                ขณะนี้ระบบ AI Visualization ยังไม่ได้เปิดให้บริการ
              </p>
              <p className="text-xs text-white/40 leading-relaxed">
                ทีมงาน Daybuilt จะติดต่อกลับพร้อมแนวคิดออกแบบเบื้องต้น ภายใน 1-2 วันทำการ
              </p>
            </div>
          </>
        )}

        {/* ── CTAs ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/"
            className="border border-white/20 text-white px-8 py-3 text-sm tracking-wide hover:bg-white/5 transition-colors text-center"
          >
            กลับสู่หน้าหลัก
          </a>
          <a
            href="/projects"
            className="bg-[#c9a84c] text-black px-8 py-3 text-sm font-medium tracking-wide hover:bg-[#b8943d] transition-colors text-center"
          >
            ดูโปรเจกต์
          </a>
        </div>
      </div>
    </div>
  );
}
