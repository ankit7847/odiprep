import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, BadgeCheck, CheckCircle2, ShieldCheck } from "lucide-react";
import Button from "../components/ui/Button";
import LanguageToggle from "../components/ui/LanguageToggle";
import MockPreview from "../components/home/MockPreview";
import { examCards, features, principles } from "../data/homeContent";
import { useAuth } from "../context/AuthContext";

const container = "mx-auto w-full max-w-[1440px] px-5 md:px-16";

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="flex flex-col gap-2">
      {eyebrow && <p className="text-[11px] font-extrabold text-brand">{eyebrow}</p>}
      <h2 className="text-[26px] font-extrabold text-ink md:text-[32px]">{title}</h2>
      <p className="text-sm text-muted">{subtitle}</p>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();

  return (
    <>
      {/* Hero */}
      <section className={`${container} flex flex-col gap-10 pt-10 pb-12 lg:flex-row lg:items-center lg:gap-[72px] lg:pt-[72px] lg:pb-16`}>
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <span className="self-start rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand">
            100% free · Built for Odisha
          </span>
          <h1 className="text-[40px] leading-[1.25] font-extrabold text-ink md:text-[52px] xl:text-[60px] xl:leading-[1.5]">
            Odisha govt exams, practised the real way
          </h1>
          <div className="flex flex-col gap-2.5 text-[15px] text-muted md:text-[17px]">
            <p>
              From your first PYQ to your next personal best. Practise real papers, take timed mocks and know exactly
              what to work on.
            </p>
            <p lang="or" className="font-odia">
              ନିଜ ଭାଷାରେ ପ୍ରସ୍ତୁତି କରନ୍ତୁ। ନିଜ ସ୍ୱପ୍ନ ଆଡ଼କୁ ଆଗେଇ ଚାଲନ୍ତୁ।
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button to="/mock-tests">
              Start a free mock <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <Button to="/pyq" variant="secondary">
              Browse PYQs
            </Button>
          </div>
          <p className="flex items-center gap-5 text-xs text-muted">
            <ShieldCheck className="size-[18px] shrink-0 text-brand" aria-hidden="true" />
            No paywalls. No subscriptions. Just practice.
          </p>
          <LanguageToggle className="inline-flex self-start md:hidden" />
        </div>

        <MockPreview />
      </section>

      {/* Principles strip */}
      <div className="border-y border-line bg-white">
        <ul className={`${container} flex justify-between gap-4 py-6 text-[11px] font-semibold text-ink md:text-[13px]`}>
          {principles.map((p) => (
            <li key={p.full} className={`items-center gap-2 ${p.short ? "flex" : "hidden md:flex"}`}>
              <CheckCircle2 className="size-4 shrink-0 text-brand" aria-hidden="true" />
              {p.short ? (
                <>
                  <span className="md:hidden">{p.short}</span>
                  <span className="hidden md:inline">{p.full}</span>
                </>
              ) : (
                p.full
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Exams */}
      <section id="exams" className={`${container} flex flex-col gap-7 py-12 md:py-16`}>
        <SectionHeading
          eyebrow="YOUR GOAL, YOUR STARTING POINT"
          title="One place. Every next step."
          subtitle="Choose your exam and start with a previous-year paper."
        />
        <ul className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
          {examCards.map(({ slug, icon: Icon, name, board, detail }) => (
            <li key={slug}>
              <Link
                to={`/exams/${slug}`}
                className="group flex h-full flex-col gap-3.5 rounded-2xl border border-line bg-white p-4 shadow-card transition-colors hover:border-brand/40 md:p-6"
              >
                <Icon className="size-[25px] text-brand" strokeWidth={1.75} aria-hidden="true" />
                <span className="flex flex-col gap-1">
                  <span className="text-[17px] font-extrabold text-ink md:text-[21px]">{name}</span>
                  <span className="text-xs text-muted">{board}</span>
                  <span className="hidden text-xs text-muted md:block">{detail}</span>
                </span>
                <span className="mt-auto flex min-h-11 items-center gap-2 text-xs font-bold text-brand">
                  View papers
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          to="/exams/odisha-police-si"
          className="flex items-center gap-2.5 rounded-xl bg-brand-soft p-4 text-sm text-brand hover:underline"
        >
          <BadgeCheck className="size-5 shrink-0" aria-hidden="true" />
          Also preparing for Odisha Police SI? Explore SI papers and mock tests →
        </Link>
      </section>

      {/* Features */}
      <section className="bg-white">
        <div className={`${container} flex flex-col gap-8 py-12 md:py-14`}>
          <SectionHeading title="Practice with a purpose." subtitle="Everything you need to turn effort into progress." />
          <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex flex-col gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft">
                  <Icon className="size-5 text-brand" aria-hidden="true" />
                </span>
                <h3 className="text-[17px] font-extrabold text-ink">{title}</h3>
                <p className="text-[13px] text-muted">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Call to action */}
      <section className="bg-ink">
        <div className={`${container} flex flex-col gap-8 py-12 md:flex-row md:items-center md:py-12`}>
          <div className="flex flex-1 flex-col gap-2.5">
            <h2 className="text-[28px] leading-[1.3] font-extrabold text-white md:text-[36px] md:leading-[1.5]">
              Your next chapter starts with practice.
            </h2>
            <p className="text-sm text-navy-muted">Create a free account. Save your progress. Come back stronger.</p>
            <p lang="or" className="font-odia text-sm text-navy-muted">
              ଆଜିଠାରୁ ଆରମ୍ଭ କରନ୍ତୁ।
            </p>
          </div>
          <Button to={user ? "/dashboard" : "/register"} variant="inverse" className="self-start md:self-auto">
            {user ? "Go to your dashboard" : "Create a free account"} <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </section>
    </>
  );
}
