import { Button } from "@/components/ui/button";
import { Lock, Cpu, Shield, Phone, MessageSquare, Zap } from "lucide-react";

export const HackingServiceSection = () => {
  const services = [
    {
      icon: Lock,
      title: "Phone Hacking",
      description: "Gain access to any phone, monitor calls, messages, and social media activities remotely."
    },
    {
      icon: Cpu,
      title: "Computer & Organization Hacking",
      description: "Infiltrate business partners' computers, organizations, and corporate networks for intelligence."
    },
    {
      icon: Shield,
      title: "Bank Account Access",
      description: "Retrieve financial information, transaction history, and account details from any bank."
    },
    {
      icon: Zap,
      title: "Social Media & Email Hacking",
      description: "Access private social media accounts, emails, and messaging platforms with full control."
    }
  ];

  const whatsappNumber = "+27692784497"; // Replace with actual WhatsApp number
  const whatsappMessage = encodeURIComponent("Hello, I want to book a slot for hacking services. I have a target victim.");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <section className="py-24 bg-black/90 text-white relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.1),transparent_50%)]" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-purple-500" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left column: Image and headline */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 mb-4">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Confidential & Secure</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold">
              Need to Hack Into
              <span className="block gradient-text-cyan mt-2">Your Target's Devices?</span>
            </h2>
            <p className="text-lg text-gray-300">
              We provide elite hacking services for phones, computers, organizations, and bank accounts. 
              Whether it's a business partner, spouse, competitor, or any target victim, our team can infiltrate 
              any system with precision and discretion.
            </p>
            
            {/* Services list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((service) => (
                <div key={service.title} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <service.icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{service.title}</h3>
                    <p className="text-sm text-gray-400">{service.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column: Image and CTA */}
          <div className="space-y-8">
            {/* Placeholder hacking image */}
            <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 bg-gradient-to-br from-gray-900 to-black p-1">
              <div className="relative h-64 md:h-80 bg-gradient-to-br from-cyan-900/30 to-purple-900/30 flex items-center justify-center">
                <div className="text-center">
                  <Cpu className="w-20 h-20 text-cyan-400 mx-auto mb-4" />
                  <p className="text-cyan-300 font-mono">[Hacking Interface]</p>
                  <p className="text-gray-400 text-sm mt-2">Visual representation of our hacking dashboard</p>
                </div>
                {/* Animated scanning effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-transparent animate-pulse" />
              </div>
            </div>

            {/* WhatsApp booking CTA */}
            <div className="rounded-2xl bg-gradient-to-r from-cyan-900/30 to-emerald-900/30 border border-cyan-500/30 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-white">Book Your Slot via WhatsApp</h3>
                  <p className="text-gray-300">Have a target victim? Contact us now to discuss your requirements.</p>
                </div>
              </div>
              <Button
                asChild
                size="lg"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700"
              >
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Phone className="w-5 h-5 mr-2" />
                  WhatsApp Now to Book
                </a>
              </Button>
              <p className="text-gray-400 text-sm mt-4 text-center">
                We respond within minutes. Provide details about your target and we'll craft a plan.
              </p>
            </div>

            {/* Disclaimer */}
            <div className="p-4 rounded-xl bg-red-900/20 border border-red-700/30">
              <p className="text-sm text-red-300">
                <strong>Disclaimer:</strong> Our services are for educational, authorized testing, and legitimate investigative purposes only. We do not condone illegal activities. Clients must ensure they have proper authorization before engaging our services.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom gradient text style */}
      <style>{`
        .gradient-text-cyan {
          background: linear-gradient(90deg, #22d3ee, #10b981, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </section>
  );
};