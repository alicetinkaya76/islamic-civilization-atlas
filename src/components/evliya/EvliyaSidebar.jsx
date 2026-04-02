/**
 * EvliyaSidebar.jsx — Filtre paneli
 * Voyage + Kategori + Çapraz Referans Katmanı filtresi + Dashboard
 * v8.0.0.0 — improved: shared constants, better UX
 */
import React, { useState, useCallback } from 'react';
import {
  CAT_ICONS, CAT_LABELS, XREF_LABELS, XREF_ICONS,
  getLabels, voyageNameKey,
} from './constants';

export default function EvliyaSidebar({
  voyages, categories, xrefLayers = [],
  selectedVoyages, selectedCategories, selectedXrefLayers = new Set(),
  onVoyageToggle, onCategoryToggle, onXrefLayerToggle = () => {},
  onSelectAll, searchQuery, onSearchChange,
  totalPlaces, filteredCount, lang, onClose,
  onShowDashboard = null,
}) {
  const [showCategories, setShowCategories] = useState(false);
  const [showXref, setShowXref] = useState(false);

  const l = getLabels(lang);
  const cl = CAT_LABELS[lang] || CAT_LABELS.tr;
  const nameKey = voyageNameKey(lang);
  const isRtl = lang === 'ar';

  const hasActiveFilters = selectedCategories.size > 0 ||
    selectedXrefLayers.size > 0 ||
    searchQuery.length > 0 ||
    selectedVoyages.size !== voyages.length;

  const toggleCategories = useCallback(() => setShowCategories(p => !p), []);
  const toggleXref = useCallback(() => setShowXref(p => !p), []);

  return (
    <div className="evliya-sidebar" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="evliya-sidebar-header">
        <div className="evliya-sidebar-title-row">
          <h3>Evliyâ Çelebi</h3>
          <span className="evliya-sidebar-subtitle">Seyahatnâme</span>
        </div>
        <button
          className="evliya-sidebar-close"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>

      {/* Stats */}
      <div className="evliya-sidebar-stats">
        <span className="evliya-stat-count">{filteredCount.toLocaleString()}</span>
        <span className="evliya-stat-label">{l.of}{totalPlaces.toLocaleString()}</span>
      </div>

      {/* Action buttons */}
      <div className="evliya-sidebar-actions">
        {onShowDashboard && (
          <button className="evliya-btn-action" onClick={onShowDashboard}>
            📊 {l.dashboard}
          </button>
        )}
        {hasActiveFilters && (
          <button className="evliya-btn-action evliya-btn-clear" onClick={onSelectAll}>
            ✕ {l.clearFilters}
          </button>
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        className="evliya-search"
        placeholder={l.search}
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        aria-label={l.search}
      />

      {/* Voyages */}
      <div className="evliya-filter-section">
        <div className="evliya-filter-header">
          <span>{l.voyages}</span>
          <button className="evliya-btn-small" onClick={onSelectAll}>{l.all}</button>
        </div>
        {voyages.map(v => (
          <label key={v.id} className="evliya-voyage-item">
            <input
              type="checkbox"
              checked={selectedVoyages.has(v.id)}
              onChange={() => onVoyageToggle(v.id)}
            />
            <span className="evliya-voyage-dot" style={{ background: v.color }} />
            <span className="evliya-voyage-label">
              {v.id} — {v[nameKey] || v.title_tr}
            </span>
            <span className="evliya-voyage-years">{v.start_year}–{v.end_year}</span>
          </label>
        ))}
      </div>

      {/* Categories */}
      <div className="evliya-filter-section">
        <div
          className="evliya-filter-header evliya-filter-collapsible"
          onClick={toggleCategories}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCategories(); } }}
          aria-expanded={showCategories}
        >
          <span>{l.categories} ({categories.length}) {showCategories ? '▾' : '▸'}</span>
        </div>
        {showCategories && categories.map(c => {
          const isActive = selectedCategories.has(c.name);
          return (
            <label key={c.name} className="evliya-category-item">
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => onCategoryToggle(c.name)}
              />
              <span className="evliya-category-icon">{CAT_ICONS[c.name] || '📍'}</span>
              <span className="evliya-category-label">{cl[c.name] || c.name}</span>
              <span className="evliya-category-count">{c.count}</span>
            </label>
          );
        })}
      </div>

      {/* Cross-reference layers */}
      {xrefLayers.length > 0 && (
        <div className="evliya-filter-section">
          <div
            className="evliya-filter-header evliya-filter-collapsible"
            onClick={toggleXref}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleXref(); } }}
            aria-expanded={showXref}
          >
            <span>{l.xrefLayers} ({xrefLayers.length}) {showXref ? '▾' : '▸'}</span>
          </div>
          {showXref && xrefLayers.map(x => (
            <label key={x.name} className="evliya-xref-filter-item">
              <input
                type="checkbox"
                checked={selectedXrefLayers.has(x.name)}
                onChange={() => onXrefLayerToggle(x.name)}
              />
              <span className="evliya-xref-filter-icon">{XREF_ICONS[x.name] || '🔗'}</span>
              <span className="evliya-xref-filter-label">{XREF_LABELS[x.name] || x.name}</span>
              <span className="evliya-xref-filter-count">{x.count}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
