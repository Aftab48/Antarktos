// Tailwind only emits CSS where `@import "tailwindcss"` is: src/app/(frontend)/styles.css, loaded by the public
// layout only. The Payload admin never gets Tailwind (AGENTS.md); `npm run check:step5` asserts its CSS has none.
export default { plugins: { '@tailwindcss/postcss': {} } }
