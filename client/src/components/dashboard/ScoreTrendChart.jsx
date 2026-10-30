// Line chart of score % for the last few tests. Plain SVG, scales with its container.
const W = 500;
const H = 200;
const PAD = { left: 30, right: 14, top: 14, bottom: 30 };
const GRID = [20, 40, 60, 80];

export default function ScoreTrendChart({ points }) {
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (v) => PAD.top + plotH - (Math.max(0, Math.min(100, v)) / 100) * plotH;
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.scorePct).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Score trend over ${points.length} tests: ${points.map((p) => `${p.scorePct}%`).join(", ")}`}
    >
      {GRID.map((g) => (
        <g key={g}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(g)} y2={y(g)} stroke="#e3e6ef" strokeWidth="1" />
          <text x={0} y={y(g) + 4} fontSize="11" fill="#66708a">
            {g}
          </text>
        </g>
      ))}
      <path d={path} fill="none" stroke="#2336c4" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={p.attemptId}>
          <circle cx={x(i)} cy={y(p.scorePct)} r={i === points.length - 1 ? 5 : 3} fill={i === points.length - 1 ? "#2336c4" : "#fff"} stroke="#2336c4" strokeWidth="2">
            <title>{`${p.test?.title || "Test"} · ${p.score}/${p.maxScore} (${p.scorePct}%)`}</title>
          </circle>
          <text x={x(i)} y={H - 8} fontSize="11" fill="#66708a" textAnchor="middle">
            {String(i + 1).padStart(2, "0")}
          </text>
        </g>
      ))}
      {last && (
        <text x={x(points.length - 1)} y={y(last.scorePct) - 10} fontSize="12" fontWeight="800" fill="#101935" textAnchor={points.length === 1 ? "middle" : "end"}>
          {last.scorePct}%
        </text>
      )}
    </svg>
  );
}
