import * as path from 'node:path'
import * as util from 'node:util'
import * as bun  from 'bun'
import * as pw   from 'playwright-core'

import * as build_lightning_solid from './contestants/lightning-solid/build.ts'

import * as trace from './trace_events.ts'

const lightning_solid_dir = path.join(import.meta.dir, 'contestants', 'lightning-solid')


function force_gc(page: pw.Page): Promise<void> {
    return page.evaluate('window.gc({type: "major", execution: "sync", flavor: "last-resort"})')
}

function set_cpu_slowdown(client: pw.CDPSession, rate: number) {
    return client.send('Emulation.setCPUThrottlingRate', {rate})
}

function sleep(timeout?: number): Promise<void> {
    return new Promise(r => setTimeout(r, timeout))
}

function ns_to_ms(ns: number): number {
    return Math.round(ns/1000)
}

const _utf8_decoder = new TextDecoder()
function utf8_decode(src: NodeJS.ArrayBufferView | ArrayBuffer): string {
    return _utf8_decoder.decode(src)
}

const ANSI_RESET   = '\x1b[0m'
const ANSI_RED     = '\x1b[31m'
const ANSI_GREEN   = '\x1b[32m'
const ANSI_YELLOW  = '\x1b[33m'
const ANSI_BLUE    = '\x1b[34m'
const ANSI_MAGENTA = '\x1b[35m'
const ANSI_CYAN    = '\x1b[36m'
const ANSI_WHITE   = '\x1b[37m'
const ANSI_GRAY    = '\x1b[90m'

let _log_pad_len = 5
const _log_pad_topic = (topic: string) => topic + ' '.repeat((_log_pad_len = Math.max(_log_pad_len, topic.length)) - topic.length) 

function log(topic: string, msg: string, ...args: any[]): void {
    console.log(`${ANSI_GRAY}[${_log_pad_topic(topic)}]: ${ANSI_RESET}${msg}`, ...args)
}
function error(topic: string, msg: string, ...args: any[]): void {
    console.error(`${ANSI_RED}[${_log_pad_topic(topic)}]: ${ANSI_RESET}${msg}`, ...args)
}

function assert(condition: boolean, msg?: string): asserts condition {
    if (!condition) throw new Error(msg || 'Assertion failed')
}

function serve(options: {
    prebuild: boolean,
}) {

    let prebuild_promise: Promise<void> | undefined

    if (options.prebuild) {
        let before = performance.now()
        prebuild_promise = build_lightning_solid.build()
        prebuild_promise.then(() => {
            log('SERVE', 'Prebuilt in %oms', Math.round(performance.now()-before))
        })
    }

    async function handle_request(req: Request): Promise<Response> {
        
        let url = new URL(req.url)
        
        // Rebuild on each request to /
        if (url.pathname === '/') {
            if (options.prebuild) {
                await prebuild_promise
            } else {
                let before = performance.now()
                await build_lightning_solid.build()
                log('SERVE', 'Built in %oms', Math.round(performance.now()-before))
            }
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
                log('SERVE', `${ANSI_MAGENTA}%s${ANSI_RESET} %s %o`, req.method, url.pathname, res.status)
                return res
            } catch (e) {
                error('SERVE', `${ANSI_MAGENTA}%s${ANSI_RESET} %s %o\n%o`, req.method, url.pathname, 500, e)
                return new Response('Server Error', {status: 500})
            }
        },
    })

    log('SERVE', `Server started on ${ANSI_BLUE}${server.url}${ANSI_RESET}`)

    return server
}

async function main() {

    if (process.argv[2] === 'serve') {
        serve({
            prebuild: false,
        })
        return
    }

    // Parse config args
    let args = util.parseArgs({
        options: {
            'slowdown': {
                type: 'string',
                default: '20'
            },
            'warmup': {
                type: 'string',
                default: '5'
            },
            'runs': {
                type: 'string',
                default: '20',
            },
        },
    })

    {
        let max_key_len = 0
        for (let key in args.values) {
            max_key_len = Math.max(max_key_len, key.length)
        }
        for (let [key, value] of Object.entries(args.values)) {
            log('BENCH', '--%s %o', key.padEnd(max_key_len, ' '), value)
        }
    }

    let cpu_slowdown = Number(args.values['slowdown'])
    let warmup_count = Number(args.values['warmup'])
    let run_count    = Number(args.values['runs'])

    // Server
    const server = serve({
        prebuild: true,
    })

    // Browser
    const browser = await pw.chromium.launch({
        channel:  'chrome',
        headless: false,
        args:     [
            '--window-size=1000,800',
            '--js-flags=--expose-gc',
            '--enable-benchmarking',
        ],
    })

    let total_duration = 0

    // Benchmark
    for (let run_i = 0; run_i < run_count; run_i++) {

        // Page
        const page = await browser.newPage()
        log('BENCH', '[%d] Page created', run_i)
    
        // Console messages
        page.on('console', msg => {
            let type = msg.type()
            let color = ANSI_WHITE
            switch (type) {
            case 'error':   color = ANSI_RED    ;break
            case 'warning': color = ANSI_YELLOW ;break
            case 'debug':   color = ANSI_BLUE   ;break
            }
            log('PAGE', `${color}[${type}]:${ANSI_RESET} ${msg.text()}`)
        })
        
        // CDP Session
        const client = await page.context().newCDPSession(page)
        log('BENCH', '[%d] CDP session created', run_i)
    
        // Website
        await page.goto(server.url.toString(), {waitUntil: 'networkidle'})
        log('BENCH', `[%d] Website ${ANSI_BLUE}${server.url}${ANSI_RESET} loaded`, run_i)
    
        // Warmup
        for (let warmup_i = 0; warmup_i < warmup_count; warmup_i++) {
            await page.keyboard.press('Enter')    
            await page.keyboard.press('R')    
        }
        log('BENCH', '[%d] Warmup done', run_i)
    
        // CPU Slowdown
        await sleep(50)
        await force_gc(page)
        await set_cpu_slowdown(client, cpu_slowdown)
        log('BENCH', `[%d] CPU Slowdown ${cpu_slowdown} enabled`, run_i)
    
        // Start Tracing
        await browser.startTracing(page, {
            screenshots: false,
            categories:  trace_categories_to_get_duration,
        })
    
        // Run Test
        await page.keyboard.press('Enter')
        await page.evaluate('new Promise(r => requestAnimationFrame(r))')
    
        // End Test
        // await sleep(100)
        let trace_result = await browser.stopTracing()
        await set_cpu_slowdown(client, 1)
    
        
        let tracefile = trace.parse_trace_events_file(utf8_decode(trace_result))
        let duration = get_duration_from_tracefile(tracefile)
        total_duration += duration
        
        log('BENCH', `[%d] Run ended, took %oms`, run_i, ns_to_ms(duration))
    
        // For mem tests
        // await client.send("Performance.enable");
        // let result = ((await page.evaluate("performance.measureUserAgentSpecificMemory()")) as any).bytes / 1024 / 1024
        // console.log('mem', result)
    
        // End
        page.close()
    }

    log('BENCH', `All runs done took %oms / %o = %oms avg`, ns_to_ms(total_duration), run_count, ns_to_ms(total_duration/run_count))
    
    // End
    browser.close()
    server.stop(true)
}

const trace_categories_to_get_duration: trace.Category[] = [
    // EventDispatch
    'devtools.timeline',
    // Commit
    'disabled-by-default-devtools.timeline',
]

function get_duration_from_tracefile(tracefile: trace.Tracefile): number {

    let pid:   undefined | number
    let start: undefined | number
    let end:   undefined | number

    loop: for (let e of tracefile.traceEvents) {

        if (typeof e.dur !== 'number' ||
            (start != null && e.ts < start) ||
            e.ph != 'X'
        ) {
            continue
        }

        switch (e.name) {
        case 'EventDispatch':
            if (e.args.data?.type === 'keypress') {
                assert(start == null || pid == null, 'Multiple keypress events')
                start = e.ts
                pid   = e.pid
            }
            break
        case 'Commit':
            if (pid != null && e.pid === pid) {
                assert(start != null)
                end = e.ts+e.dur
                break loop
            }
            break
        }
    }

    assert(start != null, 'Did not found starting user event')
    assert(end   != null, 'Did not found ending commit event')

    return end-start
}


main()
