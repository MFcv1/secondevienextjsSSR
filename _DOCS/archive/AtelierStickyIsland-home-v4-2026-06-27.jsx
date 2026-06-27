'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    kicker: "Étape 01",
    title: "Le décapage",
    desc: "Aérogommage basse pression : on remet le bois à nu en douceur, sans jamais brûler la fibre.",
    img: "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&q=80&w=800"
  },
  {
    kicker: "Étape 02",
    title: "L'ébénisterie",
    desc: "Chevilles bois, colle d'os, greffes de placage : la structure retrouve sa solidité, l'âge reste.",
    img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=800"
  },
  {
    kicker: "Étape 03",
    title: "La finition",
    desc: "Huile dure, cire d'abeille ou vernis invisible : une protection pensée pour le quotidien.",
    img: "https://images.unsplash.com/photo-1610453406560-f10f44485542?auto=format&fit=crop&q=80&w=800"
  }
];

export default function AtelierStickyIsland() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="sv4-atelier">
      <div className="sv4-atelier__copy">
        {steps.map((step, i) => (
          <div key={i} className="sv4-atelier__panel">
            <motion.div 
              onViewportEnter={() => setActiveIndex(i)}
              viewport={{ margin: "-30% 0px -15% 0px", amount: "some" }}
            >
              {/* Mobile inline image */}
              <img src={step.img} alt={step.title} className="sv4-atelier__mobile-img" />
              <p className="sv4-atelier__kicker">{step.kicker}</p>
              <h2>{step.title}</h2>
              <p>{step.desc}</p>
            </motion.div>
          </div>
        ))}
      </div>
      <div className="sv4-atelier__visual">
        <motion.div
          className="sv4-atelier__sticky-media"
          initial={{ clipPath: 'inset(46% 46% 46% 46% round var(--r-card))', opacity: 0.55 }}
          whileInView={{ clipPath: 'inset(0% 0% 0% 0% round var(--r-card))', opacity: 1 }}
          viewport={{ once: true, margin: '-12% 0px -18% 0px' }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="sv4-atelier__reveal-zoom"
            initial={{ scale: 1.35 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true, margin: '-12% 0px -18% 0px' }}
            transition={{ duration: 1.9, ease: [0.16, 1, 0.3, 1] }}
          >
            {steps.map((step, i) => {
              const isActive = i === activeIndex;
              return (
                <motion.img 
                  key={i} 
                  src={step.img} 
                  alt={step.title} 
                  className="sv4-atelier__img"
                  initial={false}
                  animate={{ 
                    opacity: isActive ? 1 : 0,
                    scale: isActive ? 1 : 1.12,
                    clipPath: isActive ? 'inset(0% round var(--r-card))' : 'inset(9% round var(--r-card))',
                    zIndex: isActive ? 2 : 1
                  }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                />
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
