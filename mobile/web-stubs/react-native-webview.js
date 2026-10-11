// Web stub — react-native-webview has no web implementation.
// connect.web.tsx uses an iframe instead, so this is never actually rendered.
const React = require('react')
const { View } = require('react-native')

function WebView({ style }) {
  return React.createElement(View, { style })
}

WebView.displayName = 'WebView'
module.exports = WebView
module.exports.WebView = WebView
module.exports.default = WebView
