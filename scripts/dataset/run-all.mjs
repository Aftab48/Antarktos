// Runs the whole demo-dataset collection: seed facts, PDFs, then photos (slowest, last).
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))

function run(script) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(dir, script)], { stdio: 'inherit' })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${script} exited ${code}`))))
  })
}

async function main() {
  await run('write-seed.mjs')
  await run('fetch-pdfs.mjs')
  await run('fetch-photos.mjs')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
