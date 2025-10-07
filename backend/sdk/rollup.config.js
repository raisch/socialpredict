import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'

const createConfig = (format, file, plugins = []) => ({
  input: 'src/index.js',
  output: {
    file,
    format,
    name: format === 'umd' ? 'SocialPredictSDK' : undefined,
    globals: format === 'umd' ? { axios: 'axios' } : undefined,
    sourcemap: true,
    exports: 'named'
  },
  external: ['axios'],
  plugins: [
    resolve({
      browser: format === 'umd'
    }),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: [
        [
          '@babel/preset-env',
          {
            modules: false,
            targets: format === 'umd' ? '> 0.25%, not dead' : { node: '14' }
          }
        ]
      ]
    }),
    ...plugins
  ]
})

export default [
  // ES Module build
  createConfig('es', 'dist/index.esm.js'),

  // CommonJS build
  createConfig('cjs', 'dist/index.js'),

  // UMD build (for browsers)
  createConfig('umd', 'dist/index.umd.js'),

  // UMD minified build
  createConfig('umd', 'dist/index.umd.min.js', [terser()])
]
