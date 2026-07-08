import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const categories = ["All", "Residential", "Commercial", "Hospitality", "Retail", "Mixed-Use"];

const allProjects = [
  {
    id: 1,
    title: "Housing estate",
    type: "Residential",
    location: "Beverly Hills, CA",
    year: "2023",
    description: "A breathtaking hillside monolithic residence featuring expansive glass walls, dark oak paneling, and a dramatic infinity pool overlooking the city.",
    image: `${import.meta.env.BASE_URL}images/project-res-1.png`,
  },
  {
    id: 2,
    title: "Aura Commercial Tower",
    type: "Commercial",
    location: "Chicago, IL",
    year: "2022",
    description: "A 40-story commercial tower blending brutalist concrete structural elements with warm brass and ambient interior lighting.",
    image: `${import.meta.env.BASE_URL}images/project-com-1.png`,
  },
  {
    id: 3,
    title: "Lumina Boutique Hotel",
    type: "Hospitality",
    location: "Miami, FL",
    year: "2024",
    description: "An immersive hospitality experience defined by velvet textures, moody ambient lighting, and bespoke architectural details.",
    image: `${import.meta.env.BASE_URL}images/project-hos-1.png`,
  },
  {
    id: 4,
    title: "Oak & Marble Kitchen",
    type: "Residential",
    location: "Aspen, CO",
    year: "2023",
    description: "A minimalist luxury kitchen renovation featuring Calacatta gold marble, matte black custom cabinetry, and brushed brass fixtures.",
    image: `${import.meta.env.BASE_URL}images/project-res-2.png`,
  },
  {
    id: 5,
    title: "Maison Retail Flagship",
    type: "Retail",
    location: "New York, NY",
    year: "2022",
    description: "A dark, moody, and highly textural retail environment designed to highlight luxury garments within a museum-like atmosphere.",
    image: `${import.meta.env.BASE_URL}images/project-ret-1.png`,
  },
  {
    id: 6,
    title: "Nova Mixed-Use Complex",
    type: "Mixed-Use",
    location: "Austin, TX",
    year: "2024",
    description: "A contemporary blend of high-end retail, dining, and luxury condominiums integrated seamlessly into the urban fabric.",
    image: `${import.meta.env.BASE_URL}images/project-mix-1.png`,
  }
];

export default function Projects() {
  const [filter, setFilter] = useState("All");
  const [selectedProject, setSelectedProject] = useState<typeof allProjects[0] | null>(null);

  const filteredProjects = filter === "All" 
    ? allProjects 
    : allProjects.filter(p => p.type === filter);

  return (
    <div className="w-full pt-24 min-h-screen bg-background">
      {/* Header */}
      <section className="py-16 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-serif mb-8"
          >
            Portfolio
          </motion.h1>
          
          {/* Filters */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-4"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 text-xs font-sans tracking-widest uppercase transition-all duration-300 border ${
                  filter === cat 
                    ? "bg-primary border-primary text-primary-foreground" 
                    : "bg-transparent border-border text-muted-foreground hover:border-primary hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredProjects.map((project) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="group cursor-pointer block overflow-hidden bg-card border border-border"
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img 
                      src={project.image} 
                      alt={project.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors duration-500" />
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-primary text-xs tracking-widest uppercase">{project.type}</p>
                      <p className="text-muted-foreground text-xs">{project.year}</p>
                    </div>
                    <h3 className="text-xl font-serif text-foreground mb-1">{project.title}</h3>
                    <p className="text-sm text-muted-foreground">{project.location}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-24 text-muted-foreground">
              No projects found for this category.
            </div>
          )}
        </div>
      </section>

      {/* Project Modal */}
      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-4xl bg-card border-border p-0 overflow-hidden">
          {selectedProject && (
            <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
              <div className="w-full md:w-3/5 h-64 md:h-auto relative">
                <img 
                  src={selectedProject.image} 
                  alt={selectedProject.title} 
                  className="w-full h-full object-cover absolute inset-0"
                />
              </div>
              <div className="w-full md:w-2/5 p-8 flex flex-col justify-center bg-card">
                <DialogHeader className="text-left mb-6">
                  <p className="text-primary text-xs tracking-widest uppercase mb-2">{selectedProject.type} &mdash; {selectedProject.year}</p>
                  <DialogTitle className="text-3xl font-serif text-foreground mb-2">
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
                    Close Project
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
