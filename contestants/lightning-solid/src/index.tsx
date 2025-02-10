import {WebGlCoreRenderer} from '@lightningjs/renderer/webgl'
import * as l from '@lightningtv/solid'
import * as s from 'solid-js'

function random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomColor(): string {
    return '0x' + Math.floor(Math.random() * 16777215).toString(16) + 'FF'
}

const HEIGHT = 600
const WIDTH  = 800

function DirectUpdate(): s.JSX.Element {

    type Block = {
        width:        number,
        height:       number,
        x:            number,
        y:            number,
        borderRadius: number,
        color:        string,
    }

    const [blocks, setBlocks] = s.createSignal<Block[]>([])

    function handleTPress() {
        if (blocks().length === 0) {
            let blocks = []
            for (let step = 0; step < 1000; step++) {
                blocks.push({
                    width:        random(50, 100),
                    height:       random(50, 100),
                    x:            random(0, WIDTH),
                    y:            random(0, HEIGHT),
                    borderRadius: random(0, 50),
                    color:        randomColor(),
                })
            }
            setBlocks(blocks)
        } else {
            // Direct updating
            for (let step = 0; step < 1000; step++) {
                let c = container.children[step]
                c.width   = random(50, 100)
                c.height  = random(50, 100)
                c.x       = random(0, WIDTH)
                c.y       = random(0, HEIGHT)
                c.effects = {radius: {radius: random(0, 50)}}
                c.color   = randomColor()
            }
        }
    }

    const interval = setInterval(() => {
        handleTPress()
    }, 2000)

    s.onCleanup(() => {
        clearInterval(interval)
    })

    let container!: l.ElementNode
    return (
        <l.View ref={container} style={{color: l.hexColor('#f0f0f0')}}>
            <s.Index each={blocks()}>
            {(item) => (
                <node
                    x={item().x}
                    y={item().y}
                    width={item().width}
                    height={item().height}
                    color={item().color}
                    effects={{radius: {radius: item().borderRadius}}}
                />
            )}
            </s.Index>
        </l.View>
    )
}

l.Config.debug = false
l.Config.fontSettings.fontFamily = 'Ubuntu'
l.Config.fontSettings.color = 0xffffffff
l.Config.rendererOptions = {
    //coreExtensionModule: coreExtensionModuleUrl,
    numImageWorkers: 2,
    inspector: false,
    renderEngine: WebGlCoreRenderer,
    fontEngines: [],
    // deviceLogicalPixelRatio: 1
}

l.createRenderer().render(() => <DirectUpdate/>)
