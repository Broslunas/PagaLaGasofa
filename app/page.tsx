import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <Features />
    </main>
  );
}
