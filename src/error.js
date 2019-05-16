const {Errors, exitOnNotDefined} = require('err-object')

const {E, error} = new Errors({
  prefix: '[apollo-declare] ',
  notDefined: exitOnNotDefined
})

E('INVALID_KEY_OPTION', 'options.%s is not allowed for a key "%s"')
E('INVALID_CONFIG_KEY', 'options.key must be a string for key "%s"')
E('EMPTY_KEY_OPTIONS', 'options for key "%s" should not be an empty array')

E('KEY_NOT_DECLARED', 'key "%s" is not declared')

const configNotFoundError = (key, clients) => {

}

module.exports = {
  error
}
