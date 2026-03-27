import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Hexagon, Maximize, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";

const featuredProjects = [
  {
    id: 1,
    title: "The Vertex Residence",
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

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt="Daybuilt Luxury Home"
            className="w-full h-full object-cover object-center"
          />
          {/* Dark wash for readability */}
          <div className="absolute inset-0 bg-background/60 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full text-center mt-20">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-5xl md:text-7xl lg:text-8xl font-serif text-foreground mb-6 tracking-tight"
          >
            CRAFTING <br />
            <span className="text-primary italic">LUXURY.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-10 font-light tracking-wide"
          >
            Where visionary architecture meets impeccable execution. Building the spaces of tomorrow, today.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <Link href="/projects">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-serif tracking-widest uppercase rounded-none px-8 py-6 text-sm">
                View Portfolio
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Intro / About Snippet */}
      <section className="py-24 md:py-32 bg-background border-b border-border">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-sm font-serif text-primary tracking-[0.3em] uppercase mb-6"
          >
            The Daybuilt Standard
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-2xl md:text-4xl font-serif leading-relaxed text-foreground"
          >
            We don't just build structures; we curate environments. Every line, every texture, and every shadow is intentionally designed to evoke profound emotional resonance.
          </motion.p>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-24 md:py-32 bg-card">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-4xl font-serif text-foreground mb-4">Selected Works</h2>
              <p className="text-muted-foreground max-w-md">A glimpse into our curated portfolio of residential and commercial masterworks.</p>
            </div>
            <Link href="/projects" className="group flex items-center gap-2 text-primary font-serif tracking-widest uppercase text-sm transition-colors hover:text-primary/80">
              All Projects <ArrowRight size={16} className="transition-transform group-hover:translate-x-2" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="group relative cursor-pointer block overflow-hidden"
              >
                <div className="aspect-[4/5] overflow-hidden bg-muted">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                </div>
                <div className="absolute bottom-0 left-0 p-8 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-primary text-xs tracking-widest uppercase font-sans mb-2">{project.type}</p>
                  <h3 className="text-2xl font-serif text-foreground">{project.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Daybuilt */}
      <section className="py-24 md:py-32 bg-background relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-4">The Architecture of Excellence</h2>
            <div className="w-12 h-0.5 bg-primary mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {values.map((val, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="flex flex-col items-center text-center p-8 border border-border/50 hover:border-primary/30 bg-card/30 transition-colors duration-500"
              >
                <val.icon className="w-10 h-10 text-primary mb-6" strokeWidth={1} />
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
