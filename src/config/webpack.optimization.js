// Webpack optimization configuration for code splitting
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor libraries
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          priority: 10,
          reuseExistingChunk: true,
        },
        // Common UI components
        common: {
          test: /[\\/]src[\\/]components[\\/]/,
          name: 'common',
          minChunks: 3,
          priority: 5,
          reuseExistingChunk: true,
        },
        // Material-UI
        mui: {
          test: /[\\/]node_modules[\\/]@mui[\\/]/,
          name: 'mui',
          priority: 20,
          reuseExistingChunk: true,
        },
        // Three.js and 3D components
        three: {
          test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
          name: 'three',
          priority: 15,
          reuseExistingChunk: true,
        },
        // Harvey AI components
        harvey: {
          test: /[\\/]src[\\/](components|services)[\\/].*[Hh]arvey/,
          name: 'harvey',
          priority: 8,
          reuseExistingChunk: true,
        },
        // Authentication components
        auth: {
          test: /[\\/]src[\\/](auth|components[\\/]auth)[\\/]/,
          name: 'auth',
          priority: 8,
          reuseExistingChunk: true,
        },
      },
    },
    // Enable module concatenation for better tree shaking
    concatenateModules: true,
    // Minimize bundle size
    minimize: true,
    // Use deterministic module IDs for better caching
    moduleIds: 'deterministic',
    // Use deterministic chunk IDs
    chunkIds: 'deterministic',
    // Runtime chunk for better caching
    runtimeChunk: 'single',
  },
  // Performance hints
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000, // 500 KB
    maxAssetSize: 512000, // 500 KB
    assetFilter: function (assetFilename) {
      // Don't warn about large source maps
      return !assetFilename.endsWith('.map');
    },
  },
};
