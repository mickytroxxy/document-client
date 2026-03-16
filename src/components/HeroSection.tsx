import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Shield, Clock, Brain, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  const navigate = useNavigate();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-float delay-300" />
      <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-secondary rounded-full animate-glow" />
      <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-secondary/80 rounded-full animate-glow delay-200" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 text-secondary mb-8 animate-fade-in-up">
            <Brain className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Document Generation</span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-5xl md:text-7xl font-bold text-primary-foreground mb-6 animate-fade-in-up delay-100">
            Cypher Creative
            <span className="block gradient-text mt-2">Digital Solutions</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-primary-foreground/70 mb-12 max-w-2xl mx-auto animate-fade-in-up delay-200">
            Generate professional bank statements and payslips instantly using advanced AI. 
            Secure, fast, and perfectly formatted for your needs. Easily apply for vehicle 
            financing through our trusted dealership partners.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
            <Button 
              variant="hero" 
              size="xl"
              onClick={onGetStarted}
              className="group"
            >
              <FileText className="w-5 h-5 transition-transform group-hover:rotate-12" />
              Generate Documents
            </Button>
            {/* <Button 
              variant="glass" 
              size="xl"
              onClick={() => navigate('/products')}
              className="group bg-standard-bank hover:bg-standard-bank/90 text-white border-standard-bank"
            >
              <ShoppingBag className="w-5 h-5 transition-transform group-hover:scale-110" />
              Explore Products
            </Button> */}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 animate-fade-in-up delay-400">
            {[
              { icon: Shield, title: "Secure", desc: "Your data is protected" },
              { icon: Clock, title: "Fast", desc: "Documents in minutes" },
              { icon: Sparkles, title: "AI-Powered", desc: "Intelligent generation" },
            ].map((feature, i) => (
              <div 
                key={feature.title}
                className="glass-card rounded-2xl p-6 text-left backdrop-blur-xl hero-gradient border border-border/50"
              >
                <feature.icon className="w-10 h-10 text-secondary mb-4" />
                <h3 className="font-display text-lg font-semibold text-primary-foreground mb-1">
                  {feature.title}
                </h3>
                <p className="text-primary-foreground/60 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
