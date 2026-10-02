import React from 'react';
import { ShapeDiagramData, FractionItem } from '../types/game';

interface Props {
  diagram?: ShapeDiagramData;
}

// Helper to compute SVG sector path for circle fractions
function getSectorPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const angleDiff = endAngle - startAngle;
  if (angleDiff >= 2 * Math.PI - 0.001) {
    // Almost or full circle
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
  }

  const x1 = cx + r * Math.sin(startAngle);
  const y1 = cy - r * Math.cos(startAngle);
  const x2 = cx + r * Math.sin(endAngle);
  const y2 = cy - r * Math.cos(endAngle);
  const largeArcFlag = angleDiff > Math.PI ? 1 : 0;

  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
}

// Single Fraction Circle SVG Component
const FractionCircle: React.FC<{
  fraction: FractionItem;
  size?: number;
  showText?: boolean;
}> = ({ fraction, size = 110, showText = true }) => {
  const num = Math.min(fraction.numerator, fraction.denominator);
  const den = Math.max(fraction.denominator, 1);
  const primaryColor = fraction.color || '#0284c7';
  const unshadedColor = '#f1f5f9';
  const strokeColor = '#334155';

  const cx = 60;
  const cy = 60;
  const r = 48;

  const sectors = [];
  const step = (2 * Math.PI) / den;

  for (let i = 0; i < den; i++) {
    const startA = i * step;
    const endA = (i + 1) * step;
    const isShaded = i < num;
    const pathD = getSectorPath(cx, cy, r, startA, endA);
    sectors.push(
      <path
        key={i}
        d={pathD}
        fill={isShaded ? primaryColor : unshadedColor}
        stroke={strokeColor}
        strokeWidth="1.5"
        className="transition-colors"
      />
    );
  }

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 120 120"
        style={{ width: size, height: size }}
        className="drop-shadow-xs select-none"
      >
        <circle cx={cx} cy={cy} r={r} fill={unshadedColor} stroke={strokeColor} strokeWidth="1.5" />
        {sectors}
        {/* Center pivot pin */}
        <circle cx={cx} cy={cy} r="3" fill="#0f172a" />
      </svg>
      {showText && (
        <div className="mt-1 text-center">
          {fraction.name && (
            <span className="text-[10px] font-bold text-slate-600 block leading-tight">
              {fraction.name}
            </span>
          )}
          <span className="text-xs sm:text-sm font-black text-blue-950 bg-white/90 px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs">
            {fraction.label || `${fraction.numerator}/${fraction.denominator}`}
          </span>
        </div>
      )}
    </div>
  );
};

// Single Fraction Bar / Tape SVG Component
const FractionBar: React.FC<{
  fraction: FractionItem;
  width?: number;
  height?: number;
  subdivision?: number;
}> = ({ fraction, width = 240, height = 32, subdivision }) => {
  const num = fraction.numerator;
  const den = Math.max(fraction.denominator, 1);
  const primaryColor = fraction.color || '#2563eb';
  const totalSub = subdivision || den;
  const ratio = num / den;
  const shadedSubCount = Math.round(ratio * totalSub);

  return (
    <div className="w-full max-w-[270px] space-y-1">
      <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-700 px-1">
        <span>{fraction.name || 'Pecahan'}</span>
        <span className="text-blue-900 bg-blue-100 px-2 py-0.5 rounded font-black text-xs">
          {fraction.label || `${num}/${den}`}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-8 sm:h-9 rounded-lg overflow-hidden border-2 border-slate-700 bg-slate-100 shadow-xs"
      >
        {Array.from({ length: totalSub }).map((_, i) => {
          const segW = width / totalSub;
          const isShaded = i < shadedSubCount;
          return (
            <g key={i}>
              <rect
                x={i * segW}
                y="0"
                width={segW}
                height={height}
                fill={isShaded ? primaryColor : '#f8fafc'}
                stroke="#334155"
                strokeWidth="1.5"
              />
              {/* Optional segment division number on subtle opacity */}
              <text
                x={i * segW + segW / 2}
                y={height / 2 + 4}
                textAnchor="middle"
                fill={isShaded ? '#ffffff' : '#64748b'}
                fontSize="10"
                fontWeight="bold"
                className="select-none pointer-events-none opacity-90"
              >
                1/{totalSub}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const ShapeDiagram: React.FC<Props> = ({ diagram }) => {
  if (!diagram) return null;

  const {
    shape,
    dimensions = {},
    label,
    fractions = [],
    operator,
    comparisonSign,
    resultFraction,
    numberLineMax = 1,
    highlightPoints = [],
  } = diagram;

  return (
    <div className="my-2.5 sm:my-3.5 bg-gradient-to-b from-blue-50/90 to-sky-50/70 border-2 border-blue-200/90 rounded-2xl p-3 sm:p-4 flex flex-col items-center shadow-xs w-full overflow-hidden">
      {/* Label Badge */}
      {label && (
        <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-blue-950 bg-gradient-to-r from-blue-200 via-sky-200 to-cyan-200 px-3 py-1 rounded-full mb-2 shadow-2xs border border-blue-300">
          📐 {label}
        </span>
      )}

      {/* --- Visual Renderers by Type --- */}
      <div className="w-full flex flex-col items-center justify-center min-h-[130px] py-1">
        {/* 1. Comparison of 2 Fraction Circles */}
        {(shape === 'pecahan_lingkaran' || shape === 'pecahan_perbandingan') &&
          fractions.length === 2 &&
          !operator && (
            <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
              <FractionCircle fraction={fractions[0]} size={105} />
              <div className="flex flex-col items-center">
                <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-400 text-amber-950 font-black text-lg sm:text-xl flex items-center justify-center shadow-md border-2 border-amber-500 animate-pulse">
                  {comparisonSign || '?'}
                </span>
                <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase">Bandingkan</span>
              </div>
              <FractionCircle fraction={fractions[1]} size={105} />
            </div>
          )}

        {/* 2. Single Fraction Circle or Three Circles (Ordering) */}
        {shape === 'pecahan_lingkaran' && fractions.length === 1 && (
          <FractionCircle fraction={fractions[0]} size={130} />
        )}

        {shape === 'pecahan_urutan' && fractions.length === 3 && fractions[0].denominator <= 8 && (
          <div className="w-full flex flex-col items-center space-y-2">
            <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
              {fractions.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <FractionCircle fraction={f} size={82} />
                  {i < fractions.length - 1 && (
                    <span className="text-slate-400 font-black text-lg">&bull;</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Fraction Bars Stacked for Comparing or Ordering */}
        {(shape === 'pecahan_batang' ||
          shape === 'pecahan_urutan' ||
          shape === 'pita_pecahan') &&
          fractions.length > 0 &&
          !operator && (
            <div className="w-full flex flex-col items-center space-y-2.5">
              {fractions.map((f, i) => (
                <FractionBar key={i} fraction={f} subdivision={f.subdivision} />
              ))}
            </div>
          )}

        {/* 4. Fraction Addition (Penjumlahan Pecahan) */}
        {(shape === 'pecahan_penjumlahan' || operator === '+') && fractions.length >= 2 && (
          <div className="w-full flex flex-col items-center space-y-2">
            <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              <div className="p-2 bg-white/90 rounded-2xl border border-blue-200 shadow-2xs flex flex-col items-center">
                <FractionCircle fraction={fractions[0]} size={85} showText={false} />
                <span className="text-xs font-black text-blue-900 mt-1 bg-blue-100 px-2 py-0.5 rounded">
                  {fractions[0].label || `${fractions[0].numerator}/${fractions[0].denominator}`}
                </span>
              </div>

              <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                +
              </span>

              <div className="p-2 bg-white/90 rounded-2xl border border-blue-200 shadow-2xs flex flex-col items-center">
                <FractionCircle fraction={fractions[1]} size={85} showText={false} />
                <span className="text-xs font-black text-blue-900 mt-1 bg-blue-100 px-2 py-0.5 rounded">
                  {fractions[1].label || `${fractions[1].numerator}/${fractions[1].denominator}`}
                </span>
              </div>

              <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 font-black text-lg flex items-center justify-center shadow-xs">
                =
              </span>

              {resultFraction ? (
                <div className="p-2 bg-emerald-50 rounded-2xl border-2 border-emerald-400 shadow-sm flex flex-col items-center">
                  <FractionCircle fraction={resultFraction} size={85} showText={false} />
                  <span className="text-xs font-black text-emerald-950 mt-1 bg-emerald-200 px-2 py-0.5 rounded">
                    {resultFraction.label || `${resultFraction.numerator}/${resultFraction.denominator}`}
                  </span>
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl border-2 border-dashed border-blue-400 bg-white/60 flex flex-col items-center justify-center text-blue-700 font-black text-xl">
                  <span>?</span>
                  <span className="text-[9px] font-bold uppercase text-slate-500">Hasil</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. Mixed Fractions (Pecahan Campuran) */}
        {shape === 'pecahan_campuran' && (
          <div className="w-full flex flex-col items-center space-y-2">
            <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
              {fractions.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 p-2 bg-white/90 rounded-2xl border border-blue-200 shadow-2xs"
                >
                  {/* Whole part indicators */}
                  {f.whole && f.whole > 0 && (
                    <div className="flex items-center gap-1 bg-amber-100 px-2 py-1.5 rounded-xl border border-amber-300">
                      <span className="text-lg sm:text-xl font-black text-amber-950">
                        {f.whole}
                      </span>
                      <span className="text-[10px] font-bold text-amber-800 uppercase">Utuh</span>
                    </div>
                  )}
                  {/* Fractional part */}
                  <FractionCircle fraction={f} size={70} showText={false} />
                  <span className="text-xs font-black text-blue-950 bg-blue-100 px-2 py-0.5 rounded">
                    {f.label || (f.whole ? `${f.whole} ${f.numerator}/${f.denominator}` : `${f.numerator}/${f.denominator}`)}
                  </span>
                  {i < fractions.length - 1 && (
                    <span className="text-lg font-black text-blue-600 ml-1">+</span>
                  )}
                </div>
              ))}
            </div>
            {resultFraction && (
              <div className="mt-1 flex items-center gap-2 bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-300 text-emerald-950 font-black text-xs sm:text-sm">
                <span>🎯 Hasil Gabungan:</span>
                <span className="underline decoration-emerald-500 font-extrabold text-emerald-900">
                  {resultFraction.label || `${resultFraction.whole || ''} ${resultFraction.numerator}/${resultFraction.denominator}`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 6. Number Line (Garis Bilangan) */}
        {shape === 'garis_bilangan' && (
          <div className="w-full max-w-[280px] sm:max-w-[320px] py-3">
            <svg viewBox="0 0 320 90" className="w-full h-20 select-none overflow-visible">
              {/* Main Line with arrow ends */}
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#0f172a" />
                </marker>
              </defs>
              <line
                x1="20"
                y1="50"
                x2="300"
                y2="50"
                stroke="#0f172a"
                strokeWidth="3"
                markerStart="url(#arrow)"
                markerEnd="url(#arrow)"
              />

              {/* Major ticks: 0, 1 */}
              <line x1="40" y1="38" x2="40" y2="62" stroke="#0f172a" strokeWidth="2.5" />
              <text x="40" y="78" textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="bold">
                0
              </text>

              <line x1="280" y1="38" x2="280" y2="62" stroke="#0f172a" strokeWidth="2.5" />
              <text x="280" y="78" textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="bold">
                {numberLineMax}
              </text>

              {/* Intermediate points */}
              {highlightPoints.map((pt, idx) => {
                const posX = 40 + Number(pt.val) * (240 / numberLineMax);
                const colors = ['#2563eb', '#16a34a', '#d97706'];
                const col = colors[idx % colors.length];
                return (
                  <g key={idx}>
                    <line
                      x1={posX}
                      y1="42"
                      x2={posX}
                      y2="58"
                      stroke={col}
                      strokeWidth="2"
                      strokeDasharray="2 2"
                    />
                    {/* Pin Circle on the line */}
                    <circle cx={posX} cy="50" r="6" fill={col} stroke="#ffffff" strokeWidth="2" />
                    {/* Label Above */}
                    <text
                      x={posX}
                      y="24"
                      textAnchor="middle"
                      fill={col}
                      fontSize="11"
                      fontWeight="900"
                    >
                      {pt.fractionText || pt.label}
                    </text>
                    <text
                      x={posX}
                      y="35"
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      ({pt.label})
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* 7. Chocolate Grid (Cokelat Petak) */}
        {shape === 'cokelat_grid' && fractions.length >= 1 && (
          <div className="w-full flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
            {fractions.map((f, idx) => {
              const den = f.denominator || 5;
              const num = f.numerator || 2;
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center p-2.5 bg-amber-50/80 rounded-2xl border border-amber-300 shadow-2xs"
                >
                  <span className="text-[10px] font-black text-amber-950 uppercase mb-1">
                    {f.name || `Cokelat ${idx + 1}`}
                  </span>
                  <div className="flex border-2 border-amber-900 rounded-lg overflow-hidden bg-amber-200/50 shadow-inner">
                    {Array.from({ length: den }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-6 h-10 border-r border-amber-800 last:border-r-0 flex items-center justify-center text-[9px] font-black transition-colors ${
                          i < num ? 'bg-amber-800 text-amber-100' : 'bg-amber-100/70 text-amber-700'
                        }`}
                      >
                        {i < num ? '🍫' : ''}
                      </div>
                    ))}
                  </div>
                  <span className="mt-1.5 text-xs font-black text-amber-950 bg-white px-2 py-0.5 rounded border border-amber-300">
                    {f.label || `${num}/${den}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* 8. Measuring Cups / Beakers (Gelas Ukur Cairan) */}
        {shape === 'gelas_ukur' && fractions.length >= 1 && (
          <div className="w-full flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
            {fractions.map((f, idx) => {
              const den = f.denominator || 10;
              const num = f.numerator || 3;
              const fillPercent = Math.min(100, Math.round((num / den) * 100));
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center p-2 bg-white/90 rounded-2xl border border-cyan-200 shadow-2xs"
                >
                  <span className="text-[10px] font-black text-cyan-950 uppercase mb-1">
                    {f.name || `Takaran ${idx + 1}`}
                  </span>
                  {/* Beaker shape */}
                  <div className="w-12 h-20 border-2 border-slate-600 rounded-b-xl relative bg-slate-50 overflow-hidden flex flex-col justify-end shadow-inner">
                    {/* Tick markings */}
                    <div className="absolute inset-y-0 left-0 w-3 flex flex-col justify-between py-1 z-10 opacity-60 pointer-events-none">
                      <div className="w-2.5 h-0.5 bg-slate-600"></div>
                      <div className="w-1.5 h-0.5 bg-slate-400"></div>
                      <div className="w-2.5 h-0.5 bg-slate-600"></div>
                      <div className="w-1.5 h-0.5 bg-slate-400"></div>
                      <div className="w-2.5 h-0.5 bg-slate-600"></div>
                    </div>
                    {/* Liquid fill */}
                    <div
                      style={{ height: `${fillPercent}%` }}
                      className="w-full bg-cyan-400 border-t-2 border-cyan-600 transition-all opacity-85"
                    ></div>
                  </div>
                  <span className="mt-1 text-xs font-black text-cyan-950 bg-cyan-100 px-2 py-0.5 rounded border border-cyan-300">
                    {f.label || `${num}/${den}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Dimension Pills */}
      {dimensions && Object.keys(dimensions).length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center mt-2">
          {Object.entries(dimensions).map(([key, val]) => (
            <span
              key={key}
              className="text-[11px] bg-white text-slate-800 px-2.5 py-0.5 rounded-lg border border-blue-200 font-bold shadow-2xs flex items-center gap-1"
            >
              <span className="text-blue-900 font-extrabold">{key}:</span> {val}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
