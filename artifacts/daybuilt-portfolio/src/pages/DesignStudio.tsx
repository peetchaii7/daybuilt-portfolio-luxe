import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ChevronRight, UploadCloud, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubmitLead } from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

const STYLES = [
  { id: "minimal", name: "มินิมอล (Minimal)", desc: "เรียบ สะอาด ไร้กาลเวลา", bg: "bg-gradient-to-br from-stone-100 to-stone-300 dark:from-stone-800 dark:to-stone-900" },
  { id: "modern-luxury", name: "Modern Luxury", desc: "หรูหรา เข้มแข็ง ร่วมสมัย", bg: "bg-gradient-to-br from-zinc-800 to-black border border-primary/30" },
  { id: "industrial", name: "ลอฟท์ (Industrial)", desc: "อิฐ คอนกรีต โลหะ", bg: "bg-gradient-to-br from-neutral-600 to-neutral-800" },
  { id: "japandi", name: "จาปันดี (Japandi)", desc: "ธรรมชาติ เงียบสงบ", bg: "bg-gradient-to-br from-orange-50 to-amber-100 dark:from-amber-900/40 dark:to-orange-950/40" },
  { id: "classic-thai", name: "คลาสสิคไทย", desc: "ภูมิปัญญา ลวดลาย งานช่าง", bg: "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-700 via-amber-900 to-black" },
];

const ROOM_TYPES = ["ห้องนอนหลัก", "ห้องนอนรอง", "ห้องนั่งเล่น", "ห้องครัว", "ห้องน้ำ", "ห้องทำงาน", "ห้องอาหาร", "ห้องเอนกประสงค์"];
const BUILT_IN_TYPES = ["ตู้เสื้อผ้า", "ครัวบิวท์อิน", "โต๊ะทำงาน", "ชั้นวางของ", "Headboard", "ตู้รองเท้า", "อื่นๆ"];
const MATERIALS = ["ลามิเนต", "อะคริลิก", "ไม้จริง", "ไม้MDF", "ยังไม่แน่ใจ"];
const BUDGETS = ["ต่ำกว่า 50,000", "50,000-100,000", "100,000-250,000", "250,000-500,000", "มากกว่า 500,000"];
const CONTACT_TIMES = ["เช้า 9-12", "บ่าย 13-17", "เย็น 17-19", "ไม่มีข้อกำหนด"];

const formSchema = z.object({
  roomType: z.string({ required_error: "กรุณาเลือกประเภทห้อง" }),
  roomSize: z.string().min(1, "กรุณาระบุขนาดห้อง"),
  builtInType: z.string({ required_error: "กรุณาเลือกประเภทงาน" }),
  materials: z.string({ required_error: "กรุณาเลือกวัสดุ" }),
  budget: z.string({ required_error: "กรุณาเลือกงบประมาณ" }),
  name: z.string().min(2, "กรุณากรอกชื่อ-นามสกุล"),
  phone: z.string().min(9, "กรุณากรอกเบอร์โทรศัพท์"),
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  contactTime: z.string({ required_error: "กรุณาเลือกเวลาติดต่อ" }),
  notes: z.string().optional(),
});

export default function DesignStudio() {
  const { toast } = useToast();
  const { mutateAsync: submitLead, isPending } = useSubmitLead();
  
  const [step, setStep] = useState(1);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  
  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (res) => {
      setUploadedImageUrl(res.objectPath);
      toast({ title: "อัปโหลดรูปภาพสำเร็จ" });
    },
    onError: () => {
      toast({ title: "อัปโหลดรูปภาพไม่สำเร็จ", variant: "destructive" });
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomSize: "",
      notes: "",
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)", variant: "destructive" });
      return;
    }
    uploadFile(file);
  };

  const nextStep = async () => {
    if (step === 1) {
      if (!selectedStyle) {
        toast({ title: "กรุณาเลือกสไตล์การออกแบบ", variant: "destructive" });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const isValid = await form.trigger(["roomType", "roomSize", "builtInType", "materials", "budget"]);
      if (isValid) setStep(3);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const styleName = STYLES.find(s => s.id === selectedStyle)?.name;
      const desc = `สไตล์: ${styleName} | งบ: ${values.budget} | เวลาติดต่อ: ${values.contactTime}. ${values.notes || ""}`;
      
      await submitLead({
        data: {
          source: "design-studio",
          name: values.name,
          email: values.email,
          phone: values.phone,
          roomType: values.roomType,
          roomSize: values.roomSize,
          builtInType: values.builtInType,
          materials: values.materials,
          description: desc,
          imageUrl: uploadedImageUrl || undefined,
        }
      });
      
      toast({
        title: "ส่งข้อมูลสำเร็จ",
        description: "ทีมออกแบบของเราจะติดต่อกลับไปตามเวลาที่คุณสะดวก",
      });
      setStep(1);
      setSelectedStyle(null);
      setUploadedImageUrl(null);
      form.reset();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full pt-24 min-h-screen bg-background pb-24">
      {/* Header */}
      <section className="py-12 border-b border-border text-center px-6">
        <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-4">
          Design Studio
        </h1>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto">
          ร่วมออกแบบพื้นที่ในฝันกับเราใน 3 ขั้นตอนง่ายๆ
        </p>
        
        {/* Progress */}
        <div className="flex justify-center items-center gap-4 mt-8 max-w-md mx-auto">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-serif transition-colors ${
                step === s ? "bg-primary text-primary-foreground" : step > s ? "bg-primary/20 text-primary" : "bg-card border border-border text-muted-foreground"
              }`}>
                {step > s ? <CheckCircle2 size={14} /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-px ${step > s ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            
            {/* STEP 1 */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center mb-10">
                    <h2 className="text-2xl font-serif text-foreground">เลือกสไตล์ที่คุณชื่นชอบ</h2>
                    <p className="text-sm text-muted-foreground mt-2">เลือกสไตล์ที่เป็นตัวคุณ เพื่อให้ทีมงานเข้าใจแนวทางเบื้องต้น</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {STYLES.map((style) => (
                      <button
                        type="button"
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`group relative overflow-hidden rounded-none border transition-all duration-300 ${
                          selectedStyle === style.id ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className={`w-full h-40 ${style.bg} opacity-80 group-hover:opacity-100 transition-opacity`} />
                        <div className="p-5 bg-card text-left">
                          <h3 className={`font-serif text-lg mb-1 ${selectedStyle === style.id ? "text-primary" : "text-foreground"}`}>
                            {style.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">{style.desc}</p>
                        </div>
                        {selectedStyle === style.id && (
                          <div className="absolute top-4 right-4 bg-primary text-primary-foreground rounded-full p-1">
                            <CheckCircle2 size={16} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-end pt-8 border-t border-border">
                    <Button type="button" onClick={nextStep} className="bg-primary text-primary-foreground rounded-none px-8 py-6 font-serif tracking-widest text-sm">
                      ขั้นตอนต่อไป <ChevronRight size={16} className="ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center mb-10">
                    <h2 className="text-2xl font-serif text-foreground">รายละเอียดห้องของคุณ</h2>
                    <p className="text-sm text-muted-foreground mt-2">ให้ข้อมูลเพิ่มเติมเพื่อการประเมินราคาที่แม่นยำ</p>
                  </div>

                  <div className="bg-card border border-border p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="roomType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">ประเภทห้อง</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background border-border/50 rounded-none focus:ring-primary">
                                <SelectValue placeholder="เลือกประเภทห้อง" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-none">
                              {ROOM_TYPES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="roomSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">ขนาดพื้นที่โดยประมาณ (ตร.ม.)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="เช่น 20" className="bg-background border-border/50 rounded-none focus-visible:ring-primary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="builtInType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">ประเภทงานบิวท์อินที่ต้องการ</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background border-border/50 rounded-none focus:ring-primary">
                                <SelectValue placeholder="เลือกประเภทงาน" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-none">
                              {BUILT_IN_TYPES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="materials"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">วัสดุที่สนใจ</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background border-border/50 rounded-none focus:ring-primary">
                                <SelectValue placeholder="เลือกวัสดุ" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-none">
                              {MATERIALS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">งบประมาณที่ตั้งไว้ (บาท)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-background border-border/50 rounded-none focus:ring-primary">
                                  <SelectValue placeholder="เลือกช่วงงบประมาณ" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-none">
                                {BUDGETS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="bg-card border border-border p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-sm font-serif text-foreground mb-4">อัปโหลดภาพห้องปัจจุบัน (ถ้ามี)</h3>
                      <div className="border-2 border-dashed border-border/60 bg-background/50 p-6 flex flex-col items-center justify-center text-center relative hover:border-primary/50 transition-colors">
                        <UploadCloud size={32} className="text-muted-foreground mb-4" />
                        <p className="text-sm text-foreground mb-1">ลากไฟล์มาวาง หรือ คลิกเพื่ออัปโหลด</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG, WEBP (สูงสุด 10MB)</p>
                        <input 
                          type="file" 
                          accept="image/jpeg,image/png,image/webp" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                        />
                      </div>
                      
                      {isUploading && (
                        <div className="mt-4">
                          <div className="flex justify-between text-xs mb-1">
                            <span>กำลังอัปโหลด...</span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-1 rounded-none" />
                        </div>
                      )}

                      {uploadedImageUrl && (
                        <div className="mt-4 flex items-center gap-4 bg-background p-2 border border-border">
                          <img src={`/api/storage/objects/${uploadedImageUrl}`} alt="Uploaded thumbnail" className="w-12 h-12 object-cover" />
                          <div className="text-xs text-primary flex items-center gap-1"><CheckCircle2 size={14} /> อัปโหลดสำเร็จ</div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-serif text-foreground mb-4">AI Render Preview</h3>
                      <div className="border border-border bg-background p-6 h-full min-h-[160px] flex flex-col items-center justify-center text-center opacity-70 relative overflow-hidden">
                        <div className="absolute top-2 right-2 bg-primary/20 text-primary text-[10px] px-2 py-0.5 tracking-widest uppercase border border-primary/20">Coming Soon</div>
                        <Lock size={24} className="text-muted-foreground mb-3" />
                        <p className="text-sm text-foreground font-serif">กำลังเตรียมระบบ</p>
                        <p className="text-xs text-muted-foreground mt-1">ฟีเจอร์จำลองห้องด้วย AI จะพร้อมใช้งานเร็วๆ นี้</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-8 border-t border-border">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-none px-6 py-6 font-serif tracking-widest text-sm border-border">
                      ย้อนกลับ
                    </Button>
                    <Button type="button" onClick={nextStep} className="bg-primary text-primary-foreground rounded-none px-8 py-6 font-serif tracking-widest text-sm">
                      ขั้นตอนต่อไป <ChevronRight size={16} className="ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center mb-10">
                    <h2 className="text-2xl font-serif text-foreground">ข้อมูลติดต่อของคุณ</h2>
                    <p className="text-sm text-muted-foreground mt-2">เพื่อให้ทีมงานติดต่อกลับไปพร้อมรายละเอียดและใบเสนอราคาเบื้องต้น</p>
                  </div>

                  <div className="bg-card border border-border p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">ชื่อ-นามสกุล <span className="text-primary">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="เช่น สมชาย ใจดี" className="bg-background border-border/50 rounded-none focus-visible:ring-primary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">เบอร์โทรศัพท์ <span className="text-primary">*</span></FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="08X-XXX-XXXX" className="bg-background border-border/50 rounded-none focus-visible:ring-primary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">อีเมล <span className="text-primary">*</span></FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="example@email.com" className="bg-background border-border/50 rounded-none focus-visible:ring-primary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">เวลาที่สะดวกให้ติดต่อกลับ <span className="text-primary">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background border-border/50 rounded-none focus:ring-primary">
                                <SelectValue placeholder="เลือกเวลา" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-none">
                              {CONTACT_TIMES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">ข้อความเพิ่มเติม (ไม่บังคับ)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="รายละเอียดความต้องการพิเศษอื่นๆ..." className="bg-background border-border/50 rounded-none focus-visible:ring-primary min-h-[100px] resize-none" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-8 border-t border-border">
                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="rounded-none px-6 py-6 font-serif tracking-widest text-sm border-border">
                      ย้อนกลับ
                    </Button>
                    <Button type="submit" disabled={isPending} className="bg-primary text-primary-foreground rounded-none px-10 py-6 font-serif tracking-widest text-sm">
                      {isPending ? "กำลังส่งข้อมูล..." : "ส่งข้อมูลติดต่อ"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </Form>
      </div>
    </div>
  );
}
