const path = require('path');
const fs = require('fs');
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

const extraWatch = [
  workspaceRoot,
  'A:\\padhai-pilot',
  path.resolve(workspaceRoot, 'packages/shared'),
  path.resolve(workspaceRoot, 'packages/ui'),
  path.resolve(workspaceRoot, 'packages/assets'),
  'A:\\padhai-pilot\\packages\\shared',
  'A:\\padhai-pilot\\packages\\ui',
  'A:\\padhai-pilot\\packages\\assets',
  ...(process.env.METRO_EXTRA_WATCH ? [process.env.METRO_EXTRA_WATCH] : []),
].filter((dir, idx, arr) => {
  try {
    return fs.existsSync(dir) && arr.indexOf(dir) === idx;
  } catch {
    return false;
  }
});

const config = {
  watchFolders: extraWatch,
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
      'A:\\padhai-pilot\\node_modules',
    ].filter((dir) => {
      try {
        return fs.existsSync(dir);
      } catch {
        return false;
      }
    }),
    extraNodeModules: {
      '@padhai-pilot/shared': path.resolve(workspaceRoot, 'packages/shared'),
      '@padhai-pilot/ui': path.resolve(workspaceRoot, 'packages/ui'),
      '@padhai-pilot/assets': path.resolve(workspaceRoot, 'packages/assets'),
    },
    unstable_enableSymlinks: true,
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
