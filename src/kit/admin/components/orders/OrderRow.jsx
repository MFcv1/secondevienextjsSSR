'use client';

import { memo } from 'react';
import { ChevronRight } from 'lucide-react';
import {
    JOURNEY_STEPS,
    formatClock,
    formatPrice,
    formatShortDate,
    getOrderJourney,
    orderReference,
    summarizeItems,
} from './orderPresentation';
import { dotClass, pillClass } from './orderTones';

/** Avancee en quatre temps : quatre segments, aucun texte superflu. */
function JourneyTrack({ stage, tone, darkMode }) {
    return (
        <span className="flex items-center gap-1" aria-hidden="true">
            {JOURNEY_STEPS.map((step, index) => (
                <span
                    key={step}
                    className={`h-[3px] w-3.5 rounded-full transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                        index < stage ? dotClass(tone) : (darkMode ? 'bg-white/12' : 'bg-stone-950/[0.09]')
                    }`}
                />
            ))}
        </span>
    );
}

function OrderRow({ darkMode = false, onKeyDown, onSelect, order, selected = false }) {
    const journey = getOrderJourney(order);
    const items = summarizeItems(order);
    const isException = journey.kind === 'exception';

    return (
        <li>
            <button
                type="button"
                onClick={() => onSelect(order)}
                onKeyDown={onKeyDown}
                aria-current={selected ? 'true' : undefined}
                data-order-row={order.id}
                className={`group grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 rounded-[14px] px-2.5 py-2.5 text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] lg:grid-cols-[minmax(180px,2fr)_1.25fr_1.5fr_.75fr_.9fr] lg:gap-2 lg:items-center ${
                    selected
                        ? (darkMode ? 'bg-emerald-500/10 ring-1 ring-emerald-500/25' : 'bg-emerald-50 ring-1 ring-emerald-500/20')
                        : (darkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-[#FAF9F6]')
                }`}
            >
                <span className="col-start-1 row-start-1 flex min-w-0 items-center gap-2.5 lg:col-auto lg:row-auto">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass(journey.tone)}`} />
                    <span className="min-w-0">
                        <span className="block truncate text-[12px] font-extrabold tracking-[-0.015em]">
                            {order.shipping?.fullName || 'Client inconnu'}
                        </span>
                        <span className={`mt-0.5 block truncate font-mono text-[10px] ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>
                            {orderReference(order)}
                        </span>
                    </span>
                </span>

                <span className={`col-start-1 row-start-2 min-w-0 truncate text-[10.5px] font-semibold lg:col-auto lg:row-auto ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                    {items.label}
                    {items.extra > 0 ? (
                        <span className={darkMode ? 'text-stone-600' : 'text-stone-400'}> + {items.extra} autre{items.extra > 1 ? 's' : ''}</span>
                    ) : null}
                </span>

                <span className="col-start-1 row-start-3 flex min-w-0 items-center gap-2 lg:col-auto lg:row-auto">
                    {isException ? (
                        <>
                            <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] ${pillClass(journey.tone, darkMode)}`}>
                                {journey.label}
                            </span>
                            {journey.detail ? (
                                <span className={`hidden truncate text-[10px] font-semibold 2xl:inline ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>
                                    {journey.detail}
                                </span>
                            ) : null}
                        </>
                    ) : (
                        <>
                            <JourneyTrack stage={journey.stage} tone={journey.tone} darkMode={darkMode} />
                            <span className={`truncate text-[10.5px] font-bold ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                                {journey.label}
                            </span>
                            {journey.detail ? (
                                <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${pillClass('info', darkMode)}`} title={journey.detail}>
                                    Remb. partiel
                                </span>
                            ) : null}
                        </>
                    )}
                </span>

                <span className={`col-start-2 row-start-2 justify-self-end text-[10.5px] font-semibold tabular-nums lg:col-auto lg:row-auto lg:justify-self-auto ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                    {formatShortDate(order.createdAt)}
                    <span className="hidden xl:inline"> · {formatClock(order.createdAt)}</span>
                </span>

                <span className="col-start-2 row-start-1 flex items-center justify-end gap-2 lg:col-auto lg:row-auto">
                    <span className="text-[12px] font-extrabold tabular-nums">{formatPrice(order.total)}</span>
                    <ChevronRight
                        size={14}
                        strokeWidth={1.8}
                        className={`shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 ${darkMode ? 'text-stone-600' : 'text-stone-300'}`}
                    />
                </span>
            </button>
        </li>
    );
}

export default memo(OrderRow);
