// This is a test file to verify the hero redesign
import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ROTATING_WORDS = ["علاقة بتسحبك", "ضغط من غير سبب", "حدود مكسورة", "ذنب مالوش لزوم"];

export const TestTypingWord: FC = () => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % ROTATING_WORDS.length);
        setVisible(true);
      }, 500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="relative inline-block" style={{ minWidth: "6ch" }}>
      <AnimatePresence mode="wait">
        {visible && (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 20, filter: "blur(12px)", scale: 0.9 }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
            exit={{ opacity: 0, y: -20, filter: "blur(12px)", scale: 1.1 }}
            transition={{ duration: 0.7 }}
            className="text-cyan-400 font-black text-4xl"
            style={{ textShadow: "0 0 40px rgba(34,211,238,0.4)" }}
          >
            {ROTATING_WORDS[index]}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};
