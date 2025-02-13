import {WebGlCoreRenderer} from '@lightningjs/renderer/webgl'
import * as l from '@lightningtv/solid'
import * as s from 'solid-js'

let seed = 12345

function random(): number {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
}

function random_int(min: number, max: number): number {
    return Math.floor(random() * (max - min + 1)) + min
}

function random_color(): string {
    return '0x' + Math.floor(random() * 16777215).toString(16).padEnd(6, '0') + 'FF'
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

    function update() {
        let blocks = []
        for (let step = 0; step < 1000; step++) {
            blocks.push({
                width:        random_int(50, 100),
                height:       random_int(50, 100),
                x:            random_int(0, WIDTH),
                y:            random_int(0, HEIGHT),
                borderRadius: random_int(0, 50),
                color:        random_color(),
            })
        }
        setBlocks(blocks)
    }

    function clear() {
        setBlocks([])
    }

    window.addEventListener('keypress', e => {
        switch (e.key) {
        case 'R':     clear()  ;break
        case 'Enter': update() ;break
        }
    })

    return (
        <l.View style={{color: l.hexColor('#f0f0f0')}}>
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
