const EventEmitter = require('events')
const apollo = require('ctrip-apollo')
const {isArray, isObject, isString} = require('core-util-is')

const {error, configNotFoundError} = require('./error')

/////////////////////////////////////////////////////////
// ## Terminology
// - key: one of options.keys
// - configKey: the key name of a configuration in apollo
/////////////////////////////////////////////////////////

const {AVAILABLE_OPTIONS} = apollo

const OVERRIDABLE_OPTIONS = [
  'host',
  'appId',
  'cluster',
  'namespace',
  'ip',
  'dataCenter'
]

const MAP_CONFIGKEY_KEY = Symbol('config-key')

const createKey = items =>
  Buffer.from(items.join('|')).toString('base64')

// Generate the unique key for apollo application
const uniqueKey = options => createKey(
  AVAILABLE_OPTIONS.map(key => options[key])
)

const assignKeyOptions = (host, opts, key) => {
  Object.keys(opts).forEach(k => {
    if (OVERRIDABLE_OPTIONS.includes(k)) {
      host[k] = opts[k]
      return
    }

    throw error('INVALID_KEY_OPTION', k, key)
  })

  return host
}

const makeArray = subject => isArray(subject)
  ? subject
  : [subject]

const formatKeyOptions = (defaults, rawKeyOptions, key) => {
  if (!isObject(rawKeyOptions)) {
    // 'REDIS_HOST': 'redis.host'
    rawKeyOptions = {
      key: rawKeyOptions
    }
  }

  // else:
  // 'REDIS_HOST': {
  //   key: 'redis.host',
  //   namespace: 'common'
  // }
  if (!isString(rawKeyOptions.key)) {
    throw error('INVALID_CONFIG_KEY', key, rawKeyOptions.key)
  }

  // Merge with the default options
  const {
    key: configKey,
    ...opts
  } = rawKeyOptions

  const {
    cluster,
    namespace,
    ...options
  } = assignKeyOptions({
    ...defaults
  }, opts, key)

  return {
    configKey,
    cluster,
    namespace,
    options
  }
}

class ApolloClient extends EventEmitter {
  constructor ({
    keys = {},
    ...apolloOptions
  } = {}) {
    super()

    this._apolloOptions = apolloOptions
    this._apollos = Object.create(null)
    this._clients = new Set()
    this._keyClients = Object.create(null)
    this._values = Object.create(null)

    Object.keys(keys).forEach(k => {
      this._addKey(k, keys[k])
    })
  }

  _addKey (key, rawKeyOptions) {
    const optionsList = makeArray(rawKeyOptions).map(
      raw => formatKeyOptions(this._apolloOptions, raw, key)
    )

    if (optionsList.length === 0) {
      throw error('EMPTY_KEY_OPTIONS', key)
    }

    this._add(key, optionsList)
  }

  // - key `string` key name
  // - optionsList `Array<object>` apollo config key name
  _add (key, optionsList) {
    this._keyClients[key] = optionsList.map(
      ({
        configKey,
        cluster,
        namespace,
        options
      }) => {
        const client = this._getApollo(options)
        // ctrip-apollo will manage duplication of cluster name
        .cluster(cluster)
        .namespace(namespace)

        this._associateClientAndKey(client, configKey, key)

        return {
          client,
          configKey,
          options
        }
      }
    )
  }

  _getApollo (options) {
    const id = uniqueKey(options)

    return this._apollos[id] || (
      this._apollos[id] = apollo(options)
    )
  }

  _associateClientAndKey (client, configKey, key) {
    this._clients.add(client)

    const initialized = MAP_CONFIGKEY_KEY in client

    const map = initialized
      ? client[MAP_CONFIGKEY_KEY]
      : (client[MAP_CONFIGKEY_KEY] = Object.create(null))
    const keySet = map[configKey] || (map[configKey] = new Set())

    keySet.add(key)

    if (!initialized) {
      client.on('change', e => {
        this._applyChange(e.key, map)
      })
    }
  }

  _applyChange (configKey, map) {
    const keySet = map[configKey]
    if (!keySet) {
      return
    }

    for (const key of keySet) {
      this._compare(key)
    }
  }

  _compare (key) {
    const oldValue = this._values[key]
    const newValue = this.get(key)

    if (oldValue === newValue) {
      return
    }

    this._values[key] = newValue
    this.emit('change', {
      key,
      oldValue,
      newValue
    })
  }

  async ready () {
    const tasks = [...this._clients].map(client => client.ready())
    await Promise.all(tasks)

    // Validate and set values of keys
    this.each((value, key) => {
      this._values[key] = value
    })

    return this
  }

  get (key) {
    const clients = this._keyClients[key]

    if (!clients) {
      throw error('KEY_NOT_DECLARED', key)
    }

    return this._get(key, clients)
  }

  _get (key, clients) {
    for (const {client, configKey} of clients) {
      if (client.has(configKey)) {
        return client.get(configKey)
      }
    }

    throw configNotFoundError(key, clients)
  }

  each (callback) {
    for (const [key, clients] of Object.entries(this._keyClients)) {
      const value = this._get(key, clients)
      callback(value, key)
    }
  }
}

module.exports = options => new ApolloClient(options)
