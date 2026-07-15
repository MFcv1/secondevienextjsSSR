'use client';

import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowUpRight, Check, Gem, Server, Sparkles } from 'lucide-react';
import { buildOverview, formatDuration, formatNumber, formatPercent, formatTimelineKey } from './model';
import styles from './DataStudio.module.css';

function ActivityTooltip({ active, payload, label, period }) {
    if (!active || !payload?.length) return null;
    const values = Object.fromEntries(payload.map((item) => [item.dataKey, item.value]));
    return <div className={styles.chartTooltip}>
        <span>{formatTimelineKey(label, period)}</span>
        <div><i data-tone="accent" />Sessions<strong>{formatNumber(values.sessions)}</strong></div>
        <div><i />Pages devis<strong>{formatNumber(values.quoteViews)}</strong></div>
    </div>;
}

function ActivityCanvas({ model }) {
    const empty = !model.timeline.length || model.timeline.every((point) => !point.sessions && !point.quoteViews);
    return <section className={`${styles.surface} ${styles.activityCanvas} ds-reveal`}>
        <header className={styles.surfaceHeader}>
            <div><span className={styles.kicker}>Activité observée</span><h2>Le rythme de la galerie</h2></div>
            <div className={styles.seriesLegend}><span><i />Sessions</span><span><i />Page devis</span></div>
        </header>
        <div className={styles.chartStage}>
            {empty ? <div className={styles.emptySignal}><strong>Le tracé attend ses premiers compacts.</strong><span>Aucune projection n’est calculée.</span></div> :
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={model.timeline} margin={{ top: 20, right: 8, left: -28, bottom: 0 }}>
                        <defs>
                            <linearGradient id="sessionsCopper" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--ds-accent)" stopOpacity=".32" /><stop offset="100%" stopColor="var(--ds-accent)" stopOpacity="0" /></linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="var(--ds-grid)" strokeDasharray="2 7" />
                        <XAxis dataKey="key" tickFormatter={(key) => formatTimelineKey(key, model.period)} axisLine={false} tickLine={false} minTickGap={24} />
                        <YAxis axisLine={false} tickLine={false} allowDecimals={false} width={42} />
                        <Tooltip cursor={{ stroke: 'var(--ds-accent)', strokeDasharray: '3 5' }} content={<ActivityTooltip period={model.period} />} />
                        <Area type="monotone" dataKey="sessions" stroke="var(--ds-accent)" strokeWidth={2.6} fill="url(#sessionsCopper)" dot={false} activeDot={{ r: 4, strokeWidth: 4, stroke: 'rgba(236,133,70,.2)' }} animationDuration={850} />
                        <Line type="monotone" dataKey="quoteViews" stroke="var(--ds-ink)" strokeOpacity=".65" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} animationDuration={850} />
                    </AreaChart>
                </ResponsiveContainer>}
        </div>
        <footer className={styles.activityFooter}>
            <span><b>{model.pulse.pagesPerSession == null ? '—' : model.pulse.pagesPerSession.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}</b> pages / session</span>
            <span><b>{model.pulse.activePerSessionMs == null ? '—' : formatDuration(model.pulse.activePerSessionMs)}</b> actif / session</span>
            <span><b>{model.pulse.eventsPerSession == null ? '—' : model.pulse.eventsPerSession.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}</b> événements / session</span>
        </footer>
    </section>;
}

function CoverageOrbit({ model }) {
    const degrees = Math.max(0, Math.min(360, model.coverage * 360));
    return <aside className={`${styles.surface} ${styles.coverageOrbit} ds-reveal`}>
        <header><span className={styles.kicker}>Portée de lecture</span><Server size={16} strokeWidth={1.4} /></header>
        <div className={styles.orbit} style={{ '--coverage': `${degrees}deg` }}>
            <div><strong>{formatPercent(model.coverage)}</strong><span>détail consenti</span></div>
        </div>
        <dl>
            <div><dt>Audience</dt><dd>agrégée</dd></div>
            <div><dt>Sessions</dt><dd>sur consentement</dd></div>
            <div><dt>Paiements</dt><dd>serveur seul</dd></div>
        </dl>
    </aside>;
}

function IntentConstellation({ model }) {
    const maximum = Math.max(1, ...model.intentions.map((item) => item.value));
    return <section className={`${styles.surface} ${styles.intentConstellation} ds-reveal`}>
        <header className={styles.surfaceHeader}>
            <div><span className={styles.kicker}>Demande de devis</span><h2>Les signaux d’intention</h2></div>
            <Sparkles size={17} strokeWidth={1.4} />
        </header>
        <div className={styles.constellation}>
            <svg viewBox="0 0 640 250" role="img" aria-label="Signaux indépendants de demande de devis">
                <path d="M128 128 C230 48 354 42 514 118" />
                <path d="M128 128 C260 210 398 220 514 118" />
            </svg>
            {model.intentions.map((item, index) => <article key={item.id} style={{ '--signal-size': `${76 + (item.value / maximum) * 54}px` }} data-index={index}>
                <span>{item.label}</span><strong>{formatNumber(item.value)}</strong><small>{index === 0 ? 'consultations' : index === 1 ? 'démarrages' : 'contacts'}</small>
            </article>)}
        </div>
        <p>Ces volumes sont observés séparément. Ils ne constituent pas un funnel de personnes.</p>
    </section>;
}

function CommerceLedger({ model }) {
    return <section className={`${styles.surface} ${styles.commerceLedger} ds-reveal`}>
        <header className={styles.surfaceHeader}><div><span className={styles.kicker}>Commerce confirmé</span><h2>Le registre durable</h2></div><Check size={17} strokeWidth={1.5} /></header>
        <div>{model.commerce.map((item, index) => <article key={item.id}>
            <span>0{index + 1}</span><div><strong>{item.label}</strong><small>{index === 1 ? 'Stripe confirmé' : 'État serveur'}</small></div><b>{formatNumber(item.value)}</b>
        </article>)}</div>
        <footer><Server size={14} strokeWidth={1.4} /> Aucune conversion durable produite par le navigateur.</footer>
    </section>;
}

function ProductGallery({ products }) {
    const [active, setActive] = useState(0);
    const hasMetrics = products.some((item) => item.metricsAvailable);
    return <section className={`${styles.surface} ${styles.productGallery} ds-reveal`}>
        <header className={styles.surfaceHeader}>
            <div><span className={styles.kicker}>Pièces de la galerie</span><h2>{hasMetrics ? 'Celles qui retiennent le regard' : 'Le catalogue prêt à être mesuré'}</h2></div>
            <Gem size={17} strokeWidth={1.4} />
        </header>
        {products.length ? <div className={styles.productAccordion}>
            {products.slice(0, 5).map((product, index) => <button key={product.id} type="button" data-active={active === index} onPointerEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={() => setActive(index)} aria-label={`${product.name}${product.metricsAvailable ? `, ${product.views} vues` : ''}`}>
                <span className={styles.productImage} role="img" aria-label={product.name} style={product.image ? { backgroundImage: `linear-gradient(180deg, transparent 35%, rgba(7,7,7,.92)), url(${JSON.stringify(product.image).slice(1, -1)})` } : undefined} />
                <span className={styles.productCopy}><small>{product.category}</small><strong>{product.name}</strong>{product.metricsAvailable ? <em>{formatNumber(product.views)} vues · {formatNumber(product.favorites)} favoris · {formatNumber(product.quoteIntents)} devis</em> : <em>Métriques produit en attente du compact dédié</em>}</span>
                <ArrowUpRight size={17} strokeWidth={1.4} />
            </button>)}
        </div> : <div className={styles.emptySignal}><strong>Aucune pièce disponible dans le catalogue chargé.</strong></div>}
        <footer>{hasMetrics ? 'Classement borné fourni par le compact produits.' : 'Les images viennent du catalogue déjà chargé par l’administration. Aucun classement fictif.'}</footer>
    </section>;
}

function QualityRail({ model }) {
    return <section className={`${styles.qualityRail} ds-reveal`}>
        <div><span className={styles.kicker}>Qualité de mesure</span><strong>La donnée garde ses nuances.</strong></div>
        {model.quality.map((item) => <article key={item.id} data-state={item.value}><span>{item.label}</span><strong>{item.value}</strong><i /></article>)}
    </section>;
}

export default function DataOverview({ data, period, catalogItems }) {
    const model = useMemo(() => buildOverview(data, period, catalogItems), [data, period, catalogItems]);
    return <div className={styles.viewStack}>
        <section className={`${styles.metricRail} ds-reveal`} aria-label="Indicateurs clés">{model.kpis.map((metric, index) => <article key={metric.id} data-tone={metric.tone}>
            <span>0{index + 1} · {metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small><i />
        </article>)}</section>
        <div className={styles.primaryGrid}><ActivityCanvas model={model} /><CoverageOrbit model={model} /></div>
        <div className={styles.secondaryGrid}><IntentConstellation model={model} /><CommerceLedger model={model} /></div>
        <ProductGallery products={model.products} />
        <QualityRail model={model} />
    </div>;
}
