import React from 'react';
import { motion } from 'framer-motion';

const TextReveal = ({ text, by = "word", stagger = 0.04, delay = 0, className = "" }) => {
  const words = text.split(' ');
  
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: stagger, delayChildren: delay * i },
    }),
  };

  const child = {
    hidden: {
      opacity: 0,
      y: 100,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  if (by === "char") {
    const chars = text.split("");
    return (
      <motion.span
        style={{ display: "inline-flex", overflow: "hidden" }}
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className={className}
      >
        {chars.map((char, index) => (
          <motion.span
            variants={child}
            key={index}
            style={{ display: "inline-block", whiteSpace: "pre" }}
          >
            {char}
          </motion.span>
        ))}
      </motion.span>
    );
  }

  return (
    <motion.h2
      style={{ overflow: "hidden", display: "flex", flexWrap: "wrap" }}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className={className}
    >
      {words.map((word, index) => (
        <span key={index} style={{ overflow: "hidden", display: "inline-block", marginRight: "0.25em" }}>
          <motion.span
            variants={child}
            style={{ display: "inline-block" }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </motion.h2>
  );
};

export default TextReveal;
