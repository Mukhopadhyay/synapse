/** Panel sizes in px, mirroring the `panel*` spacing tokens in globals.css (JS needs numbers for drag and camera offsets). */
export const PANEL_WIDTH = { default: 440, min: 360, max: 640, tablet: 380 } as const;
/** Floating surfaces sit this far from the viewport edge (`space-3`). */
export const SURFACE_INSET = 12;
/** Mobile sheet snap points, as fractions of the viewport height. */
export const SHEET_SNAP = { peek: 0.4, full: 0.92 } as const;

export const clampPanelWidth = (width: number) => Math.round(Math.min(PANEL_WIDTH.max, Math.max(PANEL_WIDTH.min, width)));
