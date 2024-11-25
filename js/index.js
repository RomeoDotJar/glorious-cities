const version = 'v1.4.2';
console.log(version);

const app = new PIXI.Application()
await app.init({
    width: window.innerWidth,
    height: 0,
    backgroundAlpha:0,
    resolution: 1
});
//console.log(document.body.getElementsByClassName('canvas'))
document.body.getElementsByClassName('canvas')[0].appendChild(app.canvas);

function w(f) {
    return app.canvas.width*f
}
function h(f) {
    return app.canvas.height*f
}
function s(f) {
    return Math.min(app.canvas.height, app.canvas.width)*f
}

function setup(sprite,parent) {
    if (sprite.anchor!==undefined)
        sprite.anchor.set((.5,.5));
    parent.addChild(sprite);
}

const fnts = ['Futura PT','Verdana','Arial'];

await PIXI.Assets.load('img/ball.png');
await PIXI.Assets.load('img/city/bg.png');

await PIXI.Assets.load('img/arrow.png');
await PIXI.Assets.load('img/arrow0.png');

await PIXI.Assets.load('fnt/futurapt/FuturaPT-Medium.ttf');

//let ball = PIXI.Sprite.from('img/ball.png');
//setup(ball,app.stage);

let cities=[];
let sprites=[];
let mirrorsprites=[];
let cursor = 0;

let iconSize = [0,0];

function styleCity(city,root) {

    let bg = root.getChildByName('bg');
    let icon = root.getChildByName('icon');

    iconSize = [s(.36),s(.49)];
    bg.width = iconSize[0];
    bg.height = iconSize[1];
    bg.tint = 0xFFFFFF;

    let k = .75;
    if (city["code"]==='rostov') {
        k=.98;
    }
    icon.width = bg.width*k;
    icon.height = bg.height*k;
    
    root.x=w(.5);
    root.y=h(1);
}

function loadCity(city,array) {
    // SPRITE CREATION FOR EACH CITY

    let root = new PIXI.Container();

    let bg = PIXI.Sprite.from('img/city/bg.png');

    let iconPath = 'img/city/'+city["code"]+'.png';
    PIXI.Assets.load(iconPath).then((texture) => {
        let icon = PIXI.Sprite.from(iconPath);
    
        icon.name='icon';
        bg.name='bg';

        setup(bg,root);
        setup(icon,root);

        styleCity(city, root);
    });
    
    setup(root,app.stage);

    root.eventMode = 'dynamic';
    root.hovered=false;
    root.held=false;
    root.heldTime = 0;
    root.clicks=0;
    root.on('pointerover', (event) => {
        root.hovered=true;
    });
    root.on('pointerout', (event) => {
        root.hovered=false;
    });
    root.on('pointerdown', (event) => {
        root.held=true;
        root.heldTime=elapsed;
    });
    root.on('pointerup', (event) => {
        if (root.hovered && root.held && elapsed-root.heldTime < .25)
            root.clicks++;
        root.held=false;
    });
    root.on('pointerupoutside', (event) => {
        root.hovered=false;
        root.held=false;
    });

    array.push(root);
}

function load(data) {
    cities = data;
    cursor = 0;

    cities.map((city) => { loadCity(city,sprites) });
    cities.map((city) => { loadCity(city,mirrorsprites) });
}

let ticks = 0;
let elapsed = 0;

let cityfocus;
let ifocus = -1;

let rotation = 0;

function rotate(x) {
    rotation += 1;
    cursor+=x;
    if (cities.length<=0) {
        cursor=0; return;
    }
    while (cursor<=-cities.length) cursor+=cities.length*2;
    while (cursor>=cities.length) cursor-=cities.length*2;

    pick(cursor);
}

let card = document.getElementById('card-overlay');

function pick(cursor) {
    let newi = Math.round(cursor);
    cursor=newi;

    if (newi===ifocus) {
        return;
    }
    
    ifocus = newi;

    if (cityfocus) {
        let section = document.getElementById(cityfocus['code']);
        if (section)
            section.style.display='none';
    }
        
    cityfocus = cities.at(ifocus%cities.length);
    let section = document.getElementById(cityfocus['code']);
    
    if (section)
        section.style.display='block';
}

function popup() {
    return;
    //let section = document.getElementById(cityfocus['code']);

    //section.scrollIntoView({behavior: "smooth", block: "nearest", inline: "start"});
}

// GUI
let FTSZ = 48;
let ftsz = FTSZ;

let arrowLeft = PIXI.Sprite.from('img/arrow.png');
let arrowRight = PIXI.Sprite.from('img/arrow0.png');

let citynameT = new PIXI.Text({
    text: '',
    style: {
        fontFamily: 'Futura PT',
        fontSize: FTSZ,
        align: 'center'
    }
});

let bgG = new PIXI.Graphics();
bgG.rect(0,0,1,1);
bgG.fill(0x000000,.02);
bgG.zIndex=-100;

let citynameBgG = new PIXI.Graphics();
citynameBgG.rect(-1,-1,2,2);
citynameBgG.fill(0xffffff);

setup(bgG,app.stage);
setup(citynameBgG,app.stage);

setup(citynameT,app.stage);

setup(arrowLeft,app.stage);
setup(arrowRight,app.stage);

// EVENTS
//setInterval(()=>{rotate(1)},500);

arrowLeft.on('pointerdown', (event) => {
    rotate(-1);
});
arrowLeft.eventMode='static';

arrowRight.on('pointerdown', (event) => {
    rotate(1);
});
arrowRight.eventMode='static';

app.stage.eventMode='static';
app.stage.on('pointerdown', (event) => {
    swiping=true;
});
app.stage.on('pointerupoutside', (event) => {
    swiping=false;
});
app.stage.on('pointerup', (event) => {
    swiping=false;
});
app.stage.on('pointermove', (event) => {
    if (swiping) {
        scrollBy({top:-event.movement.y});
        rotate(-event.movement.x/w(.15));
    }
});

// CONTROLS
let holding = false;

let swiping = false;

let timeFocused=0;

// SIZES
const scales = [1.5, .6];
const ys = [.38, .7];
const offsets = [.88, .5];

const maxDist = 2;

app.stage.sortableChildren = true;

app.ticker.add((ticker) => {
    let focused = document.hasFocus();
    let d = Math.min(1/ticker.FPS*2, ticker.deltaTime/ticker.FPS);
    elapsed += d;
    if (focused)
        timeFocused+=d;
    else
        timeFocused=0;
    ticks++;

    bgG.scale.x = w(1);
    bgG.scale.y = h(1);

    arrowLeft.x=w(.5)-iconSize[0];
    arrowLeft.y=h(.3);

    arrowRight.x=w(.5)+iconSize[0];
    arrowRight.y=h(.3);
    
    if (sprites.length<=0) return;
    if (cityfocus===undefined) cityfocus=cities.at(0);

    let inaccuracy = cursor%1;
    if (inaccuracy !== 0 && !swiping) {
        cursor += (ifocus-cursor)*d;
    }

    let text = cityfocus['name'];

    citynameT.x=w(.5);
    citynameT.y=h(.85);
    citynameT.text=text;
    citynameT.style.groupColor = 0x000000;

    citynameBgG.x=w(.5);
    citynameBgG.y=h(.87);
    citynameBgG.scale.x=ftsz/3.75 * citynameT.text.length;
    citynameBgG.scale.y=ftsz/2;
    citynameBgG.tint = 0xFFFFFF;

    for (let i = -sprites.length; i<sprites.length; i++) {
        let pos = i-cursor;

        while (pos<-sprites.length) pos+=sprites.length*2;
        while (pos>=sprites.length) pos-=sprites.length*2;
        
        let dist = Math.abs(pos);

        let root;
        if (i<0)
            root = mirrorsprites.at(i);
        else
            root = sprites.at(i);
        root.zIndex = -dist;

        let scale = scales[1];
        let ymargin = ys[1];
        let offset = offsets[1];

        let bg = root.getChildByName('bg');
        if (bg===undefined || bg===null) continue;

        bg.tint = 0xFFFFFF;

        let bgy=s(.02);
        let bgheight=iconSize[1];

        if (dist<maxDist) {
            let f = Math.sqrt(1-dist/2);

            scale = scale*(1-f) + scales[0]*f;
            ymargin = ymargin*(1-f) + ys[0]*f;
            offset = offset*(1-f) + offsets[0]*f;
        }

        let x=root.x;
        let y=root.y;
        
        if (dist-.2<=maxDist) {
            x = w(.5)+pos*Math.min(w(offset)/1.6,h(offset));
            y = (s(ymargin)+h(ymargin))/2;
        }
        else {
            if (dist-1>maxDist)
                x = w(1)-x;
            y = h(dist/maxDist)+bg.height*1.2;
            scale = 1/dist;
        }

        if (root.hovered && focused) {
            scale *= 1.1;

            if (root.held) {
                scale*=.75;
            }
        }
        
        if (root.clicks>0) {

            if (dist<1) {
                pick(i%cities.length);
                popup();
            }
            else {
                rotate(pos);
            }

            root.clicks--;
        }
        
        if (focused) {
            root.x += d*(x-root.x)*8;
            root.y += d*(y-root.y)*4;
            root.scale.x += d*(scale-root.scale.x)*4;
            root.scale.y += d*(scale-root.scale.y)*4;
    
            bg.height += d*(bgheight-bg.height)*8;
            bg.y += d*(bgy-bg.y)*16;
        }
        else {
            root.x=x;root.y=y;
            root.scale=scale;
            bg.height=bgheight;bg.y=bgy;
        }

        root.scale.x = Math.max(0, Math.min(1.8, root.scale.x));
        root.scale.y = Math.max(0, Math.min(1.8, root.scale.y));
        root.y = Math.min(h(2), root.y);
    }
});
    
fetch("json/citydata.json").then((res) => {
    if (!res.ok)
        throw new Error(res.status);
    return res.json();
}).then((data) => {
    load(data);
    rotate(Math.floor(Math.random()*cities.length));
}).catch((error) => {
    throw new Error(error);
});

function updateSize() {
    app.renderer.resize(window.innerWidth,Math.min(window.innerWidth*1.2,window.innerHeight)/1.5);

    let i = 0;
    sprites.map((item) => {
        styleCity(cities[i],item);
        styleCity(cities[i],mirrorsprites[i]);
        i++;
    });

    let arrowSize = s(.12);
    arrowLeft.width=arrowSize;
    arrowLeft.height=arrowSize;
    arrowRight.width=arrowSize;
    arrowRight.height=arrowSize;

    ftsz = FTSZ * w(1) / 1920 / 3 + FTSZ/1.5;
    citynameT.style.fontSize=ftsz;
}
updateSize();
app.canvas.onresize = (event) => {
}
window.onresize = (event) => {
    updateSize();
}