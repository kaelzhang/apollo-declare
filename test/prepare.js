const {
  ConfigService,
  superAdmin
} = require('apollo-mock-server')

const prepare = async () => {
  const config = new ConfigService({})

  const port = await config.listen()
  return {
    host: `http://127.0.0.1:${port}`,
    config
  }
}

module.exports = {
  // listen,
  prepare,
  superAdmin
}
