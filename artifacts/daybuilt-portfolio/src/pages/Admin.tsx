import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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
import { LogOut } from "lucide-react";

export default function Admin() {
  const { toast } = useToast();
  
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [loginInput, setLoginInput] = useState("");
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem("daybuilt_admin_key");
    if (savedKey) {
      setAdminKey(savedKey);
    }
  }, []);

  useEffect(() => {
    if (adminKey) {
      fetchLeads();
    }
  }, [adminKey]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput) return;
    localStorage.setItem("daybuilt_admin_key", loginInput);
    setAdminKey(loginInput);
    setLoginInput("");
  };

  const handleLogout = () => {
    localStorage.removeItem("daybuilt_admin_key");
    setAdminKey(null);
    setLeads([]);
  };

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/leads", {
        headers: { "x-admin-key": adminKey || "" }
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          handleLogout();
          toast({ title: "Session Expired", variant: "destructive" });
          return;
        }
        throw new Error("Failed to fetch");
      }
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      toast({ title: "Error fetching leads", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/leads/${id}/status`, {
        method: "PATCH",
        headers: { 
          "x-admin-key": adminKey || "",
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update");
      toast({ title: "อัปเดตสถานะสำเร็จ" });
      fetchLeads();
    } catch (err) {
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    }
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
                placeholder="Admin Key" 
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                className="bg-background border-border/50 rounded-none focus-visible:ring-primary h-12 text-center"
              />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none py-6 font-serif tracking-widest uppercase text-sm">
              เข้าสู่ระบบ
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Calculate summaries
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
          <Button variant="outline" onClick={handleLogout} className="border-border rounded-none tracking-widest text-xs uppercase text-muted-foreground hover:text-foreground">
            <LogOut size={14} className="mr-2" /> Logout
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-card border border-border p-6 text-center">
            <p className="text-3xl font-serif text-foreground">{total}</p>
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground mt-2">ทั้งหมด</p>
          </div>
          <div className="bg-card border border-amber-500/30 p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-amber-500/5" />
            <p className="text-3xl font-serif text-amber-500 relative z-10">{newLeads}</p>
            <p className="text-[10px] tracking-widest uppercase text-amber-500/70 mt-2 relative z-10">ใหม่</p>
          </div>
          <div className="bg-card border border-blue-500/30 p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/5" />
            <p className="text-3xl font-serif text-blue-500 relative z-10">{contactedLeads}</p>
            <p className="text-[10px] tracking-widest uppercase text-blue-500/70 mt-2 relative z-10">ติดต่อแล้ว</p>
          </div>
          <div className="bg-card border border-emerald-500/30 p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-emerald-500/5" />
            <p className="text-3xl font-serif text-emerald-500 relative z-10">{closedLeads}</p>
            <p className="text-[10px] tracking-widest uppercase text-emerald-500/70 mt-2 relative z-10">ปิดงาน</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">กำลังโหลดข้อมูล...</div>
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
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">ภาพห้อง</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">สถานะ</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest text-right">เปลี่ยนสถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id} className="border-border border-t hover:bg-white/[0.02]">
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
                        <p className="text-xs text-foreground/80 line-clamp-2" title={lead.description || ""}>
                          {lead.description || "-"}
                        </p>
                        <div className="mt-2 space-y-1">
                          {lead.roomType && <p className="text-[10px] text-muted-foreground">ห้อง: {lead.roomType} ({lead.roomSize} ตร.ม.)</p>}
                          {lead.style && <div className="text-xs text-muted-foreground mt-1">{lead.style} · {lead.colorTone}</div>}
                          {lead.builtInType && <p className="text-[10px] text-muted-foreground">แบบ: {lead.builtInType} ({lead.materials})</p>}
                          {lead.budgetMin && <p className="text-[10px] text-muted-foreground">งบ: {formatThb(lead.budgetMin)} - {formatThb(lead.budgetMax)}</p>}
                          {lead.timeline && <div className="text-xs text-muted-foreground mt-1">{lead.timeline}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="align-top pt-4">
                        {lead.imageUrl ? (
                          <a href={`/api/storage/objects/${lead.imageUrl}`} target="_blank" rel="noreferrer">
                            <img src={`/api/storage/objects/${lead.imageUrl}`} alt="Room" className="w-16 h-16 object-cover border border-border hover:opacity-80 transition-opacity" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="align-top pt-4">
                        {getStatusBadge(lead.status)}
                      </TableCell>
                      <TableCell className="align-top pt-4 text-right">
                        <Select 
                          defaultValue={lead.status} 
                          onValueChange={(val) => updateStatus(lead.id, val)}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs bg-background border-border rounded-none ml-auto">
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
