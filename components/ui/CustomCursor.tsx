"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);

  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);

  // Dot follows cursor almost instantly
  const dotX = useSpring(mouseX, { stiffness: 900, damping: 45 });
  const dotY = useSpring(mouseY, { stiffness: 900, damping: 45 });

  // Ring tracks closely — just a hair of spring so it feels alive, not laggy
  const ringX = useSpring(mouseX, { stiffness: 550, damping: 38 });
  const ringY = useSpring(mouseY, { stiffness: 550, damping: 38 });

  useEffect(() => {
    // Only show on devices with a real mouse
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setVisible(true);
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    const onOver = (e: MouseEvent) => {
      const el = (e.target as Element).closest(
        "a, button, input, select, textarea, label, [role='button'], [tabindex]"
      );
      setHovering(!!el);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseover", onOver);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseover", onOver);
    };
  }, [mouseX, mouseY]);

  if (!visible) return null;

  const ringSize = hovering ? 48 : 36;
  const dotSize = hovering ? 6 : 8;

  return (
    <>
      {/* Outer ring — spring lag, difference blend so it's always visible */}
      <motion.div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          x: ringX,
          y: ringY,
          width: ringSize,
          height: ringSize,
          marginLeft: -(ringSize / 2),
          marginTop: -(ringSize / 2),
          pointerEvents: "none",
          zIndex: 9998,
          borderRadius: "50%",
          border: "2px solid #1a1a1a",
        }}
        animate={{ width: ringSize, height: ringSize, marginLeft: -(ringSize / 2), marginTop: -(ringSize / 2) }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      />

      {/* Inner dot — tight follow, difference blend */}
      <motion.div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          x: dotX,
          y: dotY,
          width: dotSize,
          height: dotSize,
          marginLeft: -(dotSize / 2),
          marginTop: -(dotSize / 2),
          pointerEvents: "none",
          zIndex: 9999,
          borderRadius: "50%",
          backgroundColor: "#1a1a1a",
        }}
        animate={{ width: dotSize, height: dotSize, marginLeft: -(dotSize / 2), marginTop: -(dotSize / 2) }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      />
    </>
  );
}
