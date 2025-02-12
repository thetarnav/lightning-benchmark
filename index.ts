import * as path from 'node:path'
import * as bun  from 'bun'
import * as pw   from 'playwright-core'

import * as build_lightning_solid from './contestants/lightning-solid/build.ts'

const lightning_solid_dir = path.join(import.meta.dir, 'contestants', 'lightning-solid')


const CPU_THROTTLING = 20


function force_gc(page: pw.Page): Promise<void> {
    return page.evaluate('window.gc({type: "major", execution: "sync", flavor: "last-resort"})')
}

function set_cpu_throttling(client: pw.CDPSession, rate: number) {
    return client.send('Emulation.setCPUThrottlingRate', {rate})
}

function sleep(timeout?: number): Promise<void> {
    return new Promise(r => setTimeout(r, timeout))
}

const ANSI_RESET   = '\x1b[0m'
const ANSI_RED     = '\x1b[31m'
const ANSI_GREEN   = '\x1b[32m'
const ANSI_YELLOW  = '\x1b[33m'
const ANSI_BLUE    = '\x1b[34m'
const ANSI_MAGENTA = '\x1b[35m'
const ANSI_CYAN    = '\x1b[36m'
const ANSI_GRAY    = '\x1b[90m'

let _log_max_topic_len = 4
function log(topic: string, msg: string, ...args: any[]): void {
    _log_max_topic_len = Math.max(_log_max_topic_len, topic.length)
    let padding = ' '.repeat(_log_max_topic_len - topic.length)
    console.log(`${ANSI_GRAY}[${topic}${padding}]: ${ANSI_RESET}${msg}`, ...args)
}
function error(topic: string, msg: string, ...args: any[]): void {
    _log_max_topic_len = Math.max(_log_max_topic_len, topic.length)
    let padding = ' '.repeat(_log_max_topic_len - topic.length)
    console.error(`${ANSI_RED}[${topic}${padding}]: ${ANSI_RESET}${msg}`, ...args)
}

function serve() {

    async function handle_request(req: Request): Promise<Response> {
        
        let url = new URL(req.url)
        
        // Rebuild on each request to /
        if (url.pathname === '/') {
            let before = performance.now()
            await build_lightning_solid.build()
            log('SERVE', `Built in ${(performance.now()-before).toFixed()}ms`)
        }

        // Handle / -> /index.html
        let pathname = url.pathname
        if (pathname.endsWith('/')) {
            pathname += 'index.html'
        }

        // Serve static files from dist directory
        let file = bun.file(lightning_solid_dir+'/dist/'+pathname)

        if (await file.exists()) {
            return new Response(file)
        }

        return new Response('Not found', {status: 404})
    }

    const server = bun.serve({
        port: 3000,	
        async fetch(req): Promise<Response> {

            let url = new URL(req.url)

            try {
                let res = await handle_request(req)
                log('SERVE', '%s %s %n', req.method, url.pathname, res.status)
                return res
            } catch (e) {
                error('SERVE', '%s %s %n\n%o', req.method, url.pathname, 500, e)
                return new Response('Server Error', {status: 500})
            }
        },
    })

    log('SERVE', `Server started on ${server.url}`)

    return server
}

async function main() {

    const server = serve()

    const browser = await pw.chromium.launch({
        channel:  'chrome',
        headless: false,
        args:     [
            '--window-size=1000,800',
            '--js-flags=--expose-gc',
            '--enable-benchmarking',
            // '--enable-experimental-web-platform-features',
        ],
    })
    
    // Page
    const page = await browser.newPage()
    log('BENCH', 'Page created')

    // Console messages
    page.on('console', msg => {
        for (let arg of msg.args()) {
            log('PAGE', arg.toString())
        }
    })
    
    // CDPSession
    const client = await page.context().newCDPSession(page)
    log('BENCH', 'CDP session created')

    // Website
    await page.goto(server.url.toString(), {waitUntil: 'networkidle'})
    log('BENCH', `Website ${server.url} loaded`)

    // CPU Throttling
    await force_gc(page)
    await set_cpu_throttling(client, CPU_THROTTLING)
    log('BENCH', `CPU Throttling ${CPU_THROTTLING} enabled`)

    // Start Benchmark
    await browser.startTracing(page, {
        path:        './output/trace.json',
        screenshots: false,
        categories:  [
            'blink.user_timing',
            'devtools.timeline',
            'disabled-by-default-devtools.timeline',
        ],
    })

    // Benchmark
    log('BENCH', await page.title())

    // End Benchmark
    await sleep(40)
    await browser.stopTracing()
    await set_cpu_throttling(client, 1)

    log('BENCH', 'Bench ended')

    // For mem tests
    // await client.send("Performance.enable");
    // let result = ((await page.evaluate("performance.measureUserAgentSpecificMemory()")) as any).bytes / 1024 / 1024
    // console.log('mem', result)

    // End
    try {
        await page.close()
        await browser.close()
    } catch (e) {
        error('BENCH', 'ERROR closing page: %o', e)
    }

    await server.stop(true)
}


main()
