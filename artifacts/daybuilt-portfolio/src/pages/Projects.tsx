import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const BASE = import.meta.env.BASE_URL;

interface Project {
  id: number;
  title: string;
  category: string;
  location: string;
  description: string;
  image: string;
  images?: string[];
}

const modelShowcaseImages = [
  "1785375045627.jpg",
  "1785375045702.jpg",
  "1785375045728.jpg",
  "1785375045749.jpg",
  "1785375045765.jpg",
  "1785375045780.jpg",
  "1785375045813.jpg",
  "1785375045826.jpg",
  "1785375045840.jpg",
  "1785375050055.jpg",
  "1785375050082.jpg",
  "1785375050144.jpg",
  "1785375050178.jpg",
  "1785375050201.jpg",
  "1785375050222.jpg",
  "1785375050248.jpg",
  "1785375050266.jpg",
  "1785375050286.jpg",
  "1785375053919.jpg",
  "1785375053954.jpg",
  "1785375053972.jpg",
  "1785375054000.jpg",
  "1785375054024.jpg",
  "1785375054040.jpg",
  "1785375054055.jpg",
  "1785375054071.jpg",
  "1785375050109.jpg",
  "1785375045799.jpg",
].map((filename) => `${BASE}images/model-showcase/${filename}`);

const sections: { id: string; label: string; labelEn: string; projects: Project[] }[] = [
  {
    id: "bedroom",
    label: "ห้องนอน",
    labelEn: "Bedroom",
    projects: [
      {
        id: 101,
        title: "ตู้เสื้อผ้า Walk-in สไตล์ Minimal Luxury",
        category: "ห้องนอน",
        location: "สุขุมวิท 49, กรุงเทพฯ",
        description: "ตู้เสื้อผ้า Walk-in 4.5 เมตร วัสดุไม้ออคและลามิเนตขาว ระบบบานเลื่อนซ่อนราง พร้อมไฟ LED ภายใน",
        image: `${BASE}images/bedroom-walkin-1.jpg`,
      },
      {
        id: 102,
        title: "หัวเตียงบิ้วท์อินพร้อมโต๊ะข้างเตียง",
        category: "ห้องนอน",
        location: "พระราม 9, กรุงเทพฯ",
        description: "หัวเตียงบิ้วท์อินกว้าง 3.2 เมตร ผนังหุ้มผ้าลินินเทา พร้อมชั้นวางข้างเตียงลอยตัวและไฟอ่านหนังสือ",
        image: `${BASE}images/bedroom-headboard-1.jpg`,
      },
      {
        id: 103,
        title: "ตู้เสื้อผ้า Modern Luxury",
        category: "ห้องนอน",
        location: "ลาดพร้าว, กรุงเทพฯ",
        description: "ตู้เสื้อผ้าบานกระจกบรอนซ์ 5 เมตร วัสดุ High Gloss สลับไม้ Walnut พร้อมระบบแขวนเสื้อ 2 ชั้น",
        image: `${BASE}images/bedroom-wardrobe-2.jpg`,
      },
    ],
  },
  {
    id: "living",
    label: "ห้องนั่งเล่น",
    labelEn: "Living Room",
    projects: [
      {
        id: 201,
        title: "ผนังทีวีพร้อม Floating Shelf",
        category: "ห้องนั่งเล่น",
        location: "ทองหล่อ, กรุงเทพฯ",
        description: "ผนังทีวีบิ้วท์อิน 5 เมตร ไม้ Teak แบ็คแพนแผ่นหนัง ตู้เก็บของซ่อนบานเรียบ พร้อมไฟ LED Warm White",
        image: `${BASE}images/living-tvwall-1.jpg`,
      },
      {
        id: 202,
        title: "ตู้โชว์และชั้นวางสไตล์มินิมอล",
        category: "ห้องนั่งเล่น",
        location: "เอกมัย, กรุงเทพฯ",
        description: "ชุดตู้โชว์บิ้วท์อินเต็มผนัง 6 เมตร ออกแบบให้รับน้ำหนักได้มาก ผสมบานกระจก-บานเรียบสลับ",
        image: `${BASE}images/living-shelf-1.jpg`,
      },
    ],
  },
  {
    id: "display",
    label: "ตู้โชว์ / Media Wall",
    labelEn: "Display Cabinet & Media Wall",
    projects: [
      {
        id: 301,
        title: "Media Wall คอนโด Modern Luxury",
        category: "ตู้โชว์ / Media Wall",
        location: "อโศก, กรุงเทพฯ",
        description: "Media Wall กว้าง 4.8 เมตร วัสดุไม้ Walnut สลับแผ่นกำมะหยี่ Navy Blue ตู้แขวนลอยตัวใต้ทีวี",
        image: `${BASE}images/display-media-1.jpg`,
      },
      {
        id: 302,
        title: "ตู้โชว์สะสมนาฬิกาและของสะสม",
        category: "ตู้โชว์ / Media Wall",
        location: "สาทร, กรุงเทพฯ",
        description: "ตู้โชว์กระจกบรอนซ์ฝ้า 3 ช่อง พร้อมไฟ Spotlight ภายใน ออกแบบแนว Gallery สำหรับจัดแสดงของสะสม",
        image: `${BASE}images/display-showcase-1.jpg`,
      },
      {
        id: 303,
        title: "Feature Wall ห้องรับแขก",
        category: "ตู้โชว์ / Media Wall",
        location: "พระโขนง, กรุงเทพฯ",
        description: "Feature Wall ผสมผสานชั้นลอยตัวไม้ดำ ผนังไม้ Fluted Panel และไฟ Strip LED หลังชั้น",
        image: `${BASE}images/display-feature-1.jpg`,
      },
      {
        id: 304,
        title: "ตู้โชว์โมเดล",
        category: "ตู้โชว์ / Media Wall",
        location: "ผลงานตู้โชว์และ Media Wall",
        description: "คอลเลกชันภาพผลงานตู้โชว์โมเดลและ Media Wall จำนวน 28 ภาพ ถ่ายทอดรายละเอียดวัสดุ ช่องจัดแสดง แสงไฟ และงานบิ้วท์อินในมุมมองต่าง ๆ",
        image: modelShowcaseImages[0],
        images: modelShowcaseImages,
      },
    ],
  },
  {
    id: "storage",
    label: "ตู้บิ้วท์อินและพื้นที่เก็บของ",
    labelEn: "Built-in Cabinets & Storage",
    projects: [
      {
        id: 401,
        title: "ตู้เก็บของใต้บันได",
        category: "ตู้บิ้วท์อินและพื้นที่เก็บของ",
        location: "วังหิน, กรุงเทพฯ",
        description: "ใช้พื้นที่ใต้บันไดสร้างระบบเก็บของแบบ Custom 100% ช่องลิ้นชัก บานเปิด และชั้นวางปรับระดับได้",
        image: `${BASE}images/storage-stair-1.jpg`,
      },
      {
        id: 402,
        title: "ตู้รองเท้าบิ้วท์อิน Entry Zone",
        category: "ตู้บิ้วท์อินและพื้นที่เก็บของ",
        location: "ลาดกระบัง, กรุงเทพฯ",
        description: "ตู้รองเท้าบิ้วท์อิน 2.4 เมตรพร้อมม้านั่งและราวแขวน จัดโซน Entry สะอาดตา ทำจากวัสดุ PVC กันความชื้น",
        image: `${BASE}images/storage-shoe-1.jpg`,
      },
      {
        id: 403,
        title: "ห้องซักผ้าและ Utility Room",
        category: "ตู้บิ้วท์อินและพื้นที่เก็บของ",
        location: "บางนา, กรุงเทพฯ",
        description: "ออกแบบ Utility Room ขนาด 4 ตร.ม. ให้ฟังก์ชันครบ โต๊ะรีดผ้าพับเก็บได้ ชั้นวาง และตู้เก็บอุปกรณ์ทำความสะอาด",
        image: `${BASE}images/storage-utility-1.jpg`,
      },
    ],
  },
  {
    id: "kitchen",
    label: "ครัวและ Pantry",
    labelEn: "Kitchen & Pantry",
    projects: [
      {
        id: 501,
        title: "ครัวบิ้วท์อิน Modern White",
        category: "ครัวและ Pantry",
        location: "สาทร, กรุงเทพฯ",
        description: "ครัวบิ้วท์อิน 28 ตร.ม. วัสดุ Acrylic ขาวสลับไม้ Oak พร้อมท็อปหินควอตซ์ ระบบจัดเก็บอัจฉริยะในลิ้นชัก",
        image: `${BASE}images/kitchen-modern-1.jpg`,
      },
      {
        id: 502,
        title: "Pantry Room และตู้เก็บเสบียง",
        category: "ครัวและ Pantry",
        location: "ศรีนครินทร์, กรุงเทพฯ",
        description: "Pantry Room 6 ตร.ม. ระบบชั้นวาง Pull-out ทุกช่อง พร้อมตู้แบบ Floor-to-Ceiling และท็อปเคาน์เตอร์สำหรับเตรียมอาหาร",
        image: `${BASE}images/kitchen-pantry-1.jpg`,
      },
      {
        id: 503,
        title: "ครัวสไตล์ Warm Luxury",
        category: "ครัวและ Pantry",
        location: "เชียงใหม่",
        description: "ครัวบิ้วท์อินสไตล์ Warm Luxury ไม้ Teak โทน Warm Brown บานเรียบไร้มือจับ พร้อมผิว Linen บนเกาะกลาง",
        image: `${BASE}images/kitchen-warm-luxury-1.jpg`,
      },
    ],
  },
  {
    id: "process",
    label: "หน้างานและขั้นตอนผลิต",
    labelEn: "Work in Progress & Production",
    projects: [
      {
        id: 601,
        title: "ขั้นตอนการผลิตในโรงงาน",
        category: "หน้างานและขั้นตอนผลิต",
        location: "โรงงาน Daybuilt, กรุงเทพฯ",
        description: "ทุกชิ้นงานผ่านกระบวนการตัด CNC ความแม่นยำ 0.1 มม. ก่อนเข้าสู่ขั้นตอนพ่นสี อบ UV และ QC ทุกชิ้น",
        image: `${BASE}images/process-factory-1.jpg`,
      },
      {
        id: 602,
        title: "ขั้นตอนติดตั้งหน้างาน",
        category: "หน้างานและขั้นตอนผลิต",
        location: "โครงการ Sukhumvit 21",
        description: "ทีมช่างติดตั้งมืออาชีพ ดำเนินงานสะอาด ตรงเวลา ทุกงานมี Site Supervisor ดูแลตั้งแต่เริ่มจนส่งมอบ",
        image: `${BASE}images/process-install-1.jpg`,
      },
      {
        id: 603,
        title: "ตรวจงานและส่งมอบ",
        category: "หน้างานและขั้นตอนผลิต",
        location: "โครงการ Lad Phrao",
        description: "ขั้นตอนตรวจสอบคุณภาพก่อนส่งมอบ ทดสอบกลไกทุกบาน ปรับระดับ และทำความสะอาดพื้นที่ให้พร้อมเข้าอยู่",
        image: `${BASE}images/process-handover-1.jpg`,
      },
    ],
  },
];

// Anchor navigation labels
const anchorLinks = sections.map((s) => ({ id: s.id, label: s.label }));

export default function Projects() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="w-full pt-24 min-h-screen bg-background">
      {/* Header */}
      <section className="py-16 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-primary text-xs tracking-widest uppercase mb-4"
          >
            Portfolio
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-serif mb-10"
          >
            ผลงานของเรา
          </motion.h1>

          {/* Section anchor links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-3"
          >
            {anchorLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="px-4 py-2 text-xs font-sans tracking-widest uppercase transition-all duration-300 border border-border text-muted-foreground hover:border-primary hover:text-foreground"
              >
                {link.label}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Sections */}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {sections.map((section, sectionIdx) => (
          <section
            key={section.id}
            id={section.id}
            className="py-16 border-b border-border last:border-b-0"
          >
            {/* Section heading */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-10"
            >
              <p className="text-primary text-xs tracking-widest uppercase mb-2">
                {String(sectionIdx + 1).padStart(2, "0")}
              </p>
              <h2 className="text-3xl md:text-4xl font-serif text-foreground">
                {section.label}
              </h2>
              <p className="text-muted-foreground text-sm mt-1 tracking-wide">
                {section.labelEn}
              </p>
            </motion.div>

            {/* Project grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.projects.map((project, idx) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: idx * 0.08 }}
                  onClick={() => setSelectedProject(project)}
                  className="group cursor-pointer overflow-hidden bg-card border border-border"
                >
                  <div className="aspect-[4/3] overflow-hidden relative bg-muted">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-background/0 group-hover:bg-background/10 transition-colors duration-500" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-base font-serif text-foreground mb-1 group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-xs text-muted-foreground tracking-wide">
                      {project.location}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Project Modal */}
      <Dialog
        open={!!selectedProject}
        onOpenChange={(open) => !open && setSelectedProject(null)}
      >
        <DialogContent className="max-w-4xl bg-card border-border p-0 overflow-hidden">
          {selectedProject && (
            <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
              <div className="w-full md:w-3/5 h-[48vh] min-h-64 md:h-[85vh] md:max-h-[85vh] overflow-y-auto bg-muted p-3">
                <div className={selectedProject.images ? "grid grid-cols-2 gap-3" : "h-full"}>
                  {(selectedProject.images ?? [selectedProject.image]).map((image, index) => (
                    <img
                      key={image}
                      src={image}
                      alt={`${selectedProject.title} ภาพที่ ${index + 1}`}
                      className={selectedProject.images
                        ? "w-full aspect-[4/3] object-contain bg-background/40"
                        : "w-full h-full object-cover"}
                      loading={index > 1 ? "lazy" : "eager"}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="w-full md:w-2/5 p-8 flex flex-col justify-center bg-card">
                <DialogHeader className="text-left mb-6">
                  <p className="text-primary text-xs tracking-widest uppercase mb-2">
                    {selectedProject.category}
                  </p>
                  <DialogTitle className="text-2xl font-serif text-foreground mb-2">
                    {selectedProject.title}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    {selectedProject.location}
                  </DialogDescription>
                </DialogHeader>
                <div className="text-foreground/80 text-sm leading-relaxed font-light mb-8">
                  {selectedProject.description}
                </div>
                <div className="mt-auto">
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="text-xs uppercase tracking-widest border-b border-primary text-primary pb-1 hover:text-primary/80 transition-colors"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
