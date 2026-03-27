import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useSubmitContact } from "@workspace/api-client-react";

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
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  projectType: z.enum(["residential", "commercial", "hospitality", "retail", "mixed-use", "other"], {
    required_error: "Please select a project type",
  }),
  budget: z.enum(["under-1m", "1m-5m", "5m-10m", "10m-50m", "over-50m"], {
    required_error: "Please select a budget range",
  }),
  description: z.string().min(10, "Please provide more details about your project"),
});

export default function Contact() {
  const { toast } = useToast();
  const { mutateAsync: submitContact, isPending } = useSubmitContact();

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
      await submitContact({ data: values });
      toast({
        title: "Inquiry Received",
        description: "Thank you for reaching out. Our team will contact you shortly.",
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your inquiry. Please try again.",
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
            <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-6">Let's build<br/><span className="text-primary italic">something extraordinary.</span></h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              Whether you're planning a private residence, a commercial tower, or a boutique retail space, our team is ready to bring your vision to reality.
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xs font-sans uppercase tracking-widest text-primary mb-2">Headquarters</h3>
              <p className="text-foreground font-light text-sm">
                400 Architectural Way<br />
                Suite 800<br />
                New York, NY 10001
              </p>
            </div>
            
            <div>
              <h3 className="text-xs font-sans uppercase tracking-widest text-primary mb-2">Direct Contact</h3>
              <p className="text-foreground font-light text-sm">
                +1 (212) 555-0199<br />
                hello@daybuilt.com
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
                      <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" className="bg-background border-border/50 focus-visible:ring-primary rounded-none" {...field} />
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
                      <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="jane@example.com" className="bg-background border-border/50 focus-visible:ring-primary rounded-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+1 (555) 000-0000" className="bg-background border-border/50 focus-visible:ring-primary rounded-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="projectType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Project Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border/50 focus:ring-primary rounded-none">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-border rounded-none">
                          <SelectItem value="residential">Residential</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="hospitality">Hospitality</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="mixed-use">Mixed-Use</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Estimated Budget</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border/50 focus:ring-primary rounded-none">
                            <SelectValue placeholder="Select budget" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-border rounded-none">
                          <SelectItem value="under-1m">Under $1M</SelectItem>
                          <SelectItem value="1m-5m">$1M - $5M</SelectItem>
                          <SelectItem value="5m-10m">$5M - $10M</SelectItem>
                          <SelectItem value="10m-50m">$10M - $50M</SelectItem>
                          <SelectItem value="over-50m">Over $50M</SelectItem>
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
                    <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Project Details</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about your vision, location, and timeline..." 
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
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none py-6 font-serif tracking-widest uppercase text-sm"
              >
                {isPending ? "Submitting..." : "Submit Inquiry"}
              </Button>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}
