import React from 'react';
import { motion } from 'framer-motion';

const SplitText = ({ children, className = "" }) => {
    if (typeof children !== 'string') return <p className={className}>{children}</p>;

    const words = children.split(' ');

    return (
        <motion.p className={className}>
            {words.map((word, i) => (
                <span key={i} className="inline-block overflow-hidden mr-[0.25em] align-top">
                    <motion.span
                        className="inline-block will-change-transform"
                        initial={{ y: '120%', opacity: 0, filter: 'blur(4px)' }}
                        whileInView={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
                        transition={{
                            duration: 0.7,
                            delay: i * 0.03, // Stagger ultra-rapide et fluide
                            ease: [0.23, 1, 0.32, 1], // Snappy
                        }}
                        viewport={{ once: true, margin: '-50px' }}
                    >
                        {word}
                    </motion.span>
                </span>
            ))}
        </motion.p>
    );
};

export default SplitText;
