import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { Clock, AlertCircle, Activity } from "lucide-react";
import { usePrism } from "../store/PrismContext";

export function BottomPanel() {
  const { activity, selectedWardCode } = usePrism();
  const accent = "#CCFF00";
  const accentDim = "rgba(204,255,0,0.18)";

  const isFlat = useMemo(() => {
    if (activity.length < 10) return false;
    const last = activity.slice(-10);
    const max = Math.max(...last);
    const min = Math.min(...last);
    const variance = max - min;
    const avg = last.reduce((a, b) => a + b, 0) / last.length;
    return variance < 1.2 && avg < 2.5; // silent = low + flat
  }, [activity]);

  const xLabels = useMemo(() => activity.map((_, i) => `${String(9 + Math.floor(i / 6)).padStart(2, "0")}:${String((i * 10) % 60).padStart(2, "0")}`), [activity]);

  const option = useMemo(() => ({
    backgroundColor: "transparent",
    grid: { left: 38, right: 12, top: 10, bottom: 22 },
    xAxis: {
      type: "category",
      data: xLabels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: "#1B2428" } },
      axisLabel: { color: "#4A5254", fontSize: 9, fontFamily: "JetBrains Mono" },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      min: 0,
      axisLine: { show: false },
      axisLabel: { color: "#6E7778", fontSize: 9, fontFamily: "JetBrains Mono" },
      splitLine: { lineStyle: { color: "rgba(27,36,40,0.9)", type: "dashed" } },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(5,6,7,0.92)",
      borderColor: "#1B2428",
      textStyle: { color: "#E8ECEB", fontSize: 11, fontFamily: "JetBrains Mono" },
      axisPointer: { lineStyle: { color: "rgba(204,255,0,0.35)" } },
    },
    series: [
      {
        data: activity,
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: { color: isFlat ? "#A88BFF" : accent, width: 1.8 },
        areaStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: isFlat ? "rgba(168,139,255,0.22)" : accentDim },
              { offset: 1, color: "rgba(204,255,0,0)" },
            ],
          },
        },
        markLine: isFlat ? {
          silent: true,
          lineStyle: { color: "#A88BFF", type: "dashed", width: 1 },
          data: [{ yAxis: 1.5 }],
          label: { show: false },
        } : undefined,
      },
    ],
    animationDuration: 600,
  }), [activity, xLabels, isFlat, accent, accentDim]);

  return (
    <div className="panel prism-bottom" style={{ borderTop: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 320px", overflow: "hidden" }}>
      {/* Left 70% : Activity Graph */}
      <div style={{ borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div className="panel-header" style={{ background: "var(--bg-panel-2)" }}>
          <span className="panel-title"><Clock size={12} /> ACTIVITY TRACK — {selectedWardCode ? `WARD ${selectedWardCode}` : "GLOBAL"}</span>
          <span className="mono" style={{ fontSize: 9, display: "inline-flex", alignItems: "center", gap: 6, color: isFlat ? "var(--purple)" : "var(--lime)" }}>
            {isFlat ? <><AlertCircle size={10} /> SILENCE DETECTED — INFO VOID</> : <><Activity size={10} /> LIVE MONITORING{selectedWardCode ? ` • WARD ${selectedWardCode}` : " • GLOBAL"}</>}
          </span>
        </div>
        <div style={{ flex: 1, position: "relative", background: "var(--bg-panel)" }}>
          <ReactECharts option={option} style={{ height: "100%", width: "100%" }} notMerge lazyUpdate />
          {isFlat && (
            <div style={{ position: "absolute", top: 8, right: 12, background: "rgba(168,139,255,0.12)", border: "1px solid rgba(168,139,255,0.35)", color: "var(--purple)", fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.08em", padding: "4px 7px", borderRadius: 3 }}>
              FLATLINE 6h+ — RECOMMEND RECON
            </div>
          )}
          <div className="mono" style={{ position: "absolute", bottom: 4, left: 10, fontSize: 8, color: "var(--text-faint)" }}>
            X: time (rolling 30) • Y: reports / 10 min • Source: {selectedWardCode ? `ward ${selectedWardCode} stream` : "global mix"} • ongoing heartbeat 2.1s • updates on every ward click
          </div>
        </div>
      </div>

      {/* Right 30% : Void / Legend */}
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-panel-2)" }}>
        <div className="panel-header">
          <span className="panel-title"><Activity size={12} /> SIGNAL DIAGNOSTICS</span>
          <span className="mono" style={{ fontSize: 9, color: "var(--text-faint)" }}>{activity.length} PTS</span>
        </div>
        <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
          <div style={{ background: isFlat ? "rgba(168,139,255,0.12)" : "rgba(204,255,0,0.08)", border: isFlat ? "1px solid rgba(168,139,255,0.35)" : "1px solid rgba(204,255,0,0.22)", borderRadius: 4, padding: "8px 9px" }}>
            <div className="mono" style={{ fontSize: 9, fontWeight: 700, color: isFlat ? "var(--purple)" : "var(--lime)" }}>{isFlat ? "◉ VOID CONDITION" : "◎ NORMAL SIGNAL"}</div>
            <div className="mono" style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 4, lineHeight: 1.45 }}>
              {isFlat
                ? "Graph is flat/silent — no reports flowing. PRISM flags as information void (purple). Trigger: variance <1.2 & avg <2.5 for 10 pts."
                : "Graph is active — reports continuously arrive. When silence occurs, PRISM detects void and raises priority."}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 3, padding: "7px 8px" }}>
              <div className="mono" style={{ fontSize: 8, color: "var(--text-muted)" }}>LAST VALUE</div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 800, color: isFlat ? "var(--purple)" : "var(--lime)" }}>{activity[activity.length - 1]}</div>
              <div className="mono" style={{ fontSize: 8, color: "var(--text-faint)" }}>reports/10m</div>
            </div>
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 3, padding: "7px 8px" }}>
              <div className="mono" style={{ fontSize: 8, color: "var(--text-muted)" }}>VARIANCE (10)</div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{(Math.max(...activity.slice(-10)) - Math.min(...activity.slice(-10))).toFixed(1)}</div>
              <div className="mono" style={{ fontSize: 8, color: "var(--text-faint)" }}>{isFlat ? "flat" : "active"}</div>
            </div>
          </div>

          <div className="mono" style={{ fontSize: 8, color: "var(--text-faint)", lineHeight: 1.4, borderTop: "1px dashed var(--border)", paddingTop: 6 }}>
            Interaction: click any ward / incident on map → graph filters to that locality. Flatline = silence = information void → priority ↑.<br />
            API: <span style={{ color: "var(--text-muted)" }}>GET /api/areas/:id/activity</span> (mock) • WS <span style={{ color: "var(--purple)" }}>INFORMATION_VOID_DETECTED</span> → purple overlay (next milestone)
          </div>
        </div>
      </div>
    </div>
  );
}
