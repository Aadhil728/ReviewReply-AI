import Link from "next/link";
import {
  ArrowRight,
  Languages,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
  Star,
  WandSparkles,
} from "lucide-react";
import { Brand } from "@/components/branding/brand";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";

const features = [
  [
    WandSparkles,
    "Context-aware replies",
    "Respond to the details customers actually mentioned—not a generic template.",
  ],
  [
    ShieldCheck,
    "Calm complaint handling",
    "Turn difficult feedback into thoughtful, professional conversations.",
  ],
  [
    MessageCircleHeart,
    "A consistent voice",
    "Keep every reply aligned with your business personality and preferred tone.",
  ],
  [
    Sparkles,
    "Seven useful tones",
    "Move naturally between warm, concise, luxury, casual, and professional responses.",
  ],
  [
    Languages,
    "Multiple languages",
    "Write in the language your customer expects, including Arabic, Tamil, and Sinhala.",
  ],
  [
    Star,
    "Searchable history",
    "Find, edit, and reuse earlier responses whenever you need them.",
  ],
] as const;

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For trying the essentials",
    features: [
      "10 AI replies / month",
      "1 business profile",
      "Basic tones",
      "Response history",
    ],
    action: "Start free",
    featured: false,
  },
  {
    name: "Pro",
    price: "$7",
    description: "For businesses replying regularly",
    features: [
      "200 AI replies / month",
      "Full brand voice",
      "Multiple languages",
      "Priority generation",
    ],
    action: "Coming soon",
    featured: true,
  },
  {
    name: "Agency",
    price: "$19",
    description: "For managing several brands",
    features: [
      "1,000 AI replies / month",
      "Multiple profiles",
      "Brand management",
      "Usage analytics",
    ],
    action: "Coming soon",
    featured: false,
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden">
      <header className="shell flex h-20 items-center justify-between">
        <Brand />
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">
              Try for free <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </header>
      <main>
        <section className="relative border-y border-border/70 py-20 sm:py-28">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_46%)]" />
          <div className="shell grid items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <p className="eyebrow mb-5">
                Thoughtful replies, without the blank page
              </p>
              <h1 className="text-balance text-5xl font-bold leading-[1.02] tracking-[-.045em] sm:text-6xl">
                Turn every customer review into the right response.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                Generate professional, natural responses in seconds—while
                keeping your brand voice consistent.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/register">
                    Generate your first reply <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <a href="#how">See how it works</a>
                </Button>
              </div>
              <p className="mt-5 text-sm text-muted-foreground">
                10 free replies each month. No card required.
              </p>
            </div>
            <div className="relative">
              <div className="absolute -inset-8 -z-10 rounded-full bg-primary/10 blur-3xl" />
              <div className="rounded-3xl border bg-card p-4 shadow-[0_24px_80px_-32px_rgba(56,32,117,.35)] sm:p-6">
                <div className="rounded-2xl border bg-background p-5">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow">Customer review</span>
                    <span className="text-sm font-semibold">3.0</span>
                  </div>
                  <div className="mt-3 flex text-warning">
                    ★★★<span className="text-border">★★</span>
                  </div>
                  <p className="mt-4 text-[15px] leading-7">
                    “The food was great and the staff were kind, but delivery
                    took nearly an hour.”
                  </p>
                </div>
                <div className="my-3 flex justify-center">
                  <span className="grid size-9 place-items-center rounded-full border bg-card text-primary">
                    <Sparkles className="size-4" />
                  </span>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-accent/65 p-5">
                  <span className="eyebrow">ReviewReply AI</span>
                  <p className="mt-3 text-[15px] leading-7">
                    Thank you for sharing this with us. We’re glad you enjoyed
                    the food and felt well looked after by our team. We’re sorry
                    the delivery took longer than expected and appreciate your
                    patience. We’ll use your feedback to help us provide a
                    faster experience next time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="shell py-20 text-center">
          <p className="text-sm font-semibold text-muted-foreground">
            Built for businesses that care about every customer conversation.
          </p>
          <p className="mx-auto mt-6 max-w-3xl text-2xl font-semibold tracking-tight">
            From five-star praise to difficult complaints, write a response that
            feels considered—not copied.
          </p>
        </section>
        <section id="features" className="border-y bg-muted/45 py-24">
          <div className="shell">
            <div className="max-w-2xl">
              <p className="eyebrow">Everything you need</p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight">
                Reply well, every time.
              </h2>
              <p className="mt-4 text-muted-foreground">
                A focused toolkit for faster responses without losing the human
                touch.
              </p>
            </div>
            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-2 lg:grid-cols-3">
              {features.map(([Icon, title, text]) => (
                <article key={title} className="bg-card p-7">
                  <span className="grid size-10 place-items-center rounded-xl bg-accent text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="how" className="shell py-24">
          <div className="text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">
              From review to reply in three steps.
            </h2>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              [
                "01",
                "Paste the review",
                "Add the customer’s words and select their star rating.",
              ],
              [
                "02",
                "Choose your style",
                "Pick a tone, length, and response language.",
              ],
              [
                "03",
                "Generate and respond",
                "Edit the result, then copy it when it sounds right.",
              ],
            ].map(([n, t, d]) => (
              <div key={n} className="border-t pt-6">
                <span className="text-sm font-bold text-primary">{n}</span>
                <h3 className="mt-7 text-xl font-bold">{t}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </section>
        <section id="pricing" className="border-y bg-muted/45 py-24">
          <div className="shell">
            <div className="text-center">
              <p className="eyebrow">Simple pricing</p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight">
                Start free. Grow when it helps.
              </h2>
            </div>
            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className={`relative rounded-2xl border bg-card p-7 ${plan.featured ? "border-primary shadow-lg shadow-primary/10" : ""}`}
                >
                  {plan.featured && (
                    <span className="absolute right-5 top-5 rounded-full bg-accent px-3 py-1 text-xs font-bold text-primary">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                  <p className="mt-7 text-4xl font-bold tracking-tight">
                    {plan.price}
                    <span className="text-sm font-medium text-muted-foreground">
                      {" "}
                      / month
                    </span>
                  </p>
                  <ul className="my-7 space-y-3 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <span className="text-success">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild={plan.name === "Free"}
                    variant={plan.featured ? "primary" : "secondary"}
                    className="w-full"
                    disabled={plan.name !== "Free"}
                  >
                    {plan.name === "Free" ? (
                      <Link href="/register">{plan.action}</Link>
                    ) : (
                      plan.action
                    )}
                  </Button>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
