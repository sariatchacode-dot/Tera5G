const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

const webviewStub = path.resolve(__dirname, 'web-stubs/react-native-webview.js')

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-webview') {
    return { type: 'sourceFile', filePath: webviewStub }
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
