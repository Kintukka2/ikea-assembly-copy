"use client";

import { MotionConfig } from "motion/react";

/** Springs, slides and confetti calm down for anyone who asked their system for less motion. */
export default function MotionPrefs({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
