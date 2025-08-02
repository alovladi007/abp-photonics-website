import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";

import SlideContent from "./SlideContent";

interface Slide {
  id: string;
  media: { type: "image" | "video"; src: string };
  headline: string;
  kicker: string;
  blurb: string;
  cta: { label: string; href: string };
}

const slides: Slide[] = [
  {
    id: "slide-microchips",
    media: { type: "image", src: "/hero/microchips.jpg" },
    headline: "Advanced Microchip Solutions",
    kicker: "Silicon Photonics Innovation",
    blurb: "Pioneering next-generation photonic integrated circuits for quantum computing and AI acceleration.",
    cta: { label: "Explore Microchips", href: "#microchips" },
  },
  {
    id: "slide-fpga",
    media: { type: "image", src: "/hero/fpga.jpg" },
    headline: "FPGA Development Excellence",
    kicker: "Programmable Logic Design",
    blurb: "Custom FPGA solutions for high-performance computing, signal processing, and embedded systems.",
    cta: { label: "View FPGA Solutions", href: "#fpga" },
  },
  {
    id: "slide-cybersecurity",
    media: { type: "image", src: "/hero/cybersecurity.jpg" },
    headline: "Quantum-Safe Cybersecurity",
    kicker: "AI-Powered Protection",
    blurb: "Revolutionary security solutions combining quantum encryption with AI threat detection.",
    cta: { label: "Secure Your Future", href: "#cybersecurity" },
  },
  {
    id: "slide-bioinformatics",
    media: { type: "image", src: "/hero/bioinformatics.jpg" },
    headline: "Bioinformatics Innovation",
    kicker: "Photonic DNA Sequencing",
    blurb: "Breakthrough optical technologies for rapid genomic analysis and personalized medicine.",
    cta: { label: "Discover Bio Solutions", href: "#bioinformatics" },
  },
];

export default function HeroSlider() {
  return (
    <Swiper
      modules={[Autoplay, Pagination, Navigation, EffectFade]}
      effect="fade"
      autoplay={{ delay: 6000, disableOnInteraction: false }}
      loop
      navigation
      pagination={{ clickable: true }}
      className="relative w-full h-screen hero-slider"
    >
      {slides.map((s) => (
        <SwiperSlide key={s.id} className="relative w-full h-full">
          {/* background media */}
          {s.media.type === "video" ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              src={s.media.src}
            />
          ) : (
            <img
              src={s.media.src}
              alt={s.headline}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* overlay tint */}
          <div className="absolute inset-0 bg-[#001933]/70" />

          {/* foreground copy */}
          <SlideContent {...s} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}