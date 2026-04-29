/** Mobile `Drawer` below home header chrome; keep separate from portaled popovers. */
export const LIVECHAT_HOME_DRAWER_Z_INDEX = 400

/**
 * Sticky header `--z-header-sticky` is 2000 and header island `--z-header-island` is 2600 (`variables.scss`).
 * Portaled `Popover`/`Menu` must sit above those or the panel is invisible / does not receive clicks.
 */
const LIVECHAT_PORTAL_BASE = 2650

/** Gear/settings `Popover.Dropdown` */
export const LIVECHAT_SETTINGS_POPOVER_Z_INDEX = LIVECHAT_PORTAL_BASE + 20

/**
 * `ColorInput` embeds its own `Popover` for the picker/swatches — above settings popover.
 */
export const LIVECHAT_COLOR_INPUT_POPOVER_Z_INDEX = LIVECHAT_SETTINGS_POPOVER_Z_INDEX + 25

/** Username `Menu` (profile link) — slightly below settings stack if both portaled. */
export const LIVECHAT_AUTHOR_MENU_Z_INDEX = LIVECHAT_PORTAL_BASE

/** Rules consent `Modal` — above everything in this feature except color sub-picker is already +25 on settings. */
export const LIVECHAT_RULES_MODAL_Z_INDEX = LIVECHAT_COLOR_INPUT_POPOVER_Z_INDEX + 35
