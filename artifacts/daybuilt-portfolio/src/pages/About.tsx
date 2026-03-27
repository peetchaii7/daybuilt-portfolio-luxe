import { motion } from "framer-motion";

const timeline = [
  { year: "2010", title: "Foundation", desc: "Daybuilt is established with a focus on high-end residential renovations." },
  { year: "2015", title: "Commercial Expansion", desc: "Awarded our first major commercial tower project, shifting our scale." },
  { year: "2019", title: "Design Studio", desc: "Integrated our in-house architectural design studio for turnkey delivery." },
  { year: "2024", title: "Global Presence", desc: "Expanding operations to international luxury hospitality projects." },
];

export default function About() {
  return (
    <div className="w-full pt-24">
      {/* Header */}
      <section className="py-16 md:py-24 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-serif mb-6"
          >
            About Daybuilt
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg font-light"
          >
            Pioneering the intersection of structural permanence and profound aesthetic beauty.
          </motion.p>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <img 
              src={`${import.meta.env.BASE_URL}images/about-bg.png`}
              alt="Architectural sketch and materials" 
              className="w-full aspect-[4/5] object-cover border border-border/50 shadow-2xl"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-sm text-primary uppercase tracking-widest mb-4 font-sans">Our Philosophy</h2>
            <h3 className="text-3xl md:text-5xl font-serif text-foreground mb-8 leading-tight">
              Spaces that command attention yet invite tranquility.
            </h3>
            <div className="space-y-6 text-muted-foreground font-light leading-relaxed text-sm md:text-base">
              <p>
                Founded on the belief that environment shapes consciousness, Daybuilt operates at the absolute pinnacle of the construction and design industry. We do not compromise. We do not settle.
              </p>
              <p>
                For over a decade, our multidisciplinary team of visionary architects, master craftsmen, and visionary interior designers have collaborated to create spaces that transcend mere function to become lived-in art.
              </p>
              <p>
                From private monolithic residences perched on coastal cliffs to immersive retail environments for global luxury brands, our work is defined by an obsessive dedication to detail and an uncompromising standard of material quality.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-background">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif text-foreground">Our Evolution</h2>
            <div className="w-12 h-0.5 bg-primary mx-auto mt-6" />
          </div>

          <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {timeline.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-primary bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-primary text-xs font-bold">
                  <div className="w-3 h-3 bg-primary rounded-full" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded border border-border/50 bg-card hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-serif text-xl text-primary">{item.year}</span>
                  </div>
                  <h4 className="font-serif text-lg text-foreground mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
