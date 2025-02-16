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

function assert(condition: boolean, msg?: string, ...args: any[]): asserts condition {
    if (!condition) {
        throw new Error(msg == null
            ? 'Assertion failed'
            : util.format('Assertion failed: ' + msg, ...args)
        )
    }
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

function parse_config_args() {

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

    let config = {
        slowdown: Number(args.values['slowdown']),
        warmup:   Number(args.values['warmup']),
        runs:     Number(args.values['runs']),
    }

    let max_key_len = 0
    for (let key in config) {
        max_key_len = Math.max(max_key_len, key.length)
    }
    for (let [key, value] of Object.entries(config)) {
        log('BENCH', '--%s %o', key.padEnd(max_key_len, ' '), value)
    }

    return config
}

type Test_Case = {
    name:  string,
    init:  (page: pw.Page) => void | Promise<void>
    run:   (page: pw.Page) => void | Promise<void>
    clear: (page: pw.Page) => void | Promise<void>
}

async function click(page: pw.Page, selector: string): Promise<void> {
    let elem = await page.$(selector)
    assert(elem != null, 'Element $(%s) was not found', selector)
    await elem.click()
    await elem.dispose()
}

const test_cases: Test_Case[] = [{
    name:  'create',
    init:  page => {},
    run:   page => click(page, '#create'),
    clear: page => click(page, '#remove_all'),
}, {
    name:  'create_many',
    init:  page => {},
    run:   page => click(page, '#create_many'),
    clear: page => click(page, '#remove_all'),
}, {
    name:  'update_all',
    init:  page => click(page, '#create'),
    run:   page => click(page, '#update_all'),
    clear: page => click(page, '#remove_all'),
}, {
    name:  'update_some',
    init:  page => click(page, '#create'),
    run:   page => click(page, '#update_some'),
    clear: page => click(page, '#remove_all'),
}, {
    name:  'select',
    init:  page => click(page, '#create'),
    run:   page => click(page, '#select'),
    clear: page => click(page, '#remove_all'),
}, {
    name:  'swap',
    init:  page => click(page, '#create'),
    run:   page => click(page, '#swap'),
    clear: page => click(page, '#remove_all'),
}, {
    name:  'append',
    init:  page => click(page, '#create'),
    run:   page => click(page, '#append'),
    clear: page => click(page, '#remove_all'),
}, {
    name:  'remove_one',
    init:  page => click(page, '#create'),
    run:   page => click(page, '#remove_one'),
    clear: page => click(page, '#remove_all'),
}, {
    name:  'remove_all',
    init:  page => click(page, '#create'),
    run:   page => click(page, '#remove_all'),
    clear: page => {},
}]

async function main() {

    // $: bun run serve
    if (process.argv[2] === 'serve') {
        serve({
            prebuild: false,
        })
        return
    }

    // Parse config args
    let config = parse_config_args()

    // Server
    let server = serve({
        prebuild: true,
    })

    // Browser
    let browser = await pw.chromium.launch({
        channel:  'chrome',
        headless: false,
        args:     [
            '--window-size=1000,800',
            '--js-flags=--expose-gc',
            '--enable-benchmarking',
        ],
    })

    let bench_timestamp = Date.now()

    // Benchmark = all test cases * all runs

    for (let test_case of test_cases) {

        let total_duration = 0
    
        for (let run_i = 0; run_i < config.runs; run_i++) {
    
            // Page
            let page = await browser.newPage()
            log('BENCH', `${ANSI_GRAY}%s[%d]${ANSI_RESET} Page created`, test_case.name, run_i)
        
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
            let client = await page.context().newCDPSession(page)
            log('BENCH', `${ANSI_GRAY}%s[%d]${ANSI_RESET} CDP session created`,
                test_case.name, run_i)
        
            // Website
            await page.goto(server.url.toString(), {waitUntil: 'networkidle'})
            log('BENCH', `${ANSI_GRAY}%s[%d]${ANSI_RESET} Website ${ANSI_BLUE}%s${ANSI_RESET} loaded`,
                test_case.name, run_i, server.url)
        
            // Warmup
            await test_case.init(page)
            for (let warmup_i = 0; warmup_i < config.warmup; warmup_i++) {
                await test_case.run(page)
            }
            await test_case.clear(page)

            log('BENCH', `${ANSI_GRAY}%s[%d]${ANSI_RESET} Warmup done`,
                test_case.name, run_i)
        
            // Test

            await test_case.init(page)

            await set_cpu_slowdown(client, config.slowdown)
            await browser.startTracing(page, {
                path:        `traces/${bench_timestamp}/${test_case.name}-${run_i}.json`,
                screenshots: false,
                categories:  trace_categories_to_get_duration,
            })
            await sleep(50)
            await force_gc(page)
        
            await test_case.run(page)

            // TODO
            // how to check when the rendering actually stopped
            // when it is spread over multiple animation frames
            await page.evaluate('new Promise(r => requestAnimationFrame(r))') // Ensures commit trace event
        
            // End
            let trace_result = await browser.stopTracing()

            await set_cpu_slowdown(client, 1)
            
            let tracefile = trace.parse_trace_events_file(utf8_decode(trace_result))
            let duration = get_duration_from_tracefile(tracefile)
            total_duration += duration
            
            log('BENCH', `${ANSI_GRAY}%s[%d]${ANSI_RESET} Run ended, took %oms`,
                test_case.name, run_i, ns_to_ms(duration))
        
            await page.close()
        }
    
        log('BENCH', `%s: All runs done took %oms / %o = %oms avg`,
            test_case.name, ns_to_ms(total_duration), config.runs, ns_to_ms(total_duration/config.runs))
    }

    
    // End
    await browser.close()
    await server.stop(true)
}

// For mem tests
// await client.send("Performance.enable");
// let result = ((await page.evaluate("performance.measureUserAgentSpecificMemory()")) as any).bytes / 1024 / 1024

const trace_categories_to_get_duration: trace.Category[] = [
    // EventDispatch
    'devtools.timeline',
    // Commit
    'disabled-by-default-devtools.timeline',
]

/**
@returns time in ns between the click event and the last commit event
*/
function get_duration_from_tracefile(tracefile: trace.Tracefile): number {

    let pid:   undefined | number
    let start: undefined | number
    let end:   undefined | number

    for (let e of tracefile.traceEvents) {

        if (typeof e.dur !== 'number' ||
            (start != null && e.ts < start) ||
            e.ph != 'X'
        ) {
            continue
        }

        switch (e.name) {
        case 'EventDispatch':
            if (e.args.data?.type === 'click') {
                assert(start == null || pid == null, 'Multiple click events')
                start = e.ts
                pid   = e.pid
            }
            break
        case 'Commit':
            if (pid != null && e.pid === pid) {
                assert(start != null)
                end = e.ts+e.dur
            }
            break
        }
    }

    assert(start != null, 'Did not found starting user event')
    assert(end   != null, 'Did not found ending commit event')

    return end-start
}


main()
