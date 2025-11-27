import { InteractiveGridPattern } from "./ui/interactive-grid-pattern";
import Marquee from "./ui/marquee";
import { cn } from "~~/lib/utils";

const reviews = [
  {
    name: "Maria Rodriguez",
    username: "@maria_es",
    body: "Found my perfect Spanish tutor in seconds! The pay-per-second model is genius - no more wasted subscription fees.",
    img: "https://avatar.vercel.sh/maria",
  },
  {
    name: "Hiroshi Tanaka",
    username: "@hiroshi_jp",
    body: "As a Japanese tutor, LangDAO has transformed how I teach. Instant connections with motivated learners worldwide!",
    img: "https://avatar.vercel.sh/hiroshi",
  },
  {
    name: "Sophie Chen",
    username: "@sophie_fr",
    body: "Learning French has never been this engaging. Real conversations with native speakers - exactly what I needed!",
    img: "https://avatar.vercel.sh/sophie",
  },
  {
    name: "Ahmed Hassan",
    username: "@ahmed_ar",
    body: "The Web3 payments are seamless and secure. I love how transparent everything is on the blockchain.",
    img: "https://avatar.vercel.sh/ahmed",
  },
  {
    name: "Emma Thompson",
    username: "@emma_en",
    body: "Teaching English on LangDAO is incredibly rewarding. The platform makes it so easy to connect with students.",
    img: "https://avatar.vercel.sh/emma",
  },
  {
    name: "Carlos Silva",
    username: "@carlos_pt",
    body: "Finally, a language learning platform that respects my time and budget. Pay only for what you use!",
    img: "https://avatar.vercel.sh/carlos",
  },
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({ img, name, username, body }: { img: string; name: string; username: string; body: string }) => {
  return (
    <figure
      className={cn(
        "relative h-full w-80 cursor-pointer overflow-hidden rounded-2xl border p-6",
        "border-white/10 bg-white/5 backdrop-blur-sm",
        "hover:bg-white/10 hover:border-white/20 hover:scale-105",
        "transition-all duration-300 group",
      )}
    >
      {/* Gradient Accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex flex-row items-center gap-3 mb-4">
        <div className="relative">
          <img className="rounded-full ring-2 ring-white/20" width="48" height="48" alt="" src={img} />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#0F0520]" />
        </div>
        <div className="flex flex-col">
          <figcaption className="text-base font-bold text-white">{name}</figcaption>
          <p className="text-sm font-medium text-white/50">{username}</p>
        </div>
      </div>
      <blockquote className="text-base text-white/80 leading-relaxed font-light">"{body}"</blockquote>
    </figure>
  );
};

export function TestimonialsSection() {
  return (
    <div className="relative py-24 overflow-hidden bg-gradient-to-b from-[#0F0520] via-[#1A0B2E] to-[#0F0520]">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
            <span className="text-sm font-semibold text-amber-300 tracking-wide">TESTIMONIALS</span>
          </div>
          <h2 className="text-5xl sm:text-6xl font-black text-white mb-6">
            Loved by learners
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
              worldwide
            </span>
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto font-light">
            Real stories from our global community of language enthusiasts
          </p>
        </div>

        {/* Marquee Reviews */}
        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden gap-6">
          <Marquee pauseOnHover className="[--duration:25s]">
            {firstRow.map(review => (
              <ReviewCard key={review.username} {...review} />
            ))}
          </Marquee>
          <Marquee reverse pauseOnHover className="[--duration:25s]">
            {secondRow.map(review => (
              <ReviewCard key={review.username} {...review} />
            ))}
          </Marquee>
          <div className="from-[#0F0520] pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r"></div>
          <div className="from-[#0F0520] pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l"></div>
        </div>
      </div>
    </div>
  );
}
