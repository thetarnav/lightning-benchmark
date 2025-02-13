import * as path from 'node:path'
import * as bun  from 'bun'
import * as pw   from 'playwright-core'

import * as build_lightning_solid from './contestants/lightning-solid/build.ts'

import * as trace from './trace_events.ts'

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

function serve() {

    async function handle_request(req: Request): Promise<Response> {
        
        let url = new URL(req.url)
        
        // Rebuild on each request to /
        if (url.pathname === '/') {
            let before = performance.now()
            await build_lightning_solid.build()
            log('SERVE', 'Built in %oms', Math.round(performance.now()-before))
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

    const server = serve()

    const browser = await pw.chromium.launch({
        channel:  'chrome',
        headless: false,
        args:     [
            '--window-size=1000,800',
            '--js-flags=--expose-gc',
            '--enable-benchmarking',
        ],
    })
    
    // Page
    const page = await browser.newPage()
    log('BENCH', 'Page created')

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
    log('BENCH', 'CDP session created')

    // Website
    await page.goto(server.url.toString(), {waitUntil: 'networkidle'})
    log('BENCH', `Website ${ANSI_BLUE}${server.url}${ANSI_RESET} loaded`)

    // CPU Throttling
    await force_gc(page)
    await set_cpu_throttling(client, CPU_THROTTLING)
    log('BENCH', `CPU Throttling ${CPU_THROTTLING} enabled`)

    // Start Tracing
    await browser.startTracing(page, {
        screenshots: false,
        categories:  trace_categories_to_get_duration,
    })

    // Run Benchmark
    await page.keyboard.press('Enter')

    // End Benchmark
    await sleep(40)
    let trace_result = await browser.stopTracing()
    await set_cpu_throttling(client, 1)

    log('BENCH', 'Bench ended')


    let tracefile = trace.parse_trace_events_file(utf8_decode(trace_result))
    let duration = get_duration_from_tracefile(tracefile)

    console.log(duration)

    // For mem tests
    // await client.send("Performance.enable");
    // let result = ((await page.evaluate("performance.measureUserAgentSpecificMemory()")) as any).bytes / 1024 / 1024
    // console.log('mem', result)

    // End
    page.close()
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
    assert(end != null,   'Did not found ending commit event')

    return end-start
}


main()
