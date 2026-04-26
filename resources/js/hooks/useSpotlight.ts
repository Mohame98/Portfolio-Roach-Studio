/**
 * Spotlight effect — disabled. Returns a no-op so existing call sites can
 * pass the handler without producing any cursor-following glow. Kept as a
 * named export so import sites do not need to be touched.
 */
export function useSpotlight<_T extends HTMLElement = HTMLElement>() {
  return { onMouseMove: undefined };
}
