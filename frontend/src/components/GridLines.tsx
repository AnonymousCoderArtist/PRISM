/**
 * GridLines — LŪMEN Swiss editorial grid
 * 4 vertical @ ~12.6% intervals, 2 horizontal, 8 plus marks with animations
 * Colors: rgba(255,255,255,0.04) — accent #AFDDFF at 80% for nav numbers
 */
export function GridLines() {
  // 4 vertical lines positioned editorially (12.6% steps approx — Swiss 12-col inspired)
  const verticals = [
    { left: "12.6%", delay: "0.05s" },
    { left: "37.8%", delay: "0.14s" },
    { left: "62.2%", delay: "0.22s" },
    { left: "87.4%", delay: "0.30s" },
  ];
  // 2 horizontal rules
  const horizontals = [
    { top: "22%", delay: "0.18s" },
    { top: "74%", delay: "0.28s" },
  ];
  // 8 plus marks at intersections / editorial margins
  const plusMarks = [
    { left: "12.6%", top: "22%", delay: "0.45s" },
    { left: "37.8%", top: "22%", delay: "0.50s" },
    { left: "62.2%", top: "22%", delay: "0.55s" },
    { left: "87.4%", top: "22%", delay: "0.60s" },
    { left: "12.6%", top: "74%", delay: "0.65s" },
    { left: "37.8%", top: "74%", delay: "0.70s" },
    { left: "62.2%", top: "74%", delay: "0.75s" },
    { left: "87.4%", top: "74%", delay: "0.80s" },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden style={{ zIndex: 0 }}>
      {/* verticals */}
      {verticals.map((v, i) => (
        <div
          key={`v-${i}`}
          className="absolute top-0 bottom-0 w-px animate-lumen-draw-v"
          style={{
            left: v.left,
            background: "rgba(255,255,255,0.04)",
            animationDelay: v.delay,
          }}
        />
      ))}
      {/* horizontals */}
      {horizontals.map((h, i) => (
        <div
          key={`h-${i}`}
          className="absolute left-0 right-0 h-px animate-lumen-draw-h"
          style={{
            top: h.top,
            background: "rgba(255,255,255,0.04)",
            animationDelay: h.delay,
          }}
        />
      ))}
      {/* plus marks — 8 */}
      {plusMarks.map((p, i) => (
        <div
          key={`plus-${i}`}
          className="absolute animate-lumen-plus"
          style={{
            left: p.left,
            top: p.top,
            width: 10,
            height: 10,
            transform: "translate(-50%, -50%)",
            animationDelay: p.delay,
          }}
        >
          {/* plus: two hairlines crossing */}
          <span
            className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
            style={{ background: "rgba(175,221,255,0.22)" }}
          />
          <span
            className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2"
            style={{ background: "rgba(175,221,255,0.22)" }}
          />
        </div>
      ))}
      {/* outer hairline border — border-white/80 Swiss editorial */}
      <div
        className="absolute inset-0 animate-lumen-fade"
        style={{
          border: "1px solid rgba(255,255,255,0.06)",
          animationDelay: "0.10s",
        }}
      />
    </div>
  );
}

export default GridLines;
