const test = require('ava')
// const log = require('util').debuglog('apollo-declare')
const apollo = require('..')
const {
  prepare,
  superAdmin
} = require('./prepare')

const appId = 'apollo-declare'
let host

const defaultCluster = superAdmin
.app(appId)
.cluster('default')

const aFoo = defaultCluster
.namespace('application')
.set('foo', 'foo')
.set('not-used', 'not-used')
.publish()

defaultCluster
.namespace('foo2')
.set('foo', 'foo2')
.publish()

test.before(async () => {
  ({
    host
  } = await prepare())
})

test('empty', async t => {
  const client = apollo()
  await client.ready()

  t.throws(() => client.get('FOO'), {
    code: 'KEY_NOT_DECLARED'
  })
})

test('INVALID_KEY_OPTION', async t => {
  t.throws(() => apollo({
    keys: {
      FOO: {
        key: 'foo',
        boooom: 1
      }
    }
  }), {
    code: 'INVALID_KEY_OPTION'
  })
})

test('INVALID_CONFIG_KEY', async t => {
  t.throws(() => apollo({
    keys: {
      FOO: {
        key: 1
      }
    }
  }), {
    code: 'INVALID_CONFIG_KEY'
  })
})

test('EMPTY_KEY_OPTIONS', async t => {
  t.throws(() => apollo({
    keys: {
      FOO: []
    }
  }), {
    code: 'EMPTY_KEY_OPTIONS'
  })
})

test.serial('integrated', async t => {
  const client = apollo({
    host,
    appId,
    keys: {
      FOO: 'foo',
      FOO2: {
        key: 'foo',
        namespace: 'foo2'
      }
    }
  })

  const wait = new Promise(resolve => {
    client.once('change', e => {
      t.is(e.key, 'FOO')
      t.is(e.oldValue, 'foo')
      t.is(e.newValue, 'newFoo')
      resolve()
    })
  })

  t.is(client, await client.ready())

  t.is(client.get('FOO'), 'foo')
  t.is(client.get('FOO2'), 'foo2')

  t.throws(() => client.get('BAR'), {
    code: 'KEY_NOT_DECLARED'
  })

  aFoo
  .set('foo', 'newFoo')
  .set('not-used', 'not-used2')
  .publish()

  return wait
})
