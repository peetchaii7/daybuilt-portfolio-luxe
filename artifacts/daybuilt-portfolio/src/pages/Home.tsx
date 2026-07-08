import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Hexagon, Maximize, Ruler, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";

const featuredProjects = [
  {
    id: 1,
    title: "Housing estate",
    type: "Residential",
    image: `${import.meta.env.BASE_URL}images/project-res-1.png`,
  },
  {
    id: 2,
    title: "Aura Commercial Tower",
    type: "Commercial",
    image: `${import.meta.env.BASE_URL}images/project-com-1.png`,
  },
  {
    id: 3,
    title: "Lumina Boutique Hotel",
    type: "Hospitality",
    image: `${import.meta.env.BASE_URL}images/project-hos-1.png`,
  },
];

const values = [
  {
    icon: Ruler,
    title: "Precision Engineering",
    desc: "Meticulous attention to structural integrity and architectural exactness."
  },
  {
    icon: Hexagon,
    title: "Bespoke Materials",
    desc: "Sourcing the world's finest stones, woods, and metals for unparalleled finishes."
  },
  {
    icon: Maximize,
    title: "Spatial Harmony",
    desc: "Designing volumes that breathe, flow, and elevate the human experience."
  }
];

const stats = [
  { value: "200+", label: "Projects Delivered" },
  { value: "15+", label: "Years of Excellence" },
  { value: "40+", label: "Design Awards" },
  { value: "100%", label: "Client Satisfaction" },
];

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt="Daybuilt.indesign Luxury Home"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/50 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full text-center mt-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-xs font-sans tracking-[0.4em] text-primary uppercase mb-6"
          >
            Daybuilt.indesign — Architecture & Interior
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15, ease: "easeOut" }}
            className="text-5xl md:text-7xl lg:text-8xl font-serif text-foreground mb-6 tracking-tight leading-[0.95]"
          >
            CRAFTING <br />
            <span className="text-primary italic">LUXURY.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35, ease: "easeOut" }}
            className="text-base md:text-lg text-foreground/70 max-w-xl mx-auto mb-10 font-light tracking-wide"
          >
            Where visionary architecture meets impeccable execution. Building the spaces of tomorrow, today.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.55 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/projects">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-serif tracking-widest uppercase rounded-none px-8 py-6 text-xs">
                View Portfolio
              </Button>
            </Link>
            <Link href="/calculator">
              <Button size="lg" variant="outline" className="border-foreground/30 text-foreground/80 hover:border-primary hover:text-primary font-serif tracking-widest uppercase rounded-none px-8 py-6 text-xs group">
                <Calculator size={14} className="mr-2 group-hover:text-primary transition-colors" />
                Material Calculator
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs tracking-widest text-muted-foreground uppercase font-sans">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            className="w-px h-8 bg-gradient-to-b from-primary to-transparent"
          />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-16 md:py-20 bg-card border-y border-border/60">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-serif text-primary mb-2">{stat.value}</p>
                <p className="text-xs tracking-widest uppercase text-muted-foreground font-sans">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Intro / About Snippet */}
      <section className="py-24 md:py-36 bg-background">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-xs font-sans text-primary tracking-[0.35em] uppercase mb-8"
          >
            The Daybuilt.indesign Standard
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-2xl md:text-4xl font-serif leading-relaxed text-foreground"
          >
            We don't just build structures; we curate environments. Every line, every texture, and every shadow is intentionally designed to evoke profound emotional resonance.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-12"
          >
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
          </motion.div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-24 md:py-32 bg-card/50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <p className="text-xs tracking-[0.35em] text-primary uppercase font-sans mb-3">Portfolio</p>
              <h2 className="text-4xl md:text-5xl font-serif text-foreground">Selected Works</h2>
            </div>
            <Link href="/projects" className="group flex items-center gap-2 text-primary font-sans tracking-widest uppercase text-xs transition-colors hover:text-primary/80">
              All Projects <ArrowRight size={14} className="transition-transform group-hover:translate-x-2" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
            {featuredProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="group relative cursor-pointer block overflow-hidden bg-background"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                </div>
                <div className="absolute bottom-0 left-0 p-8 w-full">
                  <p className="text-primary text-xs tracking-[0.3em] uppercase font-sans mb-2">{project.type}</p>
                  <h3 className="text-xl md:text-2xl font-serif text-foreground">{project.title}</h3>
                  <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <span className="text-xs text-muted-foreground tracking-widest font-sans">View Project</span>
                    <ArrowRight size={12} className="text-primary" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Material Calculator CTA */}
      <section className="py-24 md:py-32 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(43_74%_49%_/_0.05)_0%,transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="border border-border/60 bg-card/30 p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10">
            <div>
              <p className="text-xs tracking-[0.35em] text-primary uppercase font-sans mb-4">New Feature</p>
              <h2 className="text-3xl md:text-5xl font-serif text-foreground mb-4">
                Material & Cost<br />
                <span className="text-primary italic">Estimator</span>
              </h2>
              <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
                เลือกประเภทห้อง กำหนดพื้นที่ และเลือกระดับวัสดุที่ต้องการ ระบบจะคำนวณงบประมาณโดยประมาณให้ทันที
              </p>
            </div>
            <Link href="/calculator">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none px-10 py-6 font-serif tracking-widest uppercase text-xs group whitespace-nowrap">
                <Calculator size={14} className="mr-2" />
                เริ่มคำนวณ
                <ArrowRight size={14} className="ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Daybuilt */}
      <section className="py-24 md:py-32 bg-card/30">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-20">
            <p className="text-xs tracking-[0.35em] text-primary uppercase font-sans mb-4">Our Philosophy</p>
            <h2 className="text-3xl md:text-5xl font-serif text-foreground">The Architecture of Excellence</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/40">
            {values.map((val, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="flex flex-col items-center text-center p-10 md:p-12 bg-background hover:bg-card/50 transition-colors duration-500 group"
              >
                <div className="w-14 h-14 flex items-center justify-center border border-border/60 group-hover:border-primary/40 mb-8 transition-colors duration-500">
                  <val.icon className="w-6 h-6 text-primary" strokeWidth={1} />
                </div>
                <h3 className="text-xl font-serif text-foreground mb-4">{val.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{val.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
