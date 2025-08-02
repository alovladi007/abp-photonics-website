import Link from "next/link";

export default function SlideContent({
  headline,
  kicker,
  blurb,
  cta,
}: {
  headline: string;
  kicker: string;
  blurb: string;
  cta: { label: string; href: string };
}) {
  return (
    <div className="relative z-10 flex items-center h-full px-6 md:px-20">
      <div className="max-w-xl space-y-6 animate-fadeInUp">
        <p className="text-cyan-400 uppercase tracking-wider text-sm md:text-base font-medium">
          {kicker}
        </p>
        <h1 className="text-white text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight uppercase">
          {headline}
        </h1>
        <p className="text-gray-300 text-lg md:text-xl leading-relaxed">
          {blurb}
        </p>
        <Link
          href={cta.href}
          className="inline-flex items-center bg-cyan-400 text-slate-900 font-semibold px-8 py-4 rounded-md hover:bg-cyan-300 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-cyan-400/50"
        >
          {cta.label}
          <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}