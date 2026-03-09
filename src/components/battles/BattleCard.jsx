import { useState } from 'react';
import { lf, n } from '../../hooks/useEntityLookup';

const TYPE_ICONS = {
  'Land': '⚔', 'Naval': '⚓', 'Siege': '🏰',
  'Civil War': '⚡', 'Land & Naval': '⚔',
};

function outcomeClass(outEn) {
  if (!outEn) return 'draw';
  const low = outEn.toLowerCase();
  if (low.includes('inconclusive') || low.includes('arbitration')) return 'draw';
  // "Muslim Victory", "Ottoman Victory", etc → check if it's a defeat from Muslim perspective
  // We'll consider: if the outcome includes "Victory" from the Muslim/main side, it's win
  // This is simplistic; we mark known defeat patterns
  return 'win'; // default, overridden by specific logic below
}

function getOutcomeType(b) {
  const out = (b.out_en || '').toLowerCase();
  if (out.includes('inconclusive') || out.includes('arbitration')) return 'draw';
  // Known defeat patterns for Muslim side
  if (out.includes('frankish victory') || out.includes('crusader victory') ||
      out.includes('holy league victory') || out.includes('mongol victory') ||
      out.includes('spanish victory') || out.includes('british victory') ||
      out.includes('qara khitai victory') || out.includes('timurid victory') ||
      out.includes('partial defeat') || out.includes('umayyad victory') ||
      out.includes('tactical withdrawal')) return 'loss';
  return 'win';
}

export default function BattleCard({ battle, lang, t }) {
  const [showImpact, setShowImpact] = useState(false);
  const [showNarr, setShowNarr] = useState(false);
  const ts = t.battles || {};

  if (!battle) {
    return <div className="battle-card-empty">{ts.noSelection || 'Click a battle to see details'}</div>;
  }

  const typeEn = battle.type_en || 'Land';
  const icon = TYPE_ICONS[typeEn] || '⚔';
  const ot = getOutcomeType(battle);
  const sig = lang === 'tr' ? (t.imp?.[battle.sig] || battle.sig) : (battle.sig === 'Kritik' ? 'Critical' : battle.sig === 'Yüksek' ? 'High' : battle.sig || 'Normal');
  const typeLabel = lang === 'tr' ? (battle.type_tr || typeEn) : typeEn;
  const outLabel = lang === 'tr' ? (battle.out_tr || battle.out_en || '') : (battle.out_en || '');

  const tactic = lang === 'tr'
    ? (battle.tactic_tr || battle.tactic_en || '')
    : (battle.tactic_en || battle.tactic_tr || '');

  const impact = lf(battle, 'impact', lang);
  const narr = lf(battle, 'narr', lang);

  const isCivil = (battle.type_en || '').includes('Civil');
  const cmdM = lf(battle, 'cmd_m', lang);
  const cmdO = lf(battle, 'cmd_o', lang);
  const symM = isCivil ? '⚔' : '☪';
  const symO = isCivil ? '⚔' : '✦';

  return (
    <div className="battle-card">
      <div className="bc-header">
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span className="bc-title">{n(battle, lang)}</span>
      </div>
      <div className="bc-sub">
        {battle.yr} · {typeLabel} · {sig}
      </div>
      <hr className="bc-divider" />

      {/* Commanders */}
      <div className="bc-section-label">{ts.commanders || 'Commanders'}</div>
      <div className="bc-cmd-row">
        <span className="bc-cmd-symbol">{symM}</span>
        {cmdM}
      </div>
      <div className="bc-cmd-row">
        <span className="bc-cmd-symbol">{symO}</span>
        {cmdO}
      </div>
      <div className="bc-cmd-row" style={{ fontSize: 11, color: 'var(--cream2)' }}>
        vs {lf(battle, 'opp', lang)}
      </div>
      <hr className="bc-divider" />

      {/* Outcome */}
      <div className="bc-section-label">{ts.outcome || 'Outcome'}</div>
      <div style={{ marginBottom: 4 }}>
        <span className={`bc-outcome-badge ${ot}`}>
          {ot === 'win' ? '✓' : ot === 'loss' ? '✗' : '~'}
        </span>
        {outLabel}
      </div>
      <hr className="bc-divider" />

      {/* Forces & Casualties */}
      {(lf(battle, 'forces_m', lang) || battle.forces_m) && (
        <>
          <div className="bc-section-label">{lang === 'tr' ? 'Kuvvetler' : 'Forces'}</div>
          <div className="bc-forces-row">
            <span className="bc-cmd-symbol">{symM}</span>
            <span>{cmdM && <small style={{ color: 'var(--gold)', marginRight: 4 }}>{cmdM}:</small>}{lf(battle, 'forces_m', lang) || battle.forces_m}</span>
          </div>
          <div className="bc-forces-row">
            <span className="bc-cmd-symbol">{symO}</span>
            <span>{cmdO && <small style={{ color: 'var(--cream2)', marginRight: 4 }}>{cmdO}:</small>}{lf(battle, 'forces_o', lang) || battle.forces_o}</span>
          </div>
          {(lf(battle, 'casualties', lang) || battle.casualties) && (
            <div className="bc-casualties" style={{ fontSize: 11, marginTop: 4, color: '#f87171' }}>
              ☠ {lf(battle, 'casualties', lang) || battle.casualties}
            </div>
          )}
          {lf(battle, 'terrain', lang) && (
            <div style={{ fontSize: 11, marginTop: 3, color: 'var(--cream2)' }}>
              ⛰ {lf(battle, 'terrain', lang)}
            </div>
          )}
          <hr className="bc-divider" />
        </>
      )}

      {/* Tactic */}
      {tactic && (
        <>
          <div className="bc-section-label">{ts.tactic || 'Tactical Analysis'}</div>
          <div className="bc-tactic">{tactic}</div>
          <hr className="bc-divider" />
        </>
      )}

      {/* Impact toggle */}
      {impact && (
        <>
          <button className="bc-toggle-btn" onClick={() => setShowImpact(p => !p)}>
            {showImpact ? '▼' : '▶'} {ts.impact || 'Historical Impact'}
          </button>
          {showImpact && <div className="bc-toggle-content">{impact}</div>}
        </>
      )}

      {/* Narrative toggle */}
      {narr && (
        <>
          <button className="bc-toggle-btn" onClick={() => setShowNarr(p => !p)}>
            {showNarr ? '▼' : '▶'} {ts.narrative || 'Narrative'}
          </button>
          {showNarr && <div className="bc-toggle-content">{narr}</div>}
        </>
      )}
    </div>
  );
}
