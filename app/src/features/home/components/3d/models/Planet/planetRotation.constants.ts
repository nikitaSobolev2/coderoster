/**
 * Planet idle rotation in store/presets is legacy "radians per ~60 FPS tick".
 * Multiply by this factor to interpret as radians per second for dt-based integration.
 */
export const PLANET_LEGACY_ROTATION_TICK_HZ = 60

/** Horizontal drag: radians per viewport pixel (~one Earth spin per ~800px swipe at release). */
export const PLANET_DRAG_RADIANS_PER_PIXEL = 0.0018

/** EMA weight for instantaneous angular velocity samples while dragging (higher → snappier). */
export const PLANET_DRAG_OMEGA_SMOOTH = 0.38

/** Rad/s; viscous damping: omega *= exp(-DAMPING * dt) while coasting after release. */
export const PLANET_ANGULAR_DAMPING = 2.05

/** User angular velocity capped for stability. */
export const PLANET_MAX_USER_ANGULAR_VELOCITY_RAD_PER_S = 28

/** |omega| baseline for danger ramp (lower ⇒ red shows earlier at same ω). */
export const PLANET_DANGER_OMEGA_RAD_PER_S = 7

/** Visible “hot rim” hue (bright coral — reads stronger on dark than deep red). */
export const DANGER_RED_EMISSIVE_HEX = 0xff584d

/** Additive atmospheric shell: idle vs max-danger opacity (`meshStandardMaterial.opacity`). */
export const PLANET_ATMOSPHERE_OPACITY_IDLE = 0.05
export const PLANET_ATMOSPHERE_DANGER_OPACITY_MAX = 0.14
