'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, LocateFixed, Route } from 'lucide-react';
import { buildJourney, formatNumber } from './model';
import styles from './DataStudio.module.css';

const POSITIONS = {
    home: [86, 250], about: [86, 92], search: [86, 408], gallery: [286, 128], category: [286, 372],
    product: [500, 250], quote: [710, 126], checkout: [710, 374], wishlist: [710, 250], account_orders: [850, 250], unknown: [850, 400],
};

const positionFor = (id, index) => POSITIONS[id] || [820, 70 + index * 72];

function curve(from, to) {
    const x1 = from[0] + 58;
    const y1 = from[1];
    const x2 = to[0] - 58;
    const y2 = to[1];
    const bend = Math.max(54, Math.abs(x2 - x1) * .42);
    return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
}

function RouteAtlas({ model, selected, onSelect }) {
    const positions = Object.fromEntries(model.nodes.map((node, index) => [node.id, positionFor(node.id, index)]));
    return <section className={`${styles.surface} ${styles.routeAtlas} ds-reveal`}>
        <header className={styles.surfaceHeader}>
            <div><span className={styles.kicker}>Atlas des passages</span><h2>La visite comme un réseau vivant</h2></div>
            <Route size={17} strokeWidth={1.4} />
        </header>
        <div className={styles.atlasStage}>
            <svg viewBox="0 0 920 500" role="img" aria-label="Réseau agrégé des transitions entre les pages">
                <defs><filter id="atlasGlow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
                <g className={styles.atlasEdges}>{model.transitions.map((transition) => {
                    const from = positions[transition.from]; const to = positions[transition.to];
                    if (!from || !to || transition.from === transition.to) return null;
                    const related = !selected || selected === transition.from || selected === transition.to;
                    return <path key={transition.key} d={curve(from, to)} data-related={related} style={{ '--edge': Math.max(.14, transition.value / model.maximum), '--width': `${1 + (transition.value / model.maximum) * 5}px` }} />;
                })}</g>
                <g className={styles.atlasNodes}>{model.nodes.map((node) => {
                    const [x, y] = positions[node.id];
                    const isSelected = selected === node.id;
                    return <g key={node.id} transform={`translate(${x - 58} ${y - 27})`} data-selected={isSelected} data-dimmed={selected && !isSelected} role="button" tabIndex="0" aria-label={`${node.label}, poids ${node.weight}`} onClick={() => onSelect(node.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(node.id); }}>
                        <rect width="116" height="54" rx="16" />
                        <circle cx="18" cy="17" r="3.5" />
                        <text x="29" y="21">{node.short}</text>
                        <text x="18" y="40">{node.label}</text>
                    </g>;
                })}</g>
            </svg>
            <div className={styles.atlasPulse}><i /><span>Transitions agrégées</span><strong>{formatNumber(model.total)}</strong></div>
        </div>
        <footer>L’épaisseur représente le volume exact. Aucun chemin individuel n’est reconstruit ici.</footer>
    </section>;
}

function PassageInspector({ model, selected, onSelect }) {
    const relevant = model.transitions.filter((item) => !selected || item.from === selected || item.to === selected).slice(0, 8);
    return <aside className={`${styles.surface} ${styles.passageInspector} ds-reveal`}>
        <header><span className={styles.kicker}>Passages dominants</span><strong>{selected ? model.nodes.find((node) => node.id === selected)?.label : 'Toutes les routes'}</strong></header>
        <ol>{relevant.map((transition, index) => <li key={transition.key}>
            <button type="button" onClick={() => onSelect(transition.to)}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div><strong>{transition.fromMeta.label}</strong><ArrowRight size={12} strokeWidth={1.4} /><strong>{transition.toMeta.label}</strong></div>
                <b>{formatNumber(transition.value)}</b>
            </button>
        </li>)}</ol>
        {!relevant.length ? <div className={styles.emptySignal}><strong>Aucun passage sur cette route.</strong></div> : null}
    </aside>;
}

export default function DataJourneys({ data }) {
    const model = useMemo(() => buildJourney(data), [data]);
    const [selected, setSelected] = useState(() => model.nodes[0]?.id || null);
    if (!model.transitions.length) return <section className={`${styles.surface} ${styles.fullEmpty} ds-reveal`}><Route size={26} strokeWidth={1.3} /><span className={styles.kicker}>Atlas des passages</span><h2>Le réseau attend les premières transitions.</h2><p>Il apparaîtra après finalisation des sessions, sans profilage individuel.</p></section>;

    return <div className={styles.viewStack}>
        <section className={`${styles.journeyHero} ds-reveal`}>
            <div><span className={styles.kicker}>Architecture des visites</span><h1>Voir les passages.<br /><em>Jamais les personnes.</em></h1></div>
            <dl><div><dt>Transitions</dt><dd>{formatNumber(model.total)}</dd></div><div><dt>Routes actives</dt><dd>{formatNumber(model.nodes.length)}</dd></div><div><dt>État</dt><dd>{data.provisional ? 'Provisoire' : 'Finalisé'}</dd></div></dl>
        </section>
        <div className={styles.journeyWorkspace}><RouteAtlas model={model} selected={selected} onSelect={setSelected} /><PassageInspector model={model} selected={selected} onSelect={setSelected} /></div>
        <section className={`${styles.routeFootnote} ds-reveal`}><LocateFixed size={15} strokeWidth={1.4} /><p>Les routes sont des catégories stables — Accueil, Galerie, Pièce, Devis — jamais des URL brutes ni des paramètres.</p></section>
    </div>;
}
