import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { name: "หน้าหลัก", href: "/" },
  { name: "เกี่ยวกับเรา", href: "/about" },
  { name: "ผลงาน", href: "/projects" },
  { name: "Estimator", href: "/estimator" },
  { name: "Design Studio", href: "/design-studio" },
  { name: "ติดต่อ", href: "/contact" },
];

export function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
        isScrolled
          ? "bg-background/90 backdrop-blur-xl border-b border-border/60 py-3"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex flex-col group">
          <span className="text-xl font-serif tracking-[0.18em] text-foreground group-hover:text-primary transition-colors duration-300 leading-none">
            DAYBUILT
          </span>
          <span className="text-[9px] tracking-[0.35em] text-primary uppercase font-sans leading-tight mt-0.5">
            .indesign
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-xs tracking-wider transition-colors duration-300 hover:text-primary relative group ${
                location === link.href ? "text-primary" : "text-foreground/70"
              }`}
            >
              {link.name}
              <span
                className={`absolute -bottom-1 left-0 h-px bg-primary transition-all duration-300 ${
                  location === link.href ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </Link>
          ))}
          <div className="flex items-center gap-4 ml-2">
            <Link href="/contact">
              <Button
                variant="outline"
                className="border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground font-serif tracking-widest rounded-none px-5 py-2 text-xs transition-all duration-300"
              >
                ปรึกษาเรา
              </Button>
            </Link>
            <Link href="/admin" className="text-[10px] text-muted-foreground hover:text-primary transition-colors tracking-widest uppercase ml-4 border-l border-border pl-4">
              Admin
            </Link>
          </div>
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-foreground p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "100vh" }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed inset-0 top-[60px] bg-background/98 backdrop-blur-xl z-40 flex flex-col items-center justify-center gap-10 md:hidden"
          >
            {navLinks.map((link, i) => (
              <motion.div
                key={link.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Link
                  href={link.href}
                  className={`text-2xl font-serif tracking-widest transition-colors hover:text-primary ${
                    location === link.href ? "text-primary" : "text-foreground/80"
                  }`}
                >
                  {link.name}
                </Link>
              </motion.div>
            ))}
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: navLinks.length * 0.07 }}
               className="mt-8 pt-8 border-t border-border w-32 flex justify-center"
            >
              <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary transition-colors tracking-widest uppercase">
                Admin Area
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
