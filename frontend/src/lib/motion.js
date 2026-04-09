export const MOTION_EASE = [0.22, 1, 0.36, 1];
export const MOTION_EASE_SOFT = [0.16, 1, 0.3, 1];

export function getRevealMotion(
  reducedMotion,
  { y = 16, scale = 0.985, duration = 0.42, delay = 0 } = {}
) {
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: {
        duration: 0.18,
        delay
      }
    };
  }

  return {
    initial: { opacity: 0, y, scale },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: {
      duration,
      delay,
      ease: MOTION_EASE
    }
  };
}

export function getHoverLift(reducedMotion, y = -4) {
  if (reducedMotion) {
    return undefined;
  }

  return {
    y,
    transition: {
      duration: 0.22,
      ease: MOTION_EASE_SOFT
    }
  };
}

export function getPressMotion(reducedMotion) {
  if (reducedMotion) {
    return undefined;
  }

  return {
    scale: 0.985
  };
}
