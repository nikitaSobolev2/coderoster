/**
 * Planet idle rotation in store/presets is legacy "radians per ~60 FPS tick".
 * Multiply by this factor to interpret as radians per second for dt-based integration.
 */
export const PLANET_LEGACY_ROTATION_TICK_HZ = 60

/** Horizontal drag: radians per viewport pixel (~one Earth spin per ~800px swipe at release). */
export const PLANET_DRAG_RADIANS_PER_PIXEL = 0.0018

/**
 * Applied to drag radians/px when `interactionDesktop === false` (thumb / coarse pointers).
 */
export const PLANET_DRAG_COARSE_SENSITIVITY_MULTIPLIER = 2.35

/** EMA weight for instantaneous angular velocity samples while dragging (higher → snappier). */
export const PLANET_DRAG_OMEGA_SMOOTH = 0.38

/** Touch: snappier ω tracking toward latch. */
export const PLANET_DRAG_OMEGA_SMOOTH_COARSE = 0.52

/**
 * Coarse pointers: min travel (px) before classifying swipe as vertical-scroll vs horizontal globe spin.
 * Avoids capturing the pointer until intent is clear; vertical scroll stays on the document.
 */
export const PLANET_MOBILE_GESTURE_COMMIT_PX = 14

/** Rad/s; viscous damping: omega *= exp(-DAMPING * dt) while coasting after release. */
export const PLANET_ANGULAR_DAMPING = 2.05

/** User angular velocity capped for stability. */
export const PLANET_MAX_USER_ANGULAR_VELOCITY_RAD_PER_S = 28

/**
 * |ω_user| scale used together for severity ramp (`angularVelocityDangerFactor`) **and**
 * latch physics when |ω| ≥ ENTER. Must be ≤ `PLANET_MAX_USER_ANGULAR_VELOCITY_RAD_PER_S`.
 */
export const PLANET_DANGER_ENTER_RAD_PER_S = 13

/**
 * Unlatch when |ω_user| ≤ EXIT. Must be strictly less than ENTER (hysteresis).
 */
export const PLANET_DANGER_EXIT_RAD_PER_S = 9.5

/** Easier latch + tint ramp when not `interactionDesktop` (typical phones). Must be < ENTER. */
export const PLANET_DANGER_ENTER_COARSE_RAD_PER_S = 9

/** Exit hysteresis paired with ENTER_COARSE. */
export const PLANET_DANGER_EXIT_COARSE_RAD_PER_S = 6.85

/** Stronger angular decay after unlatch until |ω| nears zero (returns to idle-only spin). */
export const PLANET_RECOVERY_ANGULAR_DAMPING = 3.85

/** Recovery phase ends when |ω_user| falls below this (rad/s); then ω snaps to 0. */
export const PLANET_COOLDOWN_OMEGA_COMPLETE_RAD_PER_S = 0.12

/** `MathUtils.damp` smoothing for shared display threat (approx 1/e time). */
export const PLANET_DISPLAY_THREAT_SMOOTH_HZ = 5.2

/**
 * While smoothed display threat ≥ this, section navigation does not run the extra GSAP yaw burst
 * (home scroll / mobile section changes).
 */
export const PLANET_SUPPRESS_SECTION_ROTATION_BURST_MIN_DISPLAY_THREAT = 0.48

/** Visible “hot rim” hue (bright coral — reads stronger on dark than deep red). */
export const DANGER_RED_EMISSIVE_HEX = 0xff584d

/** Additive atmospheric shell: idle vs max-danger opacity (`meshStandardMaterial.opacity`). */
export const PLANET_ATMOSPHERE_OPACITY_IDLE = 0.05
export const PLANET_ATMOSPHERE_DANGER_OPACITY_MAX = 0.14
