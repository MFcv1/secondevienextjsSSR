'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

export default function AboutFaqIsland({ items }) {
  const [openId, setOpenId] = useState(null);

  return (
    <div className="w-full border-t border-[#1A1A1A]/10">
      {items.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div key={faq.id} className="group border-b border-[#1A1A1A]/10">
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : faq.id)}
              className="flex w-full items-center justify-between py-6 text-left outline-none md:py-10 lg:py-12"
              aria-expanded={isOpen}
            >
              <span className="flex items-center gap-6 pr-4 md:gap-10">
                <span className="mt-1 font-serif text-lg italic text-[#1A1A1A]/30 md:text-xl">{faq.id}</span>
                <span className={`font-serif text-xl tracking-tight transition-colors duration-300 md:text-3xl ${isOpen ? 'text-[#A68A64]' : 'text-[#1A1A1A] group-hover:text-[#A68A64]'}`}>
                  {faq.question}
                </span>
              </span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#1A1A1A]/10 bg-[#F9F6F0] transition-colors duration-300 group-hover:border-[#1A1A1A] group-hover:bg-[#1A1A1A] group-hover:text-white md:h-12 md:w-12">
                <Plus size={20} strokeWidth={1.5} className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
              </span>
            </button>
            <div className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="pb-8 pl-[52px] pr-12 md:pb-10 md:pl-[72px]">
                <p className="text-sm font-light leading-relaxed text-[#5A5550] md:text-base">{faq.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
