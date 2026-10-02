import React, { useMemo, useState } from 'react';
import {
  Activity,
  ChevronRight,
  CircleAlert,
  Gauge,
  Network,
  RefreshCw,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { allCauses, caseStudy, categories, riskBands } from './data.js';

const levelName = (level) => riskBands.find((band) => band.level === level)?.name ?? '';

function RiskPill({ level, compact = false }) {
  return (
    <span className={`risk-pill risk-${level} ${compact ? 'compact' : ''}`} aria-label={`Criticidad ${level} de 5`}>
      <strong>{level}</strong>
      {!compact && <span>{levelName(level)}</span>}
    </span>
  );
}

function Fishbone({ selectedId, setSelectedId, minLevel }) {
  const anchors = {
    observabilidad: { x: 350, ex: 175, columnX: 20, dotX: 320 },
    capacidad: { x: 690, ex: 515, columnX: 360, dotX: 660 },
    cambios: { x: 1030, ex: 855, columnX: 700, dotX: 1000 },
    personas: { x: 350, ex: 175, columnX: 20, dotX: 320 },
    procesos: { x: 690, ex: 515, columnX: 360, dotX: 660 },
    dependencias: { x: 1030, ex: 855, columnX: 700, dotX: 1000 },
  };

  const visible = (cause) => cause.level >= minLevel;
  const wrapLabel = (label, maxLength = 32) => {
    const words = label.split(' ');
    const lines = [];
    let current = '';

    words.forEach((word) => {
      const next = current ? `${current} ${word}` : word;
      if (next.length > maxLength && current) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    });

    if (current) lines.push(current);
    return lines;
  };

  return (
    <div className="fishbone-wrap">
      <svg className="fishbone" viewBox="0 0 1420 700" role="img" aria-label="Diagrama de Ishikawa con causas de degradación del servicio">
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" className="arrow-head" />
          </marker>
        </defs>

        <line x1="60" y1="350" x2="1138" y2="350" className="spine" markerEnd="url(#arrow)" />
        <rect x="1145" y="280" width="255" height="140" rx="10" className="effect-box" />
        <text x="1168" y="309" className="effect-kicker">EFECTO</text>
        <text x="1168" y="340" className="effect-title">
          <tspan x="1168" dy="0">Degradación</tspan>
          <tspan x="1168" dy="25">recurrente en horas pico</tspan>
        </text>
        <text x="1168" y="397" className="effect-note">latencia · timeouts · errores</text>

        {categories.map((category) => {
          const a = anchors[category.id];
          const isTop = category.side === 'top';
          const endY = isTop ? 68 : 632;
          const rowYs = isTop ? [275, 200, 125] : [425, 500, 575];

          return (
            <g key={category.id}>
              <line x1={a.x} y1="350" x2={a.ex} y2={endY} className="major-bone" />
              <text x={a.columnX + 150} y={isTop ? 34 : 673} textAnchor="middle" className="category-label">
                {category.name.toUpperCase()}
              </text>

              {category.causes.map((cause, index) => {
                const t = 0.25 + index * 0.27;
                const bx = a.x + (a.ex - a.x) * t;
                const by = 350 + (endY - 350) * t;
                const rowY = rowYs[index];
                const lines = wrapLabel(cause.label);
                const firstLineY = rowY - ((lines.length - 1) * 7.5);
                const active = cause.id === selectedId;
                const faded = !visible(cause);

                return (
                  <g
                    key={cause.id}
                    className={`cause-group ${active ? 'active' : ''} ${faded ? 'faded' : ''}`}
                    onClick={() => setSelectedId(cause.id)}
                    role="button"
                    tabIndex="0"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') setSelectedId(cause.id);
                    }}
                    aria-label={`${cause.label}. Criticidad ${cause.level} de 5`}
                  >
                    <line x1={bx} y1={by} x2={a.dotX} y2={rowY} className="minor-bone" />
                    <rect x={a.columnX} y={rowY - 29} width="282" height="58" rx="5" className="cause-label-bg" />
                    <circle cx={a.dotX} cy={rowY} r="14" className={`score-dot score-${cause.level}`} />
                    <text x={a.dotX} y={rowY + 4} textAnchor="middle" className="score-text">{cause.level}</text>
                    <text x={a.dotX - 20} y={firstLineY} textAnchor="end" className="cause-label">
                      {lines.map((line, lineIndex) => (
                        <tspan key={line} x={a.dotX - 20} dy={lineIndex === 0 ? 0 : 15}>{line}</tspan>
                      ))}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <div className="mobile-hint">Desliza horizontalmente para revisar todo el diagrama.</div>
    </div>
  );
}

function DetailPanel({ cause }) {
  if (!cause) return null;

  return (
    <aside className="detail-panel">
      <div className="detail-topline">
        <span>{cause.category}</span>
        <RiskPill level={cause.level} />
      </div>
      <h3>{cause.label}</h3>
      <div className="metric-row">
        <div><span>Probabilidad</span><strong>{cause.probability}/5</strong></div>
        <div><span>Impacto</span><strong>{cause.impact}/5</strong></div>
        <div><span>Riesgo bruto</span><strong>{cause.raw}/25</strong></div>
      </div>
      <div className="detail-block">
        <span>Por qué importa</span>
        <p>{cause.evidence}</p>
      </div>
      <div className="detail-block action">
        <span>Acción técnica recomendada</span>
        <p>{cause.action}</p>
      </div>
    </aside>
  );
}

function App() {
  const [selectedId, setSelectedId] = useState('cap-1');
  const [minLevel, setMinLevel] = useState(1);
  const [query, setQuery] = useState('');

  const selectedCause = allCauses.find((cause) => cause.id === selectedId) ?? allCauses[0];
  const filteredRows = useMemo(() => {
    const text = query.trim().toLowerCase();
    return allCauses
      .filter((cause) => cause.level >= minLevel)
      .filter((cause) => !text || `${cause.label} ${cause.category}`.toLowerCase().includes(text))
      .sort((a, b) => b.level - a.level || b.raw - a.raw);
  }, [minLevel, query]);

  return (
    <main>
      <header className="topbar">
        <div className="brand-mark">ST</div>
        <div>
          <span>Teoría de Sistemas · Gestión técnica</span>
          <strong>Operación de servicios TI</strong>
        </div>
        <div className="scenario-tag">CASO SIMULADO</div>
      </header>

      <section className="hero page-width">
        <div className="eyebrow"><Network size={16} /> Arquetipo sistémico de causa y efecto</div>
        <h1>Cuando “reiniciar” resuelve el incidente… pero fortalece el problema.</h1>
        <p>
          Caso práctico basado en el arquetipo <strong>Desplazamiento de la carga</strong>. El Ishikawa identifica las causas técnicas y operativas; la criticidad 1–5 permite priorizarlas como en una matriz de riesgo.
        </p>
      </section>

      <section className="case-card page-width">
        <div className="case-intro">
          <div className="section-kicker"><Activity size={15} /> CASO PRÁCTICO</div>
          <h2>{caseStudy.service}</h2>
          <p>{caseStudy.description}</p>
          <div className="effect-callout">
            <CircleAlert size={18} />
            <div><span>Efecto observado</span><strong>{caseStudy.effect}</strong></div>
          </div>
        </div>
        <div className="facts-grid">
          {caseStudy.facts.map((fact) => (
            <div className="fact" key={fact.label}>
              <strong>{fact.value}</strong>
              <span>{fact.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="diagram-section page-width">
        <div className="section-heading">
          <div>
            <div className="section-kicker"><Gauge size={15} /> DIAGRAMA DE ISHIKAWA</div>
            <h2>Causas que convergen en la degradación</h2>
          </div>
          <div className="filter-box">
            <span>Mostrar criticidad ≥</span>
            <div className="filter-buttons">
              {[1, 2, 3, 4, 5].map((level) => (
                <button key={level} className={minLevel === level ? 'active' : ''} onClick={() => setMinLevel(level)}>{level}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="diagram-layout">
          <Fishbone selectedId={selectedId} setSelectedId={setSelectedId} minLevel={minLevel} />
          <DetailPanel cause={selectedCause} />
        </div>
        <p className="diagram-note">Selecciona cualquier causa del diagrama para revisar su probabilidad, impacto, evidencia y tratamiento recomendado.</p>
      </section>

      <section className="archetype page-width">
        <div className="section-heading left-only">
          <div>
            <div className="section-kicker"><RefreshCw size={15} /> LECTURA SISTÉMICA</div>
            <h2>Arquetipo: desplazamiento de la carga</h2>
          </div>
        </div>

        <div className="loop-grid">
          <div className="loop-card symptomatic">
            <span className="loop-index">01</span>
            <h3>El síntoma crece</h3>
            <p>Sube la latencia, se agotan conexiones y aparecen timeouts durante la hora pico.</p>
          </div>
          <ChevronRight className="loop-arrow" />
          <div className="loop-card symptomatic">
            <span className="loop-index">02</span>
            <h3>Se aplica el “arreglo rápido”</h3>
            <p>Operaciones reinicia instancias, limpia conexiones o agrega capacidad manualmente.</p>
          </div>
          <ChevronRight className="loop-arrow" />
          <div className="loop-card symptomatic">
            <span className="loop-index">03</span>
            <h3>Hay alivio temporal</h3>
            <p>El servicio se recupera y el incidente se cierra. La presión visible disminuye.</p>
          </div>
          <ChevronRight className="loop-arrow" />
          <div className="loop-card structural">
            <span className="loop-index">04</span>
            <h3>La causa estructural queda intacta</h3>
            <p>No se corrigen pruebas de carga, observabilidad, pools, políticas de retry ni gestión de problemas.</p>
          </div>
          <ChevronRight className="loop-arrow" />
          <div className="loop-card structural">
            <span className="loop-index">05</span>
            <h3>La dependencia aumenta</h3>
            <p>El reinicio se convierte en procedimiento habitual y el próximo pico reproduce el mismo patrón.</p>
          </div>
        </div>

        <div className="systemic-thesis">
          <ShieldAlert size={22} />
          <div>
            <span>Interpretación</span>
            <p>El problema no es únicamente “falta de servidores”. El sistema premia la recuperación rápida del síntoma y posterga las acciones que reducen la recurrencia. Por eso la solución sostenible debe intervenir simultáneamente en capacidad, resiliencia, observabilidad y gestión de problemas.</p>
          </div>
        </div>
      </section>

      <section className="table-section page-width">
        <div className="section-heading">
          <div>
            <div className="section-kicker">REGISTRO DE CAUSAS</div>
            <h2>Detalle priorizado</h2>
          </div>
          <label className="search-box">
            <Search size={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar causa o categoría" />
          </label>
        </div>

        <div className="risk-table-wrap">
          <table className="risk-table">
            <thead>
              <tr><th>Causa</th><th>Categoría</th><th>P</th><th>I</th><th>P×I</th><th>Criticidad</th></tr>
            </thead>
            <tbody>
              {filteredRows.map((cause) => (
                <tr key={cause.id} className={selectedId === cause.id ? 'selected' : ''} onClick={() => setSelectedId(cause.id)}>
                  <td><strong>{cause.label}</strong></td>
                  <td>{cause.category}</td>
                  <td>{cause.probability}</td>
                  <td>{cause.impact}</td>
                  <td>{cause.raw}</td>
                  <td><RiskPill level={cause.level} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="conclusion page-width">
        <div>
          <span>CONCLUSIÓN DEL CASO</span>
          <h2>La prioridad no es reiniciar más rápido, sino hacer que el reinicio deje de ser necesario.</h2>
        </div>
        <div className="conclusion-actions">
          <p><strong>1.</strong> Corregir primero las causas críticas: pool de BD, pruebas de carga, RCA incompleto y resiliencia frente a identidad externa.</p>
          <p><strong>2.</strong> Sustituir la mitigación repetitiva por Problem Management con responsables y verificación de efectividad.</p>
          <p><strong>3.</strong> Medir SLO y recurrencia para comprobar que la intervención cambia el comportamiento del sistema, no solo el incidente actual.</p>
        </div>
      </section>

      <footer className="footer page-width">
        <span>Arquetipo sistémico · Caso académico de operación TI</span>
        <span>React · Sin dependencias visuales pesadas · Diseño minimalista</span>
      </footer>
    </main>
  );
}

export default App;
