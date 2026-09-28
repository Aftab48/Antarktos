// Layout math for the home-page meridian (redesign spec §8.1). Pure, so it can be tested without React.

// Latitude to rem from the top of a figure `height` rem tall.
export const latY = (lat: number, height: number) => ((90 - lat) / 180) * height

// Push labels apart so centres are at least `gap` rem apart, keeping them inside [pad, height - pad].
// Input must be sorted north to south (ascending y).
export function spreadLabels(ys: number[], gap: number, height: number, pad = gap / 2) {
  const out = ys.map((y) => Math.min(Math.max(y, pad), height - pad))
  for (let i = 1; i < out.length; i++) out[i] = Math.max(out[i], out[i - 1] + gap)
  if (out.length) out[out.length - 1] = Math.min(out[out.length - 1], height - pad)
  for (let i = out.length - 2; i >= 0; i--) out[i] = Math.min(out[i], out[i + 1] - gap)
  return out
}
