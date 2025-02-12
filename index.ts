import * as path from 'node:path'
import * as bun  from 'bun'
import * as pw   from 'playwright-core'

import * as build_lightning_solid from './contestants/lightning-solid/build.ts'

const lightning_solid_dir = path.join(import.meta.dir, 'contestants', 'lightning-solid')


const CPU_THROTTLING = 20


function force_gc(page: pw.Page): Promise<void> {
    return page.evaluate("window.gc({type:'major',execution:'sync',flavor:'last-resort'})")
}

function set_cpu_throttling(client: pw.CDPSession, rate: number) {
    return client.send("Emulation.setCPUThrottlingRate", {rate})
}

function sleep(timeout?: number): Promise<void> {
    return new Promise(r => setTimeout(r, timeout))
}

async function main() {   
    
    await build_lightning_solid.build()

    const server = bun.serve({
        port: 3000,	
        async fetch(req) {
            const url = new URL(req.url)
            
            // Rebuild on each request to root
            if (url.pathname === '/') {
                return new Response(`<!DOCTYPE html>
                <html>
                    <head>
                        <title>Lightning Solid</title>
                    </head>
                    <body>
                        <div id="root"></div>
                        <script src="index.js"></script>
                    </body>
                </html>`, {
                    headers: {'Content-Type': 'text/html'}
                })
            }
    
            // Serve static files from dist directory
            const file = bun.file(lightning_solid_dir+'/dist/'+url.pathname)
    
            if (await file.exists()) {
                return new Response(file)
            }
    
            return new Response('Not found', {status: 404})
        },
    })
    const server_url = `http://localhost:${server.port}`

    const browser = await pw.chromium.launch({
        channel:  'chrome',
        headless: false,
        args:     [
            "--window-size=1000,800",
            "--js-flags=--expose-gc",
            "--enable-benchmarking",
            // "--enable-experimental-web-platform-features",
        ],
    })
    
    // Page
    const page = await browser.newPage()
    console.log('Page created')

    // Console messages
    page.on("console", msg => {
        for (let arg of msg.args()) {
            console.log(`BROWSER: ${arg}`)
        }
    })
    
    // CDPSession
    const client = await page.context().newCDPSession(page)
    console.log('CDPSession created')

    // Website
    await page.goto(server_url, {waitUntil: 'networkidle'})
    console.log(`Website ${server_url} loaded`)

    // CPU Throttling
    await force_gc(page)
    await set_cpu_throttling(client, CPU_THROTTLING)
    console.log(`CPU Throttling ${CPU_THROTTLING} enabled`)

    // Start Benchmark
    await browser.startTracing(page, {
        path:        './output/trace.json',
        screenshots: false,
        categories:  [
            "blink.user_timing",
            "devtools.timeline",
            "disabled-by-default-devtools.timeline",
        ],
    })

    // Benchmark
    console.log(await page.title())

    // End Benchmark
    await sleep(40)
    await browser.stopTracing()
    await set_cpu_throttling(client, 1)

    // For mem tests
    // await client.send("Performance.enable");
    // let result = ((await page.evaluate("performance.measureUserAgentSpecificMemory()")) as any).bytes / 1024 / 1024
    // console.log('mem', result)

    // End
    try {
        await page.close()
        await browser.close()
    } catch (error) {
        console.error("ERROR closing page", error)
    }

    await server.stop(true)
}


main()
