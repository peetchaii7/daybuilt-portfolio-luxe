import { useParams, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import {
  useGetLeadGeneration,
  getGetLeadGenerationQueryKey,
  useGetLeadImage,
  getGetLeadImageQueryKey,
} from "@workspace/api-client-react";

export default function DesignSummary() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const id = params?.id ? Number(params.id) : null;

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);

  // Object URLs for images
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  // Load token from sessionStorage
  useEffect(() => {
    if (!id) return;
    const raw = sessionStorage.getItem(`daybuilt_lead_${id}`);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data.accessToken) {
          setAccessToken(data.accessToken);
        } else {
          setAuthError(true);
        }
      } catch {
        setAuthError(true);
      }
    } else {
      setAuthError(true);
    }
  }, [id]);

  // Poll generation status
  const statusQuery = useGetLeadGeneration(id || 0, {
    query: {
      enabled: !!id && !!accessToken && !authError,
      queryKey: getGetLeadGenerationQueryKey(id || 0),
      refetchInterval: (query) => {
        const data = query.state.data;
        if (!data) return false;
        if (data.status === "pending" || data.status === "processing") {
          return 2000; // Poll every 2s
        }
        return false;
      },
    },
    request: {
      headers: accessToken ? { "x-design-token": accessToken } : {},
    },
  });

  // Fetch source image
  const sourceImageQuery = useGetLeadImage(id || 0, "source", {
    query: {
      enabled: !!id && !!accessToken && !authError && !!statusQuery.data?.sourceImageUrl,
      queryKey: [...getGetLeadImageQueryKey(id || 0, "source"), "customer"],
    },
    request: {
      headers: accessToken ? { "x-design-token": accessToken } : {},
    },
  });

  // Fetch generated image
  const generatedImageQuery = useGetLeadImage(id || 0, "generated", {
    query: {
      enabled: !!id && !!accessToken && !authError && statusQuery.data?.status === "completed" && !!statusQuery.data?.generatedImageUrl,
      queryKey: [...getGetLeadImageQueryKey(id || 0, "generated"), "customer"],
    },
    request: {
      headers: accessToken ? { "x-design-token": accessToken } : {},
    },
  });

  // Create and revoke object URLs
  useEffect(() => {
    if (sourceImageQuery.data) {
      const url = URL.createObjectURL(sourceImageQuery.data);
      setSourceImageUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    return undefined;
  }, [sourceImageQuery.data]);

  useEffect(() => {
    if (generatedImageQuery.data) {
      const url = URL.createObjectURL(generatedImageQuery.data);
      setGeneratedImageUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    return undefined;
  }, [generatedImageQuery.data]);

  // Handle query errors
  useEffect(() => {
    if (statusQuery.error) {
      const err = statusQuery.error as any;
      if (err?.status === 401 || err?.status === 403) {
        setAuthError(true);
      }
    }
  }, [statusQuery.error]);

  const status = statusQuery.data?.status;
  const selections = statusQuery.data?.selections;
  const conceptSummary = statusQuery.data?.conceptSummary;
  const error = statusQuery.data?.error;

  const budgetLabel =
    selections?.budgetMin || selections?.budgetMax
      ? `฿${new Intl.NumberFormat("th-TH").format(selections.budgetMin || 0)}${selections.budgetMax ? ` – ฿${new Intl.NumberFormat("th-TH").format(selections.budgetMax)}` : "+"}`
      : null;

  const keepLayoutLabel =
    selections?.keepLayout === "yes"
      ? "รักษา Layout เดิม"
      : selections?.keepLayout === "no"
      ? "ยินดีให้ปรับ Layout ใหม่"
      : selections?.keepLayout || null;

  if (!id) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-white/50">ID ไม่ถูกต้อง</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="border border-red-500/30 bg-red-500/5 p-8 text-center" data-testid="text-auth-error">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
            <h1 className="text-2xl font-light tracking-wide mb-3">ไม่สามารถเข้าถึงข้อมูลได้</h1>
            <p className="text-sm text-white/50 mb-6">
              Session หมดอายุ หรือไม่มีสิทธิ์เข้าถึงหน้านี้
            </p>
            <a
              href="/design-studio"
              className="inline-block bg-[#c9a84c] text-black px-8 py-3 text-sm font-medium tracking-wide hover:bg-[#b8943d] transition-colors"
            >
              สร้างคำขอใหม่
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="text-center mb-12">
          {status === "completed" ? (
            <div className="flex justify-center mb-6">
              <CheckCircle size={48} className="text-[#c9a84c]" strokeWidth={1.5} data-testid="icon-completed" />
            </div>
          ) : status === "failed" ? (
            <div className="flex justify-center mb-6">
              <AlertCircle size={48} className="text-red-400" strokeWidth={1.5} data-testid="icon-failed" />
            </div>
          ) : (
            <div className="flex justify-center mb-6">
              <Loader2 size={48} className="text-[#c9a84c] animate-spin" strokeWidth={1.5} data-testid="icon-processing" />
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-light tracking-wide mb-3" data-testid="text-title">
            {status === "completed" && "ภาพแนวคิดของคุณพร้อมแล้ว"}
            {status === "processing" && "กำลังสร้างภาพแนวคิด..."}
            {status === "pending" && "กำลังเตรียมการสร้างภาพ..."}
            {status === "failed" && "เกิดข้อผิดพลาด"}
            {!status && "กำลังโหลด..."}
          </h1>

          <p className="text-white/40 text-sm">
            หมายเลขคำขอ{" "}
            <span className="text-[#c9a84c] font-medium tracking-widest" data-testid="text-lead-id">#{id}</span>
          </p>

          {(status === "pending" || status === "processing") && (
            <p className="text-white/30 text-xs mt-4">
              โปรดรอสักครู่ ระบบกำลังประมวลผล...
            </p>
          )}

          {status === "completed" && (
            <p className="text-white/30 text-xs mt-2">
              ทีมงาน Daybuilt จะติดต่อกลับภายใน 24 ชั่วโมง
            </p>
          )}
        </div>

        {/* ── Error Display ────────────────────────────────────────────────── */}
        {status === "failed" && error && (
          <div className="border border-red-500/30 bg-red-500/5 p-6 mb-8" data-testid="text-failed-error">
            <p className="text-sm text-red-400 mb-1 font-medium">ไม่สามารถสร้างภาพได้</p>
            <p className="text-xs text-red-300/80">{error}</p>
            <p className="text-xs text-white/30 mt-3">
              ทีมงานได้รับแจ้งแล้ว และจะติดต่อกลับเพื่อช่วยเหลือ
            </p>
          </div>
        )}

        {statusQuery.isError && !authError && (
          <div className="border border-red-500/30 bg-red-500/5 p-6 mb-8" data-testid="text-status-error">
            <p className="text-sm text-red-400 mb-1 font-medium">ไม่สามารถโหลดสถานะได้</p>
            <p className="text-xs text-red-300/80">
              กรุณาตรวจสอบการเชื่อมต่อและลองรีเฟรชหน้านี้อีกครั้ง
            </p>
          </div>
        )}

        {/* ── Images Grid ──────────────────────────────────────────────────── */}
        {(sourceImageUrl || generatedImageUrl) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {sourceImageUrl && (
              <div>
                <p className="text-[10px] tracking-[0.2em] text-[#c9a84c] uppercase mb-3">ห้องต้นฉบับ</p>
                <img
                  src={sourceImageUrl}
                  alt="ห้องต้นฉบับ"
                  data-testid="img-source"
                  className="w-full h-auto object-cover border border-white/10"
                />
              </div>
            )}
            {generatedImageUrl && (
              <div>
                <p className="text-[10px] tracking-[0.2em] text-[#c9a84c] uppercase mb-3">ภาพแนวคิด AI</p>
                <img
                  src={generatedImageUrl}
                  alt="ภาพแนวคิด AI"
                  data-testid="img-generated"
                  className="w-full h-auto object-cover border border-white/10"
                />
              </div>
            )}
          </div>
        )}

        {/* ── Concept Summary ───────────────────────────────────────────────── */}
        {conceptSummary && (
          <div className="border border-white/10 bg-[#0f0f0f] p-6 mb-8" data-testid="text-concept-summary">
            <p className="text-[10px] tracking-[0.2em] text-[#c9a84c] uppercase mb-3">
              แนวคิดการออกแบบ
            </p>
            <p className="text-sm text-white/80 leading-relaxed">{conceptSummary}</p>
          </div>
        )}

        {/* ── Selections Summary ────────────────────────────────────────────── */}
        {selections && (
          <div className="border border-white/10 bg-[#0f0f0f] mb-8">
            <div className="px-6 py-4 border-b border-white/10">
              <p className="text-xs tracking-[0.2em] text-white/40 uppercase">สรุปคำขอออกแบบ</p>
            </div>
            <div className="px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                {selections.roomType && (
                  <div className="py-4 border-b border-white/5">
                    <p className="text-[10px] tracking-[0.2em] text-[#c9a84c] uppercase mb-1">ประเภทห้อง</p>
                    <p className="text-sm text-white">{selections.roomType}</p>
                  </div>
                )}
                {selections.roomSize && (
                  <div className="py-4 border-b border-white/5">
                    <p className="text-[10px] tracking-[0.2em] text-[#c9a84c] uppercase mb-1">ขนาดห้อง</p>
                    <p className="text-sm text-white">{selections.roomSize}</p>
                  </div>
                )}
                {selections.builtInType && (
                  <div className="py-4 border-b border-white/5">
                    <p className="text-[10px] tracking-[0.2em] text-[#c9a84c] uppercase mb-1">งานบิวท์อิน</p>
                    <p className="text-sm text-white">{selections.builtInType}</p>
                  </div>
                )}
                {selections.style && (
                  <div className="py-4 border-b border-white/5">
                    <p className="text-[10px] tracking-[0.2em] text-[#c9a84c] uppercase mb-1">สไตล์</p>
                    <p className="text-sm text-white">{selections.style}</p>
                  </div>
                )}
                {selections.colorTone && (
                  <div className="py-4 border-b border-white/5">
                    <p className="text-[10px] tracking-[0.2em] text-[#c9a84c] uppercase mb-1">โทนสี</p>
                    <p className="text-sm text-white">{selections.colorTone}</p>
                  </div>
                )}
                {budgetLabel && (
                  <div className="py-4 border-b border-white/5">
                    <p className="text-[10px] tracking-[0.2em] text-[#c9a84c] uppercase mb-1">งบประมาณ</p>
                    <p className="text-sm text-white">{budgetLabel}</p>
                  </div>
                )}
                {selections.timeline && (
                  <div className="py-4 border-b border-white/5">
                    <p className="text-[10px] tracking-[0.2em] text-[#c9a84c] uppercase mb-1">ช่วงเวลา</p>
                    <p className="text-sm text-white">{selections.timeline}</p>
                  </div>
                )}
                {keepLayoutLabel && (
                  <div className="py-4 border-b border-white/5">
                    <p className="text-[10px] tracking-[0.2em] text-[#c9a84c] uppercase mb-1">Layout</p>
                    <p className="text-sm text-white">{keepLayoutLabel}</p>
                  </div>
                )}
                {selections.description && (
                  <div className="md:col-span-2 py-4 border-b border-white/5">
                    <p className="text-[10px] tracking-[0.2em] text-[#c9a84c] uppercase mb-1">รายละเอียดเพิ่มเติม</p>
                    <p className="text-sm text-white/80">{selections.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── AI Note ───────────────────────────────────────────────────────── */}
        {status === "completed" && (
          <div className="border border-white/10 bg-[#111] p-6 mb-8">
            <p className="text-[10px] tracking-[0.2em] text-[#c9a84c] uppercase mb-2">
              หมายเหตุ
            </p>
            <p className="text-xs text-white/50 leading-relaxed">
              AI Concept Preview — not final construction drawing
            </p>
            <p className="mt-2 text-xs text-white/50 leading-relaxed">
              ภาพนี้เป็นแนวคิดเบื้องต้น ทีมจะส่งแบบรายละเอียดให้ภายหลัง
            </p>
          </div>
        )}

        {/* ── Lead Saved Confirmation ───────────────────────────────────────── */}
        {status === "completed" && (
          <div className="border border-emerald-500/30 bg-emerald-500/5 p-6 mb-8" data-testid="text-saved-confirmation">
            <p className="text-sm text-emerald-400 mb-1 font-medium">บันทึกคำขอเรียบร้อยแล้ว</p>
            <p className="text-xs text-emerald-300/70">
              ข้อมูลของคุณถูกบันทึกไว้แล้ว ทีมจะติดต่อกลับเพื่อนำเสนอใบเสนอราคาและรายละเอียด
            </p>
          </div>
        )}

        {/* ── CTAs ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/contact"
            data-testid="link-contact"
            className="border border-white/20 text-white px-8 py-3 text-sm tracking-wide hover:bg-white/5 transition-colors text-center"
          >
            ติดต่อ Daybuilt
          </a>
          {status === "completed" && (
            <a
              href="/contact"
              data-testid="link-request-quotation"
              className="bg-[#c9a84c] text-black px-8 py-3 text-sm font-medium tracking-wide hover:bg-[#b8943d] transition-colors text-center"
            >
              ขอใบเสนอราคา
            </a>
          )}
          {status !== "completed" && (
            <a
              href="/"
              data-testid="link-home"
              className="bg-[#c9a84c] text-black px-8 py-3 text-sm font-medium tracking-wide hover:bg-[#b8943d] transition-colors text-center"
            >
              กลับสู่หน้าหลัก
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
