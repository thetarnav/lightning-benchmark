import * as pw from 'playwright-core'


const CPU_THROTTLING = 20
const URL            = 'http://localhost:5173'


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
    await page.goto(URL, {waitUntil: 'networkidle'})
    console.log(`Website ${URL} loaded`)

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
}


main()
