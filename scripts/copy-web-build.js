const fs = require('fs')
const path = require('path')

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`\nERROR: Web build not found at ${src}`)
    console.error('Run "npm run build:app" first.\n')
    process.exit(1)
  }
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
}

const root = path.join(__dirname, '..')
const src  = path.join(root, 'mobile', 'dist')
const dest = path.join(root, 'server', 'public')

console.log(`Copying web build:\n  ${src}\n  → ${dest}`)
copyDir(src, dest)
console.log('Done — web build ready to serve.\n')
