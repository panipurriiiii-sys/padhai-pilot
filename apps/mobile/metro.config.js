const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration (npm workspaces monorepo).
 * https://reactnative.dev/docs/metro
 *
 * Hoisted dependencies live in the repo root node_modules and workspace packages
 * (@padhai-pilot/shared, @padhai-pilot/assets, @padhai-pilot/ui) are symlinked, so Metro must watch the
 * workspace root and resolve modules from both node_modules folders.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    unstable_enableSymlinks: true,
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
