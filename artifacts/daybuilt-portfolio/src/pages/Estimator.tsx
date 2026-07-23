import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useSubmitLead } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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
import { CheckCircle2, ChevronDown, Cpu, Sparkles } from "lucide-react";

// Data config
const BUILT_IN_TYPES = [
  { id: "ครัวบิวท์อิน", label: "ครัวบิวท์อิน", desc: "เคาน์เตอร์ ตู้ลอย และไอส์แลนด์" },
  { id: "ตู้เสื้อผ้า", label: "ตู้เสื้อผ้า", desc: "ตู้เสื้อผ้าแบบบานเปิดหรือบานเลื่อน" },
  { id: "ห้องทำงาน", label: "ห้องทำงาน", desc: "โต๊ะทำงาน ชั้นวางหนังสือ และตู้เก็บเอกสาร" },
  { id: "ตู้รองเท้า", label: "ตู้รองเท้า", desc: "ตู้รองเท้าบริเวณโถงทางเข้า" },
  { id: "ชั้นวาง/Display", label: "ชั้นวาง/Display", desc: "ชั้นโชว์ของ หรือผนังทีวี" },
];

const MATERIALS = [
  { id: "ลามิเนต", label: "ลามิเนต (Laminate)", desc: "ปิดผิวด้วยลามิเนต ทนรอยขีดข่วน ดูแลรักษาง่าย" },
  { id: "อะคริลิก", label: "อะคริลิก (Acrylic)", desc: "ผิวเงางาม ไร้รอยต่อ หรูหราทันสมัย" },
  { id: "ไม้จริง", label: "ไม้จริง / วีเนียร์", desc: "สวยงามเป็นธรรมชาติ ให้สัมผัสอบอุ่นและมีคุณค่า" },
];

const PRICE_MATRIX: Record<string, Record<string, [number, number]>> = {
  "ครัวบิวท์อิน": {
    "ลามิเนต": [4500, 8000],
    "อะคริลิก": [8000, 15000],
    "ไม้จริง": [15000, 28000],
  },
  "ตู้เสื้อผ้า": {
    "ลามิเนต": [3500, 6000],
    "อะคริลิก": [6000, 12000],
    "ไม้จริง": [12000, 22000],
  },
  "ห้องทำงาน": {
    "ลามิเนต": [3000, 5500],
    "อะคริลิก": [5500, 10000],
    "ไม้จริง": [10000, 20000],
  },
  "ตู้รองเท้า": {
    "ลามิเนต": [2500, 4500],
    "อะคริลิก": [4500, 9000],
    "ไม้จริง": [9000, 18000],
  },
  "ชั้นวาง/Display": {
    "ลามิเนต": [2000, 4000],
    "อะคริลิก": [4000, 8000],
    "ไม้จริง": [8000, 16000],
  },
};

const formSchema = z.object({
  name: z.string().min(2, "กรุณากรอกชื่อ-นามสกุล"),
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  phone: z.string().min(9, "กรุณากรอกเบอร์โทรศัพท์"),
  description: z.string().optional(),
});

function formatThb(value: number): string {
  return new Intl.NumberFormat("th-TH").format(value);
}

export default function Estimator() {
  const { toast } = useToast();
  const { mutateAsync: submitLead, isPending } = useSubmitLead();

  const [builtInType, setBuiltInType] = useState<string>("ครัวบิวท์อิน");
  const [material, setMaterial] = useState<string>("ลามิเนต");
  const [area, setArea] = useState<number[]>([10]);

  const [minPrice, maxPrice] = useMemo(() => {
    const range = PRICE_MATRIX[builtInType]?.[material] || [0, 0];
    return [range[0] * area[0], range[1] * area[0]];
  }, [builtInType, material, area]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      description: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await submitLead({
        data: {
          source: "estimator",
          name: values.name,
          email: values.email,
          phone: values.phone,
          description: values.description,
          builtInType: builtInType,
          materials: material,
          roomSize: area[0].toString(),
          budgetMin: minPrice,
          budgetMax: maxPrice,
        }
      });
      toast({
        title: "ส่งข้อมูลสำเร็จ",
        description: "ทีมงานได้รับรายละเอียดการประเมินราคาของคุณแล้ว และจะติดต่อกลับเร็วๆ นี้",
      });
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
      <section className="py-16 bg-background border-b border-border text-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-6">
            Premium Estimator<br />
            <span className="text-primary italic">ประเมินราคางานบิวท์อิน</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto leading-relaxed border border-primary/20 bg-primary/5 p-4">
            <Sparkles size={14} className="inline mr-2 text-primary" />
            ราคาที่แสดงเป็นการประเมินเบื้องต้นเท่านั้น ราคาจริงขึ้นอยู่กับความซับซ้อนของงานและวัสดุจริง กรุณาติดต่อทีมงานเพื่อรับใบเสนอราคาที่แม่นยำ
          </p>
        </motion.div>
      </section>

      <div className="max-w-5xl mx-auto px-6 mt-16 grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* Left: Calculator Controls */}
        <div className="md:col-span-7 space-y-10">
          
          {/* Step 1: Built-in Type */}
          <div>
            <h2 className="text-xs tracking-widest uppercase text-muted-foreground mb-6 font-sans">1. เลือกประเภทงานบิวท์อิน</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BUILT_IN_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setBuiltInType(type.id)}
                  className={`text-left p-4 border transition-all duration-300 relative ${
                    builtInType === type.id 
                      ? "border-primary bg-primary/5" 
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  {builtInType === type.id && (
                    <CheckCircle2 size={16} className="absolute top-4 right-4 text-primary" />
                  )}
                  <h3 className={`font-serif text-lg mb-1 ${builtInType === type.id ? "text-primary" : "text-foreground"}`}>
                    {type.label}
                  </h3>
                  <p className="text-xs text-muted-foreground">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Material */}
          <div>
            <h2 className="text-xs tracking-widest uppercase text-muted-foreground mb-6 font-sans">2. เลือกวัสดุปิดผิว</h2>
            <div className="flex flex-col gap-3">
              {MATERIALS.map((mat) => (
                <button
                  key={mat.id}
                  onClick={() => setMaterial(mat.id)}
                  className={`flex items-center justify-between p-4 border transition-all duration-300 ${
                    material === mat.id 
                      ? "border-primary bg-primary/5" 
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <div className="text-left">
                    <h3 className={`font-serif text-lg mb-1 ${material === mat.id ? "text-primary" : "text-foreground"}`}>
                      {mat.label}
                    </h3>
                    <p className="text-xs text-muted-foreground">{mat.desc}</p>
                  </div>
                  {material === mat.id && <CheckCircle2 size={16} className="text-primary flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Area */}
          <div>
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-xs tracking-widest uppercase text-muted-foreground font-sans">3. ขนาดพื้นที่โดยประมาณ</h2>
              <span className="text-2xl font-serif text-primary">{area[0]} ตร.ม.</span>
            </div>
            <div className="p-8 border border-border bg-card">
              <Slider
                min={1}
                max={50}
                step={1}
                value={area}
                onValueChange={setArea}
                className="[&>[data-orientation=horizontal]]:h-1 [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:border-primary [&_[role=slider]]:bg-background"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-4">
                <span>1 ตร.ม.</span>
                <span>50 ตร.ม.</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right: Result & Form */}
        <div className="md:col-span-5 relative">
          <div className="sticky top-28 space-y-8">
            
            {/* Estimate Result */}
            <div className="border border-primary/40 bg-card p-8 text-center shadow-xl">
              <p className="text-xs tracking-widest uppercase text-muted-foreground mb-4">งบประมาณประเมินเบื้องต้น</p>
              <div className="flex flex-col items-center justify-center">
                <span className="text-3xl lg:text-4xl font-serif text-foreground mb-2">
                  ฿{formatThb(minPrice)}
                </span>
                <span className="text-xl text-muted-foreground/60 mb-2">— ถึง —</span>
                <span className="text-3xl lg:text-4xl font-serif text-primary">
                  ฿{formatThb(maxPrice)}
                </span>
              </div>
              <div className="mt-6 pt-6 border-t border-border flex flex-col gap-2 text-xs text-muted-foreground text-left">
                <div className="flex justify-between">
                  <span>งานบิวท์อิน:</span>
                  <span className="text-foreground">{builtInType}</span>
                </div>
                <div className="flex justify-between">
                  <span>วัสดุ:</span>
                  <span className="text-foreground">{material}</span>
                </div>
                <div className="flex justify-between">
                  <span>ขนาด:</span>
                  <span className="text-foreground">{area[0]} ตร.ม.</span>
                </div>
              </div>
            </div>

            {/* Lead Form */}
            <div className="border border-border bg-card p-8">
              <h3 className="font-serif text-xl text-foreground mb-6">ขอใบเสนอราคาที่แม่นยำ</h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="ชื่อ-นามสกุล *" className="bg-background border-border/50 rounded-none focus-visible:ring-primary" {...field} />
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
                        <FormControl>
                          <Input type="tel" placeholder="เบอร์โทรศัพท์ *" className="bg-background border-border/50 rounded-none focus-visible:ring-primary" {...field} />
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
                        <FormControl>
                          <Input type="email" placeholder="อีเมล *" className="bg-background border-border/50 rounded-none focus-visible:ring-primary" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea placeholder="ข้อความเพิ่มเติม (ไม่บังคับ)" className="bg-background border-border/50 rounded-none focus-visible:ring-primary min-h-[80px] resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    disabled={isPending}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none py-6 font-serif tracking-widest text-sm mt-2"
                  >
                    {isPending ? "กำลังส่งข้อมูล..." : "ส่งข้อมูลติดต่อ"}
                  </Button>
                </form>
              </Form>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
