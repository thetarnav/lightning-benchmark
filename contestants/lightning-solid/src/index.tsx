import * as s             from 'solid-js'
import * as l             from '@lightningtv/solid'
import * as engine_webgl  from '@lightningjs/renderer/webgl'
import * as engine_canvas from '@lightningjs/renderer/canvas'

declare global {
    interface Window {
        bench: {
            create:      () => void // creating 1000 items
            create_many: () => void // creating 10000 items
            update_all:  () => void // updating all items
            update_some: () => void // updating every 10th item
            update_one:  () => void // highlighting a selected item
            swap:        () => void // swap 2 items
            append:      () => void // append 1000 
            remove_one:  () => void // remove one item
            remove_all:  () => void // remove all items
        }
    }
}

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

type Item = {
    id:       string
    x:        number
    y:        number
    color:    s.Accessor<string>
    setColor: s.Setter<string>
}

let last_id = 0

function make_item(): Item {
    const [color, setColor] = s.createSignal(random_color())
    return {
        id: String(++last_id),
        x:  random_int(0, WIDTH  - 50),
        y:  random_int(0, HEIGHT - 50),
        color, setColor,
    }
}

function make_items(count: number): Item[] {
    return Array.from({length: count}, make_item)
}

function App(): s.JSX.Element {

    const [items, setItems] = s.createSignal<Item[]>([])

    window.bench = {
        create() {
            setItems(make_items(1000))
        },
        create_many() {
            setItems(make_items(10000))
        },
        update_all() {
            s.batch(() => {
                for (let item of items()) {
                    item.setColor(random_color())
                }
            })
        },
        update_some() {
            s.batch(() => {
                let arr = items()
                for (let i = 0; i < arr.length; i++) {
                    if (i % 10 === 0) {
                        arr[i].setColor(random_color())
                    }
                }
            })
        },
        update_one() {
            let arr = items()
            arr[random_int(0, arr.length-1)].setColor(random_color())
        },
        swap() {
            let arr = items().slice()
            let a = random_int(0, arr.length-1)
            let b = random_int(0, arr.length-1)
            ;[arr[a], arr[b]] = [arr[b], arr[a]]
            setItems(arr)
        },
        append() {
            setItems(items().concat(make_items(1000)))
        },
        remove_all() {
            setItems([])
        },
        remove_one() {
            let arr = items().slice()
            arr.splice(random_int(0, arr.length-1), 1)
            setItems(arr)
        },
    }

    return (
        <view
            height={HEIGHT}
            width={WIDTH}
        >
            <l.For each={items()}>
            {item => (
                <view
                    x={item.x}
                    y={item.y}
                    width={50}
                    height={50}
                    color={item.color()}
                >
                    <text>{item.id}</text>
                </view>
            )}
            </l.For>
        </view>
    )
}

l.Config.fontSettings.fontFamily = 'sans-serif'
l.Config.fontSettings.fontSize   = 22
l.Config.rendererOptions         = {
    appHeight:       HEIGHT,
    appWidth:        WIDTH,
    numImageWorkers: 2,
    inspector:       false,
    renderEngine:    engine_webgl.WebGlCoreRenderer,
    fontEngines:     [engine_canvas.CanvasTextRenderer],
}

l.createRenderer().render(() => <App/>)
