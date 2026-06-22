'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    kicker: "Étape 01",
    title: "Le décapage",
    desc: "Chaque pièce arrive avec des décennies de vernis, de peinture et de cire. Nous mettons le bois à nu par aérogommage basse pression, une méthode douce qui préserve la fibre et dévoile la vraie nature du meuble sans le brûler.",
    img: "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&q=80&w=800"
  },
  {
    kicker: "Étape 02",
    title: "L'ébénisterie",
    desc: "Un tiroir qui frotte, un pied bancal, un placage boursouflé. L'atelier reprend la structure. Chevilles bois, colle d'os, greffes de placage : nous utilisons les techniques d'origine pour rendre au meuble sa solidité sans effacer son âge.",
    img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=800"
  },
  {
    kicker: "Étape 03",
    title: "La finition",
    desc: "Selon l'essence de bois et la destination du meuble : huile dure naturelle mate, vernis polyuréthane invisible ou patine à la cire d'abeille. Une protection conçue pour vivre au quotidien sans trahir l'âme de la pièce.",
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
              viewport={{ margin: "-40% 0px -40% 0px", amount: "some" }}
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
        <div className="sv4-atelier__sticky-media">
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
                  scale: isActive ? 1 : 1.04,
                  zIndex: isActive ? 2 : 1
                }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
