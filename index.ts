import * as pw from 'playwright'

const browser = await pw.chromium.launch({
    channel:  'chrome',
    headless: true,
})

const page = await browser.newPage()
const context = page.context()

// CPU Throttling
const cdp_session = await context.newCDPSession(page)
await cdp_session.send("Emulation.setCPUThrottlingRate", {rate: 20})

// Test
await page.goto('https://www.example.com')

console.log(await page.title())
await browser.close()
