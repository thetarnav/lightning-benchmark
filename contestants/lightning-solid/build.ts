import * as bun from 'bun'

import * as babel from '@babel/core'
// @ts-expect-error
import preset_ts from '@babel/preset-typescript'
// @ts-expect-error
import plugin_jsx from 'babel-plugin-jsx-dom-expressions'

interface SolidPluginOptions {
    moduleName?: string
    generate?:   'dom' | 'ssr' | 'universal'
    hydratable?: boolean
}

function preset_solid(_: any, options?: SolidPluginOptions) {
    return {
        plugins: [
            [plugin_jsx, {
                moduleName: 'solid-js/web',
                builtIns: [
                    'For',
                    'Show',
                    'Switch',
                    'Match',
                    'Suspense',
                    'SuspenseList',
                    'Portal',
                    'Index',
                    'Dynamic',
                    'ErrorBoundary',
                ],
                contextToCustomElements: true,
                wrapConditionals: true,
                generate: 'dom',
                ...options,
            }]
        ]
    }
}

function plugin_solid(options: SolidPluginOptions = {}): bun.BunPlugin {
    return {
        name: 'bun-plugin-solid',
        setup(build) {
            build.onLoad({filter: /\.(j|t)sx$/}, async args => {
                let src = await bun.file(args.path).text()
                let res = await babel.transformAsync(src, {
                    filename: args.path,
                    presets: [
                        [preset_solid, options],
                        [preset_ts, {}],
                    ],
                })

                return {
                    contents: res!.code!,
                    loader: 'js',
                }
            })
        },
    }
}


bun.build({
    entrypoints: ['./src/index.tsx'],
    outdir:      'dist',
    target:      'browser',
    format:      'iife',
    conditions:  ['browser', 'production', 'solid'],
    minify:      true,
    plugins:     [plugin_solid({
        moduleName: '@lightningtv/solid',
        generate:   'universal',
    })],
})
