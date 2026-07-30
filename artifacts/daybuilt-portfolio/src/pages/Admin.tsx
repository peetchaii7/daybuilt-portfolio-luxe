import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useGetLeads, getGetLeadsQueryKey, useUpdateLeadStatus, useRetryLeadGeneration, useGetLeadImage, getGetLeadImageQueryKey } from "@workspace/api-client-react";
import type { LeadRecord } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogOut, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [loginInput, setLoginInput] = useState("");

  useEffect(() => {
    const savedKey = localStorage.getItem("daybuilt_admin_key");
    if (savedKey) {
      setAdminKey(savedKey);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput) return;
    queryClient.clear();
    localStorage.setItem("daybuilt_admin_key", loginInput);
    setAdminKey(loginInput);
    setLoginInput("");
  };

  const handleLogout = () => {
    queryClient.clear();
    localStorage.removeItem("daybuilt_admin_key");
    setAdminKey(null);
  };

  // Fetch leads
  const leadsQuery = useGetLeads({
    query: {
      enabled: !!adminKey,
      queryKey: getGetLeadsQueryKey(),
    },
    request: {
      headers: adminKey ? { "x-admin-key": adminKey } : {},
    },
  });

  // Handle 401/403 errors
  useEffect(() => {
    if (leadsQuery.error) {
      const err = leadsQuery.error as any;
      if (err?.status === 401 || err?.status === 403) {
        handleLogout();
        toast({ title: "Session Expired", variant: "destructive" });
      } else if (err?.status === 503) {
        toast({
          title: "Configuration Error",
          description: "ADMIN_KEY or AI provider is not configured on the server.",
          variant: "destructive",
        });
      }
    }
  }, [leadsQuery.error]);

  // Update status mutation
  const updateStatus = useUpdateLeadStatus({
    mutation: {
      onSuccess: () => {
        toast({ title: "อัปเดตสถานะสำเร็จ" });
        queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
      },
      onError: (err: any) => {
        if (err?.status === 503) {
          toast({
            title: "Configuration Error",
            description: "Server configuration issue.",
            variant: "destructive",
          });
        } else {
          toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
        }
      },
    },
    request: {
      headers: adminKey ? { "x-admin-key": adminKey } : {},
    },
  });

  // Retry generation mutation
  const retryGeneration = useRetryLeadGeneration({
    mutation: {
      onSuccess: () => {
        toast({ title: "เริ่มการสร้างภาพใหม่สำเร็จ" });
        queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
      },
      onError: (err: any) => {
        const errorData = err?.data?.error || err?.message;
        if (err?.status === 503) {
          toast({
            title: "AI Provider Not Configured",
            description: "AI provider or ADMIN_KEY is not configured on the server.",
            variant: "destructive",
          });
        } else if (errorData) {
          toast({ title: "ไม่สามารถ Retry ได้", description: errorData, variant: "destructive" });
        } else {
          toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
        }
      },
    },
    request: {
      headers: adminKey ? { "x-admin-key": adminKey } : {},
    },
  });

  const handleUpdateStatus = (id: number, status: string) => {
    updateStatus.mutate({ id, data: { status: status as any } });
  };

  const handleRetry = (id: number) => {
    retryGeneration.mutate({ id });
  };

  const isRetryableGeneration = (lead: LeadRecord) => {
    if (lead.aiStatus === "failed") return true;
    if (lead.aiStatus !== "processing" || !lead.aiStartedAt) return false;
    return Date.now() - new Date(lead.aiStartedAt).getTime() > 120_000;
  };

  const formatThb = (val: number | null) => {
    if (!val) return "-";
    return `฿${new Intl.NumberFormat("th-TH").format(val)}`;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string, color: string }> = {
      "new": { label: "ใหม่", color: "bg-amber-500/20 text-amber-500 border-amber-500/30" },
      "contacted": { label: "ติดต่อแล้ว", color: "bg-blue-500/20 text-blue-500 border-blue-500/30" },
      "quoted": { label: "ส่งใบเสนอราคา", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
      "closed": { label: "ปิดงาน", color: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" }
    };
    const mapped = map[status] || { label: status, color: "bg-muted text-muted-foreground border-border" };
    return <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest border ${mapped.color}`}>{mapped.label}</span>;
  };

  const getAiStatusBadge = (status: string | null | undefined) => {
    if (!status) return null;
    const map: Record<string, { label: string, color: string, icon?: any }> = {
      "pending": { label: "รอสร้าง", color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" },
      "processing": { label: "กำลังสร้าง", color: "bg-blue-500/20 text-blue-500 border-blue-500/30", icon: Loader2 },
      "completed": { label: "สำเร็จ", color: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" },
      "failed": { label: "ล้มเหลว", color: "bg-red-500/20 text-red-500 border-red-500/30", icon: AlertCircle }
    };
    const mapped = map[status] || { label: status, color: "bg-muted text-muted-foreground border-border" };
    const Icon = mapped.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-widest border ${mapped.color}`}>
        {Icon && <Icon size={10} className={status === "processing" ? "animate-spin" : ""} />}
        {mapped.label}
      </span>
    );
  };

  const getSourceBadge = (source: string) => {
    const map: Record<string, string> = {
      "contact": "ฟอร์มติดต่อ",
      "estimator": "Estimator",
      "design-studio": "Design Studio"
    };
    return <span className="px-2 py-0.5 text-[10px] bg-card border border-border text-muted-foreground tracking-widest">{map[source] || source}</span>;
  };

  if (!adminKey) {
    return (
      <div className="w-full pt-24 min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full border border-border bg-card p-10 shadow-2xl">
          <h1 className="text-3xl font-serif text-foreground mb-2 text-center">Admin Portal</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูลลูกค้า</p>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Input 
                type="password" 
                data-testid="input-admin-key"
                placeholder="Admin Key" 
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                className="bg-background border-border/50 rounded-none focus-visible:ring-primary h-12 text-center"
              />
            </div>
            <Button type="submit" data-testid="button-login" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none py-6 font-serif tracking-widest uppercase text-sm">
              เข้าสู่ระบบ
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const leads = leadsQuery.data?.leads || [];
  const total = leads.length;
  const newLeads = leads.filter(l => l.status === "new").length;
  const contactedLeads = leads.filter(l => l.status === "contacted").length;
  const closedLeads = leads.filter(l => l.status === "closed").length;

  return (
    <div className="w-full pt-24 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="flex justify-between items-center mb-10 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-serif text-foreground">จัดการ Lead</h1>
            <p className="text-sm text-muted-foreground mt-2">ข้อมูลลูกค้าจากทุกช่องทาง</p>
          </div>
          <Button
            variant="outline"
            data-testid="button-logout"
            onClick={handleLogout}
            className="border-border rounded-none tracking-widest text-xs uppercase text-muted-foreground hover:text-foreground"
          >
            <LogOut size={14} className="mr-2" /> Logout
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-card border border-border p-6 text-center">
            <p className="text-3xl font-serif text-foreground" data-testid="text-total-count">{total}</p>
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground mt-2">ทั้งหมด</p>
          </div>
          <div className="bg-card border border-amber-500/30 p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-amber-500/5" />
            <p className="text-3xl font-serif text-amber-500 relative z-10" data-testid="text-new-count">{newLeads}</p>
            <p className="text-[10px] tracking-widest uppercase text-amber-500/70 mt-2 relative z-10">ใหม่</p>
          </div>
          <div className="bg-card border border-blue-500/30 p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/5" />
            <p className="text-3xl font-serif text-blue-500 relative z-10" data-testid="text-contacted-count">{contactedLeads}</p>
            <p className="text-[10px] tracking-widest uppercase text-blue-500/70 mt-2 relative z-10">ติดต่อแล้ว</p>
          </div>
          <div className="bg-card border border-emerald-500/30 p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-emerald-500/5" />
            <p className="text-3xl font-serif text-emerald-500 relative z-10" data-testid="text-closed-count">{closedLeads}</p>
            <p className="text-[10px] tracking-widest uppercase text-emerald-500/70 mt-2 relative z-10">ปิดงาน</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border overflow-hidden">
          {leadsQuery.isLoading ? (
            <div className="p-12 text-center text-muted-foreground">กำลังโหลดข้อมูล...</div>
          ) : leadsQuery.isError ? (
            <div className="p-12 text-center" data-testid="text-admin-api-error">
              <AlertCircle className="mx-auto mb-3 text-red-400" size={28} />
              <p className="text-sm text-red-400">
                {(leadsQuery.error as any)?.status === 503
                  ? "ระบบผู้ดูแลยังไม่ได้ตั้งค่า ADMIN_KEY บนเซิร์ฟเวอร์"
                  : "ไม่สามารถโหลดข้อมูล Lead ได้"}
              </p>
            </div>
          ) : leads.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-muted-foreground">ยังไม่มี Lead เข้ามา</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">วันที่</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">ข้อมูลลูกค้า</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">แหล่งที่มา</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">รายละเอียด</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">AI Status</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">ภาพ</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">สถานะ</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead: LeadRecord) => (
                    <TableRow key={lead.id} className="border-border border-t hover:bg-white/[0.02]" data-testid={`row-lead-${lead.id}`}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap align-top pt-4">
                        {format(new Date(lead.createdAt), "dd MMM yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="align-top pt-4">
                        <p className="text-sm font-medium text-foreground">{lead.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{lead.phone || "-"}</p>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                      </TableCell>
                      <TableCell className="align-top pt-4">
                        {getSourceBadge(lead.source)}
                      </TableCell>
                      <TableCell className="align-top pt-4 max-w-xs">
                        {lead.description && (
                          <p className="text-xs text-foreground/80 line-clamp-2 mb-2" title={lead.description}>
                            {lead.description}
                          </p>
                        )}
                        <div className="space-y-1">
                          {lead.roomType && <p className="text-[10px] text-muted-foreground">ห้อง: {lead.roomType} ({lead.roomSize})</p>}
                          {lead.style && <p className="text-[10px] text-muted-foreground">{lead.style} · {lead.colorTone}</p>}
                          {lead.builtInType && <p className="text-[10px] text-muted-foreground">แบบ: {lead.builtInType}</p>}
                          {lead.budgetMin && <p className="text-[10px] text-muted-foreground">งบ: {formatThb(lead.budgetMin)} - {formatThb(lead.budgetMax || null)}</p>}
                          {lead.timeline && <p className="text-[10px] text-muted-foreground">{lead.timeline}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="align-top pt-4">
                        <div className="space-y-2">
                          {getAiStatusBadge(lead.aiStatus)}
                          {lead.aiProvider && (
                            <p className="text-[10px] text-muted-foreground">
                              {lead.aiProvider} · {lead.aiModel}
                            </p>
                          )}
                          {lead.aiAttempts !== null && lead.aiAttempts !== undefined && (
                            <p className="text-[10px] text-muted-foreground">
                              Attempts: {lead.aiAttempts}
                            </p>
                          )}
                          {lead.aiError && (
                            <p className="text-[10px] text-red-400 line-clamp-2" title={lead.aiError}>
                              {lead.aiError}
                            </p>
                          )}
                          {lead.aiErrorDetail && (
                            <p className="text-[9px] text-red-300/50 line-clamp-2" title={lead.aiErrorDetail}>
                              Detail: {lead.aiErrorDetail}
                            </p>
                          )}
                          {isRetryableGeneration(lead) && (
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={`button-retry-${lead.id}`}
                              disabled={retryGeneration.isPending}
                              onClick={() => handleRetry(lead.id)}
                              className="h-6 text-[10px] px-2 rounded-none"
                            >
                              <RefreshCw size={10} className="mr-1" />
                              Retry
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-top pt-4">
                        <AdminLeadImages leadId={lead.id} adminKey={adminKey} hasSource={!!lead.sourceImageUrl} hasGenerated={!!lead.generatedImageUrl} />
                      </TableCell>
                      <TableCell className="align-top pt-4">
                        {getStatusBadge(lead.status)}
                      </TableCell>
                      <TableCell className="align-top pt-4 text-right">
                        <Select 
                          defaultValue={lead.status} 
                          onValueChange={(val) => handleUpdateStatus(lead.id, val)}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs bg-background border-border rounded-none ml-auto" data-testid={`select-status-${lead.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-none">
                            <SelectItem value="new" className="text-xs">ใหม่</SelectItem>
                            <SelectItem value="contacted" className="text-xs">ติดต่อแล้ว</SelectItem>
                            <SelectItem value="quoted" className="text-xs">ส่งใบเสนอราคา</SelectItem>
                            <SelectItem value="closed" className="text-xs">ปิดงาน</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Admin Lead Images Component ──────────────────────────────────────────────

function AdminLeadImages({ leadId, adminKey, hasSource, hasGenerated }: { leadId: number; adminKey: string; hasSource: boolean; hasGenerated: boolean }) {
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const sourceQuery = useGetLeadImage(leadId, "source", {
    query: {
      enabled: hasSource,
      queryKey: [...getGetLeadImageQueryKey(leadId, "source"), "admin"],
    },
    request: {
      headers: { "x-admin-key": adminKey },
    },
  });

  const generatedQuery = useGetLeadImage(leadId, "generated", {
    query: {
      enabled: hasGenerated,
      queryKey: [...getGetLeadImageQueryKey(leadId, "generated"), "admin"],
    },
    request: {
      headers: { "x-admin-key": adminKey },
    },
  });

  useEffect(() => {
    if (sourceQuery.data) {
      const url = URL.createObjectURL(sourceQuery.data);
      setSourceUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    return undefined;
  }, [sourceQuery.data]);

  useEffect(() => {
    if (generatedQuery.data) {
      const url = URL.createObjectURL(generatedQuery.data);
      setGeneratedUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    return undefined;
  }, [generatedQuery.data]);

  if (!hasSource && !hasGenerated) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <div className="flex gap-2">
      {sourceUrl && (
        <a href={sourceUrl} target="_blank" rel="noreferrer" data-testid={`img-source-${leadId}`}>
          <img src={sourceUrl} alt="Source" className="w-12 h-12 object-cover border border-border hover:opacity-80 transition-opacity" />
        </a>
      )}
      {generatedUrl && (
        <a href={generatedUrl} target="_blank" rel="noreferrer" data-testid={`img-generated-${leadId}`}>
          <img src={generatedUrl} alt="Generated" className="w-12 h-12 object-cover border border-emerald-500/50 hover:opacity-80 transition-opacity" />
        </a>
      )}
    </div>
  );
}
