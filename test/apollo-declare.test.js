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
.publish()

const aFoo2 = defaultCluster
.namespace('foo2')
.set('foo', 'foo2')
.publish()

test.before(async () => {
  ({
    host
  } = await prepare())
})

test('integrated', async t => {
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

  t.is(client, await client.ready())

  t.is(client.get('FOO'), 'foo')
  t.is(client.get('FOO2'), 'foo2')
})
