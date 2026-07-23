import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useSubmitLead } from "@workspace/api-client-react";

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

const formSchema = z.object({
  name: z.string().min(2, "กรุณากรอกชื่อ-นามสกุล"),
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  phone: z.string().optional(),
  projectType: z.enum(["residential", "commercial", "hospitality", "retail", "built-in", "other"], {
    required_error: "กรุณาเลือกประเภทโปรเจกต์",
  }),
  description: z.string().min(10, "กรุณาระบุรายละเอียดเพิ่มเติม"),
});

export default function Contact() {
  const { toast } = useToast();
  const { mutateAsync: submitLead, isPending } = useSubmitLead();

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
          name: values.name,
          email: values.email,
          phone: values.phone,
          projectType: values.projectType,
          description: values.description,
          source: "contact"
        }
      });
      toast({
        title: "ส่งข้อมูลสำเร็จ",
        description: "ขอบคุณที่ติดต่อเรา ทีมงานจะรีบติดต่อกลับโดยเร็วที่สุด",
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
    <div className="w-full pt-24 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 grid grid-cols-1 lg:grid-cols-5 gap-16">
        
        {/* Contact Info */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-2 space-y-12"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-6">สร้างสรรค์พื้นที่<br/><span className="text-primary italic">ที่สมบูรณ์แบบกับเรา</span></h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              ไม่ว่าจะเป็นบ้านพักอาศัยส่วนตัว ออฟฟิศ หรือพื้นที่เชิงพาณิชย์ ทีมงานของเราพร้อมที่จะเปลี่ยนวิสัยทัศน์ของคุณให้เป็นจริง
            </p>
          </div>

          <div className="space-y-8 border-t border-border/50 pt-8">
            <div>
              <h3 className="text-xs font-sans uppercase tracking-widest text-primary mb-2">สำนักงานใหญ่</h3>
              <p className="text-foreground font-light text-sm leading-relaxed">
                อาคารอเนกวณิช ชั้น 8<br />
                สุขุมวิท 21<br />
                กรุงเทพฯ 10110
              </p>
            </div>
            
            <div>
              <h3 className="text-xs font-sans uppercase tracking-widest text-primary mb-2">ติดต่อโดยตรง</h3>
              <p className="text-foreground font-light text-sm leading-relaxed">
                โทร: 02-123-4567<br />
                อีเมล: info@daybuilt.co.th
              </p>
            </div>

            <div>
              <h3 className="text-xs font-sans uppercase tracking-widest text-primary mb-2">เวลาทำการ</h3>
              <p className="text-foreground font-light text-sm leading-relaxed">
                จันทร์ - ศุกร์: 9:00 - 18:00 น.<br />
                เสาร์: 9:00 - 13:00 น.<br />
                หยุดวันอาทิตย์และวันหยุดนักขัตฤกษ์
              </p>
            </div>
          </div>
        </motion.div>

        {/* Contact Form */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:col-span-3 bg-card border border-border p-8 md:p-12 shadow-xl"
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">ชื่อ-นามสกุล <span className="text-primary">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="สมชาย ใจดี" className="bg-background border-border/50 focus-visible:ring-primary rounded-none" {...field} />
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
                        <Input type="email" placeholder="somchai@example.com" className="bg-background border-border/50 focus-visible:ring-primary rounded-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">เบอร์โทรศัพท์ (ถ้ามี)</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="081-234-5678" className="bg-background border-border/50 focus-visible:ring-primary rounded-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projectType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">ประเภทโปรเจกต์ <span className="text-primary">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border/50 focus:ring-primary rounded-none">
                            <SelectValue placeholder="เลือกประเภท" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-border rounded-none">
                          <SelectItem value="residential">ที่พักอาศัย (Residential)</SelectItem>
                          <SelectItem value="commercial">สำนักงาน (Commercial)</SelectItem>
                          <SelectItem value="hospitality">โรงแรม/รีสอร์ท (Hospitality)</SelectItem>
                          <SelectItem value="retail">ร้านค้า (Retail)</SelectItem>
                          <SelectItem value="built-in">งานบิวท์อินเฉพาะจุด (Built-in)</SelectItem>
                          <SelectItem value="other">อื่นๆ</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">รายละเอียดเพิ่มเติม <span className="text-primary">*</span></FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="บอกเล่าความต้องการของคุณ ขนาดพื้นที่ หรือสไตล์ที่ชอบ..." 
                        className="min-h-[150px] resize-none bg-background border-border/50 focus-visible:ring-primary rounded-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={isPending}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none py-6 font-serif tracking-widest text-sm"
              >
                {isPending ? "กำลังส่งข้อมูล..." : "ส่งข้อความ"}
              </Button>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}
