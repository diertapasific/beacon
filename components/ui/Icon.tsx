"use client";

import {
  Flame,
  Fire,
  Trophy,
  Star,
  Target,
  Crown,
  Lightning,
  Sparkle,
  Rocket,
  Crosshair,
  Diamond,
  Medal,
  Lightbulb,
  Code,
  Brain,
  Repeat,
  Question,
  Bug,
  ListChecks,
  ArrowsClockwise,
  type IconProps,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";

// Central registry so achievement/lesson icon names (strings from the DB)
// resolve to a real component. No emoji anywhere — Phosphor only.
const REGISTRY: Record<string, ComponentType<IconProps>> = {
  Flame,
  Fire,
  Trophy,
  Star,
  Target,
  Crown,
  Lightning,
  Sparkle,
  Rocket,
  Crosshair,
  Diamond,
  Medal,
  Lightbulb,
  Code,
  Brain,
  Repeat,
  Question,
  Bug,
  ListChecks,
  ArrowsClockwise,
};

export function Icon({ name, ...props }: { name: string } & IconProps) {
  const Cmp = REGISTRY[name] ?? Medal;
  return <Cmp {...props} />;
}
