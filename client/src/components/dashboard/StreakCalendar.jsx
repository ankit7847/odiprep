import { useEffect, useRef } from "react";

// GitHub-style practice calendar: one column per week (Mon–Sun), last 13 weeks.
const LEVEL = ["#f6f7fb", "#dde1fc", "#a7b0f5", "#2336c4"];
const ROW_LABELS = ["M", "", "W", "", "F", "", "S"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// How many days to request so the grid starts on a Monday, 13 weeks back
export function calendarDays(weeks = 13) {
  const today = new Date(Date.now() + 5.5 * 3600 * 1000); // IST date in UTC fields
  const mondayIndex = (today.getUTCDay() + 6) % 7;
  return (weeks - 1) * 7 + mondayIndex + 1;
}

export default function StreakCalendar({ days }) {
  // On narrow screens the grid scrolls; start scrolled to the latest week
  const scrollRef = useRef(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [days]);

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  let prevMonth = -1;
  const monthLabels = weeks.map((w) => {
    const m = Number(w[0].date.slice(5, 7)) - 1;
    const label = m !== prevMonth ? MONTHS[m] : "";
    prevMonth = m;
    return label;
  });

  const cols = `24px repeat(${weeks.length}, 25px)`;

  return (
    <div>
      <div ref={scrollRef} className="overflow-x-auto pb-1">
        <div
          className="grid w-max gap-[7px]"
          style={{ gridTemplateColumns: cols }}
        >
          <span />
          {monthLabels.map((m, i) => (
            <span key={i} className="text-[11px] whitespace-nowrap text-muted">
              {m}
            </span>
          ))}
          {ROW_LABELS.map((label, row) => (
            <div key={row} className="contents">
              <span className="h-5 text-[11px] leading-5 text-muted">
                {label}
              </span>
              {weeks.map((w, col) => {
                const d = w[row];
                if (!d) return <span key={col} className="h-5" />;
                return (
                  <span
                    key={col}
                    className="h-5 rounded-[3px]"
                    style={{ background: LEVEL[d.level] }}
                    title={`${d.date}: ${d.questions ? `${d.questions} questions, ${d.tests} test${d.tests === 1 ? "" : "s"}` : "no practice"}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-[5px] text-[11px] text-muted">
        Less
        {LEVEL.map((c) => (
          <span
            key={c}
            className="size-2.5 rounded-sm"
            style={{ background: c }}
            aria-hidden="true"
          />
        ))}
        More
      </div>
    </div>
  );
}
