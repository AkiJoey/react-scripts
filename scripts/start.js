const http = require('http')

const Koa = require('koa')
const chalk = require('chalk')

const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')

process.env.NODE_ENV = 'development'
const config = require('../webpack.config')

// webpack-dev-middleware
const devMiddleware = (compiler, options) => {
  const dev = webpackDevMiddleware(compiler, options)
  return async (ctx, next) => {
    await dev(
      ctx.req,
      Object.assign(ctx.res, {
        send: content => (ctx.body = content)
      }),
      next
    )
  }
}

// webpack-hot-middleware
const hotMiddleware = (compiler, options) => {
  const hot = webpackHotMiddleware(compiler, options)
  return async (ctx, next) => {
    const originalEnd = ctx.res.end
    ;(await new Promise(resolve => {
      ctx.res.end = function () {
        originalEnd.bind(this, ...arguments)
        resolve()
      }
      hot(ctx.req, ctx.res, resolve)
    })) && next()
  }
}

function start() {
  const app = new Koa()
  const compiler = webpack(config)
  app.use(
    devMiddleware(compiler, {
      writeToDisk: false
    })
  )
  app.use(
    hotMiddleware(compiler, {
      heartbeat: 2000
    })
  )
  const server = http.createServer(app.callback())
  // server listen
  const host = process.env.HOST || '127.0.0.1'
  const port = Number(process.env.PORT || 3000)
  const url = chalk.blueBright.underline(`http://${host}:${port}`)
  server.listen(port, host, () => {
    console.log(`DevServer is running at ${url}`)
  })
  // signal handle
  const signals = ['SIGINT', 'SIGTERM']
  signals.forEach(signal => {
    process.on(signal, () => {
      server.close()
      console.log(chalk.greenBright.bold('Exit'))
      process.exit()
    })
  })
}

if (require.main === module) {
  start()
}
