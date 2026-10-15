export type HeroMotionBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type HeroMomentum = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export type HeroMotionSample = { x: number; y: number; time: number };

const DAMPING = 0.65;
const REBOUND = 0.72;
const REST_SPEED = 9;

function advanceAxis(
  position: number,
  velocity: number,
  minimum: number,
  maximum: number,
  seconds: number,
) {
  if (maximum <= minimum) return { position: minimum, velocity: 0 };
  position = Math.max(minimum, Math.min(maximum, position));
  let remaining = seconds;
  // Solve exponential drag and the time of each wall impact analytically, so
  // the same release travels the same path at 30, 60, and 120 Hz.
  for (let impact = 0; impact < 8 && remaining > 0; impact += 1) {
    const decay = Math.exp(-DAMPING * remaining);
    const next = position + (velocity * (1 - decay)) / DAMPING;
    if (next >= minimum && next <= maximum) {
      position = next;
      velocity *= decay;
      break;
    }
    const edge = velocity > 0 ? maximum : minimum;
    const distanceTime = (edge - position) / velocity;
    const impactTime = Math.max(
      0,
      Math.min(remaining, -Math.log(1 - DAMPING * distanceTime) / DAMPING),
    );
    position = edge;
    velocity *= -Math.exp(-DAMPING * impactTime) * REBOUND;
    remaining -= impactTime;
  }
  return { position, velocity };
}

export function advanceHeroMomentum(
  motion: HeroMomentum,
  bounds: HeroMotionBounds,
  seconds: number,
): HeroMomentum {
  const horizontal = advanceAxis(
    motion.x, motion.vx, bounds.minX, bounds.maxX, seconds,
  );
  const vertical = advanceAxis(
    motion.y, motion.vy, bounds.minY, bounds.maxY, seconds,
  );
  const resting = Math.hypot(horizontal.velocity, vertical.velocity) < REST_SPEED;
  return {
    x: horizontal.position,
    y: vertical.position,
    vx: resting ? 0 : horizontal.velocity,
    vy: resting ? 0 : vertical.velocity,
  };
}

export function heroReleaseVelocity(
  samples: HeroMotionSample[],
  now: number,
) {
  const latest = samples[samples.length - 1];
  if (!latest || now - latest.time > 80) return { vx: 0, vy: 0 };
  const recent = samples.filter((sample) => now - sample.time <= 110);
  const first = recent[0];
  if (!first || now - first.time < 16) return { vx: 0, vy: 0 };
  const elapsed = (now - first.time) / 1000;
  const vx = (latest.x - first.x) / elapsed;
  const vy = (latest.y - first.y) / elapsed;
  const speed = Math.hypot(vx, vy);
  if (speed < 25) return { vx: 0, vy: 0 };
  const cap = Math.min(1, 1400 / speed);
  return { vx: vx * cap, vy: vy * cap };
}
