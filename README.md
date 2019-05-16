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

[ctrip-apollo](https://github.com/kaelzhang/ctrip-apollo)(The Ctrip's [apollo](https://github.com/ctripcorp/apollo) client) with pre-declared configuration keys

## Install

```sh
$ npm i apollo-declare
```

## Usage

```js
const declare = require('apollo-declare')

declare({
  host: 'http://localhost:8070',
  appId: '100004458',
  namespace: 'default',
  keys: {
    // Define `SENTRY_HOST` as
    // the value of the configuration key `sentry.host`
    SENTRY_HOST: 'sentry.host',
    REDIS_HOST: {
      key: 'redis.host',
      // Use a different namespace
      namespace: 'common'
    },

    // Define fallbacks
    DYNAMO_DB_HOST: [
      // The config key `dynamodb.host` in namespace `default`
      // has higher priority than the one in namespace `common`
      'dynamodb.host',
      // If `dynamodb.host` is not defined in namespace `default`,
      // then common.dynamodb.host will be used
      {
        key: 'dynamodb.host',
        namespace: 'common'
      }
    ]
  }
})
.on('change', ({key, oldValue, newValue}) => {
  process.env[key] = newValue
})
.ready(client => {
  client.get('REDIS_HOST')
  // 12.0.0.139

  // For each KV pair
  client.each((value, key) => {
    process.env[key] = value
  })
})
```

## declare(options): ApolloClient

- **options** `DeclareOptions`

```ts
interface DeclareOptions extends ApolloOptions {
  // The default cluster name
  cluster?: string
  // The default namespace name
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

- **callback** `Function(key: string, value: string)`

Executes the provided function `callback` once for each configuration key.

## License

[MIT](LICENSE)
