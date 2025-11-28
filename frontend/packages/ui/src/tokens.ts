export const colors = {
  background: "#0a0a0a",
  surface: "#1e1e1e",
  surfaceMuted: "#252525",
  border: "#2a2a2a",
  primary: "#3b82f6",
  success: "#22c55e",
  error: "#ef4444",
  warning: "#f59e0b",
  textPrimary: "#ffffff",
  textSecondary: "#a0a0a0"
};

export const shadows = {
  glowSm: "0 0 10px rgba(59, 130, 246, 0.35)",
  glow: "0 0 25px rgba(59, 130, 246, 0.45)"
};

export type ColorToken = keyof typeof colors;
