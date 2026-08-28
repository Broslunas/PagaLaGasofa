import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { DemoPreview } from "@/components/landing/demo-preview";
import { Steps } from "@/components/landing/steps";
import { FAQ } from "@/components/landing/faq";
import { FinalCTA } from "@/components/landing/final-cta";

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <Steps />
      <DemoPreview />
      <Features />
      <FAQ />
      <FinalCTA />
    </main>
  );
}
