import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-16 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center">
            <Shield className="w-7 h-7 text-secondary" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold text-foreground">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div className="space-y-8 text-foreground">
            <section className="p-6 rounded-2xl bg-card border border-border/50">
              <h2 className="font-display text-2xl font-semibold mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed">
                We collect information you provide directly to us when using our document generation service, 
                including personal details such as name, ID number, employment information, and financial data 
                necessary for creating your requested documents.
              </p>
            </section>

            <section className="p-6 rounded-2xl bg-card border border-border/50">
              <h2 className="font-display text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The information collected is used solely for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Generating the requested financial documents</li>
                <li>Ensuring accuracy and consistency across documents</li>
                <li>Providing customer support when needed</li>
                <li>Improving our AI algorithms and services</li>
              </ul>
            </section>

            <section className="p-6 rounded-2xl bg-card border border-border/50">
              <h2 className="font-display text-2xl font-semibold mb-4">3. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not store your personal information after document generation is complete. 
                All data is processed in real-time and immediately discarded after your documents 
                are delivered. Generated documents are available for download for 24 hours only.
              </p>
            </section>

            <section className="p-6 rounded-2xl bg-card border border-border/50">
              <h2 className="font-display text-2xl font-semibold mb-4">4. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement industry-standard security measures including SSL encryption for all 
                data transmission, secure processing environments, and strict access controls to 
                protect your information during the document generation process.
              </p>
            </section>

            <section className="p-6 rounded-2xl bg-card border border-border/50">
              <h2 className="font-display text-2xl font-semibold mb-4">5. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not share, sell, or distribute your personal information to any third parties. 
                Our document generation is handled entirely within our secure systems.
              </p>
            </section>

            <section className="p-6 rounded-2xl bg-card border border-border/50">
              <h2 className="font-display text-2xl font-semibold mb-4">6. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at 
                info@gautengtech.digital, call +27 69 278 4497, or WhatsApp us at +27 69 278 4497.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
