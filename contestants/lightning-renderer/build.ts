import * as bun  from 'bun'
import * as path from 'node:path'

export async function build(): Promise<void> {

    let dist_dir   = path.join(import.meta.dir, 'dist')
    let public_dir = path.join(import.meta.dir, 'public')
    let src_dir    = path.join(import.meta.dir, 'src')

    // await fsp.cp(public_dir, dist_dir, {recursive: true})

    await bun.build({
        entrypoints: [path.join(src_dir, 'index.html')],
        outdir:      dist_dir,
        target:      'browser',
        format:      'iife',
        conditions:  ['browser', 'production', 'solid'],
        minify:      true,
        plugins:     [],
    })
}
