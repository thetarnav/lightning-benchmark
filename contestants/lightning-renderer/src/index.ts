import * as l        from '@lightningjs/renderer'
import * as l_webgl  from '@lightningjs/renderer/webgl'
import * as l_canvas from '@lightningjs/renderer/canvas'

declare global {
    interface Window {
        bench: {
            create:      () => void // creating 1000 items
            create_many: () => void // creating 10000 items
            update_all:  () => void // updating all items
            update_some: () => void // updating every 10th item
            select:      () => void // highlighting a selected item
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

function random_color(): number {
    return Math.floor(random() * 16777215) << 8 | 0xFF
}

const HEIGHT = 600
const WIDTH  = 800

let renderer = new l.RendererMain({
    appHeight:                  HEIGHT,
    appWidth:                   WIDTH,
    renderEngine:               l_webgl.WebGlCoreRenderer,
    fontEngines:                [l_canvas.CanvasTextRenderer],
    // Disables splitting texture processing to multiple frames
    textureProcessingTimeLimit: Number.MAX_SAFE_INTEGER,
}, 'app')

let container = renderer.createNode({
    parent: renderer.root,
})

type Item = {
    node: l.INode
    text: l.ITextNode
}

let items: Item[] = []
let selected = 0
let last_id = 0

function make_item(): Item {
    
    let node = renderer.createNode({
        x:      random_int(0, WIDTH  - 50),
        y:      random_int(0, HEIGHT - 50),
        width:  50,
        height: 50,
        color:  random_color(),
        parent: container,
    })

    let text = renderer.createTextNode({
        text:   String(++last_id),
        parent: node,
    })

    return {node, text}
}

function make_items(count: number): Item[] {
    return Array.from({length: count}, make_item)
}

window.bench = {
    create() {
        items = make_items(1000)
    },
    create_many() {
        items = make_items(10000)
    },
    update_all() {
        for (let item of items) {
            item.node.color = random_color()
        }
    },
    update_some() {
        for (let i = 0; i < items.length; i++) {
            if (i % 10 === 0) {
                items[i].node.color = random_color()
            }
        }
    },
    select() {
        let prev = renderer.getNodeById(selected)
        if (prev != null) {
            prev.color = 0xFFFFFFFF
        }
        let item = items[random_int(0, items.length-1)]
        selected = item.node.id
        item.node.color = 0xFF0000FF
    },
    swap() {
        let a = random_int(0, items.length-1)
        let b = random_int(0, items.length-1)
        let item_a = items[a]
        let item_b = items[b]
        items[a] = item_b
        items[b] = item_a
        item_a.node.x = item_b.node.x
        item_a.node.y = item_b.node.y
        item_b.node.x = item_a.node.x
        item_b.node.y = item_a.node.y
    },
    append() {
        items.push(...make_items(1000))
    },
    remove_all() {
        for (let item of items) {
            item.node.parent = null
        }
        items = []
    },
    remove_one() {
        let index = random_int(0, items.length-1)
        let [item] = items.splice(index, 1)
        item.node.parent = null
    },
}

