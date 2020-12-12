#!/usr/bin/env node

const spawn = require('cross-spawn')
const args = process.argv.slice(2)

process.on('unhandledRejection', err => {
  throw err
})

const scripts = ['start', 'build']

const index = args.findIndex(arg => scripts.includes(arg))
const script = index === -1 ? args[0] : args[index]

if (scripts.includes(script)) {
  const result = spawn.sync(
    process.execPath,
    [
      ...(index > 0 ? args.slice(0, index) : []),
      require.resolve('../scripts/' + script),
      ...args.slice(index + 1)
    ],
    { stdio: 'inherit' }
  )
  if (result.signal) {
    process.exit(1)
  }
  process.exit(result.status)
} else {
  console.log(`Unknown script "${script}".`)
}
