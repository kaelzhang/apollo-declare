const {Errors, exitOnNotDefined} = require('err-object')

const {E, error} = new Errors({
  prefix: '[apollo-declare] ',
  notDefined: exitOnNotDefined
})

E('INVALID_KEY_OPTION', 'options.%s is not allowed for a key "%s"')
E('INVALID_CONFIG_KEY',
  'options.key must be a string for key "%s", but got `%s`')
E('EMPTY_KEY_OPTIONS', 'options for key "%s" should not be an empty array')

E('KEY_NOT_DECLARED', 'key "%s" is not declared')

E('CONFIG_NOT_FOUND',
  'no config for "%s" found in apollo config service:%s')

const configNotFoundError = (key, clients) => {
  const details = clients.map(({
    client, configKey, options
  }) => `
- config key "${configKey}" not found in
  - host: "${options.host}"
  - appId: "${options.appId}"
  - cluster: "${client.cluster}"
  - namespace: "${client.namespace}"`)
  .join('')

  return error('CONFIG_NOT_FOUND', key, details)
}

module.exports = {
  error,
  configNotFoundError
}
