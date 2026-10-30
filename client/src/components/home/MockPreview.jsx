import { useEffect, useState } from "react";
import { ArrowRight, Check, Languages, Timer } from "lucide-react";
import Button from "../ui/Button";

const options = [
  { key: "A", text: "Brahmani" },
  { key: "B", text: "Mahanadi" },
  { key: "C", text: "Baitarani" },
  { key: "D", text: "Subarnarekha" },
];

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// Small working demo of the exam screen: pick an answer, timer ticks.
export default function MockPreview() {
  const [picked, setPicked] = useState("B");
  const [seconds, setSeconds] = useState(102);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 102)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex w-full flex-col gap-4 lg:w-[510px] lg:shrink-0">
      <div className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-6 shadow-float">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand">OSSC CGL · GK</span>
          <span className="flex items-center gap-1.5 text-sm font-bold tabular-nums text-ink">
            <Timer className="size-4" aria-hidden="true" />
            <span aria-label="Time left">{fmt(seconds)}</span>
          </span>
        </div>

        <fieldset className="flex flex-col gap-5">
          <legend className="contents">
            <span className="block text-[11px] font-semibold text-muted">QUESTION 18 OF 100</span>
            <span className="mt-5 block text-lg font-bold text-ink">The Hirakud Dam is built across which river?</span>
            <span lang="or" className="mt-2 block font-odia text-base text-muted">
              ହୀରାକୁଦ ବନ୍ଧ କେଉଁ ନଦୀ ଉପରେ ନିର୍ମିତ ହୋଇଛି?
            </span>
          </legend>

          <div className="flex flex-col gap-[9px]">
            {options.map((o) => {
              const active = picked === o.key;
              return (
                <label
                  key={o.key}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] border p-[13px] text-[13px] transition-colors ${
                    active ? "border-brand bg-brand-soft font-bold text-brand" : "border-line bg-white font-medium text-ink hover:border-brand/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="demo-answer"
                    value={o.key}
                    checked={active}
                    onChange={() => setPicked(o.key)}
                    className="size-4 accent-brand"
                  />
                  <span className="flex-1">
                    <span className="mr-3">{o.key}</span>
                    {o.text}
                  </span>
                  {active && <Check className="size-4" aria-hidden="true" />}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-muted">Real pattern. Real confidence.</p>
          <Button to="/mock-tests" size="sm">
            Save &amp; Next <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <p className="flex items-center justify-center gap-2 text-xs text-muted">
        <Languages className="size-[17px]" aria-hidden="true" />
        <span className="font-odia">English + ଓଡ଼ିଆ</span>
        <span aria-hidden="true">•</span>
        <span>Your pace, your language</span>
      </p>
    </div>
  );
}
