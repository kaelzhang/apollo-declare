[![Build Status](https://travis-ci.org/kaelzhang/apollo-declare.svg?branch=master)](https://travis-ci.org/kaelzhang/apollo-declare)
[![Coverage](https://codecov.io/gh/kaelzhang/apollo-declare/branch/master/graph/badge.svg)](https://codecov.io/gh/kaelzhang/apollo-declare)
<!-- optional appveyor tst
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/github/kaelzhang/apollo-declare?branch=master&svg=true)](https://ci.appveyor.com/project/kaelzhang/apollo-declare)
-->
<!-- optional npm version
[![NPM version](https://badge.fury.io/js/apollo-declare.svg)](http://badge.fury.io/js/apollo-declare)
-->
<!-- optional npm downloads
[![npm module downloads per month](http://img.shields.io/npm/dm/apollo-declare.svg)](https://www.npmjs.org/package/apollo-declare)
-->
<!-- optional dependency status
[![Dependency Status](https://david-dm.org/kaelzhang/apollo-declare.svg)](https://david-dm.org/kaelzhang/apollo-declare)
-->

# apollo-declare

[ctrip-apollo](https://github.com/kaelzhang/ctrip-apollo)(the Ctrip's [apollo](https://github.com/ctripcorp/apollo) client) with pre-declared configuration keys.

## Install

```sh
$ npm i apollo-declare
```

## Usage

```js
const declare = require('apollo-declare')

const host = 'http://localhost:8070'
const appId = '100004458'
const namespace = 'default'

declare({
  host, appId, namespace,
  keys: {
    // Define `SENTRY_HOST` as
    // the value of the configuration key `sentry.host`
    REDIS_HOST: 'redis.host'
  }
})
// Emits when the value of a config key changes
.on('change', e => {
  // Do something with `e`
})
.ready()
.then(client => {
  // Get value by key
  client.get('REDIS_HOST')

  // For each KV pair
  client.each((value, key) => {
    console.log(value, key)
    // output: 192.168.10.1 REDIS_HOST
  })
})
```

### Declare two keys in different namespaces

```js
declare({
  host, appId, namespace,
  keys: {
    // Equivalent to:
    // REDIS_HOST: {
    //   key: 'redis.host'
    // }
    REDIS_HOST: 'redis.host',

    SENTRY_HOST: {
      key: 'sentry.host',
      // Which override namespace `default` with `common` for SENTRY_HOST
      namespace: 'common'
    }
  }
})
```

### Use the first available value among a config set

If we have two namespaces, `'default'` and `'common'`.

In namespace `'default'`, there is no config key named `'dynamodb.region'`. While in namespace `'common'`, the value of `'dynamodb.region'` is `'ap-northeast-10'`.

```js
// Inside a async function
const client = apollo({
  host, appId,
  namespace: 'default',
  keys: {
    DYNAMO_DB_HOST: [
      // The config key `dynamodb.region` in namespace `default`
      // has higher priority than the one in namespace `common`
      {
        key: 'dynamodb.region'
        // namespace: inherit from the default namespace
      },
      // If `dynamodb.region` is not defined in namespace `default`,
      // then common.dynamodb.region will be used
      {
        key: 'dynamodb.region',
        namespace: 'common'
      }
    ]
  }
})

await client.ready()

console.log(client.get('DYNAMO_DB_HOST'))
// ap-northeast-10
```

## declare(options): ApolloClient

- **options** `DeclareOptions`

```ts
interface DeclareOptions extends ApolloOptions {
  // The default cluster name which defaults to `default`
  cluster?: string
  // The default namespace name which defaults to `application`
  namespace?: string
  // The key declarations
  keys: {
    [string]: string  // config key
      | KeyDeclaration
      // Priority list
      | Array<string | KeyDeclaration>
  }
}

interface KeyDeclaration {
  key: string
  cluster?: string
  namespace?: string
}
```

`ApolloOptions` is the options of [`ctrip-apollo`](https://github.com/kaelzhang/ctrip-apollo)

Returns `ApolloClient` the apollo client. `ApolloClient` is a subclass of [`EventEmitter`](https://nodejs.org/dist/latest/docs/api/events.html)

### await client.ready(): this

Prepare and finish the initial fetching.

All methods except for `client.on(type, handler)` should be called after `await client.ready()`

### client.get(key): string

Get the value of config `key`

### client.each(callback): void

- **callback** `Function(value: string, key: string)`

Executes the provided function `callback` once for each defined key.

### Event: 'change'

- **key** `string` config key
- **newValue** `string` the new value of the key
- **oldValue** `string` the old value of the key

Emits when the value of a config key changes

```js
client.on('change', ({
  key,
  newValue,
  oldValue
}) => {
  console.log(`key "${key}" changes: "${oldValue}" -> "${newValue}"`)

  // Update process.env
  process.env[key] = newValue
})
```

## License

[MIT](LICENSE)
