import { Builder } from "@/components/Builder";
import { Explode } from "@/components/Explode";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Menu } from "@/components/Menu";
import { Footer } from "@/components/Footer";
import { Preloader } from "@/components/Preloader";

export default function Home() {
  return (
    <>
      <Preloader />
      <main>
        <Hero />
        <div className="py-16">
          <Marquee />
        </div>
        <Explode />
        <Menu />
        <Builder />
      </main>
      <Footer />
    </>
  );
}
