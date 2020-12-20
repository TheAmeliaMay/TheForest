//get the canvas and context
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var width = height = scale = playerSize = blockSize = time = 0;
var paused = false;
const berryTime = 20000;
const treeTime = 50000;

//depletion rates
const dehydration = 0.001;
const thirst = 0.01;
const hunger = 0.0075;
const cooling = 0.005;

//colors
const bgColor = '#000000'; //black
const invColor = '#00000055'; //black, clear

const playerColor = '#FF6A00'; //orange
const playerArmColor = '#E25A00'; //dark orange

const bushColor = '#004C03'; //darker green
const dryBushColor = '#6D4C03'; //dark yellow

const woodColor = '#AD6929'; //brown
const waterColor = '#2840B7'; //dark blue

const thirstColor = '#5972FF'; //blue
const foodColor = '#FF0000'; //red
const warmthColor = '#FF6A00'; //orange

const fireColors = [
    '#FF0000', //red
    '#FF6A00', //orange
    '#FF8F00', //gold
    '#FFD800', //yellow
    '#404040' //gray
];
const blockColors = [
    '#007A0C', //green
    '#008206', //light green
    '#007007' //dark green
];
const berryColors = [
    '#FF0000', //red
    '#5972FF' //blue
];

//keys
const defaultKeys = {
    'up': 87,
    'down': 83,
    'left': 65,
    'right': 68,
    'interact': 32,
    'water': 82,
    'drink': 84,
    'eat': 69,
    'pause': 80,
    'plant': 70
}

var keys = defaultKeys;

//to help with key remapping
const keyNames = {
    'up': 38,
    'down': 40,
    'left': 37,
    'right': 39,
    'enter': 13,
    'backspace': 8,
    'delete': 46,
    'control': 17,
    'alt': 18,
    'home': 36,
    'end': 35,
    'page up': 33,
    'page down': 34
}

var currentKeys = [];
var keysJustUp = [];

function remapKey(f) {
    //ask the user for a key
    var key = prompt(f, String.fromCharCode(keys[f]));

    //if they hit cancel: quit
    if (key === null) { return }

    //if using a keyName
    if (within(Object.keys(keyNames), key.toLowerCase())) {
        keyCode = keyNames[key];
    //if a key was entered
    } else {
        //make sure it's only one character
        if (key.length > 1) {
            alert('Invalid key!');
            return;
        }
        key = key.toUpperCase();
        keyCode = key.charCodeAt(0);
    }

    //set the key
    keys[f] = keyCode;
    document.getElementById(f + '_key').innerHTML = key.toUpperCase() + ':';
}

function resetKeys() {
    keys = defaultKeys;
}

//return the correct pixel size, dependent on the scale
function px(size) {
    return Math.round(size * scale);
}

//check if a variable is present within an array
function within(a, v) {
    if (a.indexOf(v) >= 0) {
        return true;
    }

    return false;
}

//check if two objects are overlapping
function collide(a, b) {
    if (a.x + a.w > b.x && a.x < b.x + b.w && a.y + a.h > b.y && a.y < b.y + b.h) {
        return true;
    }

    return false;
}

//return a random variable from a list
function randChoice(a) {
    return a[Math.floor(Math.random() * a.length)];
}

//choose a random berryColor
const berryColor = randChoice(berryColors);

//fill a rectangle
function fillRect(color, x, y, w, h) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

//fill a triangle
function fillTri(color, x, y, w, h) {
    var path = new Path2D();
    path.moveTo(x, y);
    path.lineTo(x + (w / 2), y + h);
    path.lineTo(x - (w / 2), y + h);

    ctx.fillStyle = color;
    ctx.fill(path);
}

function fillText(text, x, y, textAlign='center', bLine='middle', size=30, color='#ffffff') { //color is white
    ctx.font = size.toString() + 'px Georgia';
    ctx.textAlign = textAlign;
    ctx.textBaseline = bLine;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

//return a string telling you the time
function readableTime() {
    var seconds = Math.floor(time / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);

    //handle roll overs
    seconds -= minutes * 60;
    minutes -= hours * 60;
    hours -= days * 24;
    
    return days.toString() + '.' + hours.toString() + '.' + minutes.toString() + '.' + seconds.toString();
}

//holds an x, y, w, and h
class Dummy {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
}

//holds items
class Inventory {
    constructor(berries=0, wood=0, water=0) {
        this.x = width - px(300);
        this.y = 0;
        this.w = px(300);
        this.h = px(70);

        this.items = {
            'berries': berries,
            'wood': wood,
            'water': water
        };

        this.max = {
            'berries': 99,
            'wood': 25,
            'water': 1
        }
    }

    has(item, n=1) {
        if (this.items[item] === undefined) {
            return false;
        } else if (this.items[item] >= n) {
            return true;
        }
        return false;
    }

    remove(item, n=1) {
        if (this.items[item] === undefined) {
            this.items[item] = 0;
        } else {
            this.items[item] -= n;
        }
    }

    give(item, n=1) {
        if (this.items[item] === undefined) {
            this.items[item] = n;
        } else {
            this.items[item] += n;
        }

        if (this.items[item] > this.max[item]) {
            this.items[item] = this.max[item];
        }
    }

    draw() {
        //draw the background
        fillRect(invColor, this.x, this.y, this.w, this.h);

        //draw each item

        //berries
        var _ = new Dummy(this.x + px(10), this.y + px(10), blockSize, blockSize);
        fillRect(berryColor, _.x, _.y, _.w, _.h);

        fillText(this.items['berries'].toString(), _.x + _.w / 2, _.y + _.h / 2 - px(10)); //ammount
        fillText('Berries', _.x + _.w / 2, _.y + _.h / 2 + px(12), 'center', 'middle', 12);//label

        //wood
        var _ = new Dummy(this.x + px(10) + blockSize * 2, this.y +  px(10), blockSize, blockSize);
        fillRect(woodColor, _.x, _.y, _.w, _.h);

        fillText(this.items['wood'].toString(), _.x + _.w / 2, _.y + _.h / 2 - px(10)); //ammount
        fillText('Wood', _.x + _.w / 2, _.y + _.h / 2 + px(12), 'center', 'middle', 12);//label

        //water
        var _ = new Dummy(this.x + px(10) + blockSize * 4, this.y +  px(10), blockSize, blockSize);
        fillRect(waterColor, _.x, _.y, _.w, _.h);

        fillText(this.items['water'].toString(), _.x + _.w / 2, _.y + _.h / 2 - px(10)); //ammount
        fillText('Water', _.x + _.w / 2, _.y + _.h / 2 + px(12), 'center', 'middle', 12);//label
    }
}

class Player {
    constructor() {
        this.w = this.h = playerSize;
        this.x = Math.round((width / 2) - (this.w / 2)) - px(10);
        this.y = Math.round((height / 2) - (this.h / 2)) + px(5);

        this.arm = [
            new Dummy(0, 0, 0 ,0),
            new Dummy(0, 0, 0 ,0)
        ];
        this.inv = new Inventory();

        this.velX = this.velY = 0;
        this.speed = 2;

        this.facing = 'left';
        this.inLiq = false; //in a liquid
        this.color = playerColor;
        this.armColor = playerArmColor;

        //vitals
        this.waterAmnt = 100; //percent
        this.foodAmnt = 100; //percent
        this.warmthAmnt = 100; //percent
        this.dead = false;
    }

    setVel(x, y=0) {
        this.velX = x * this.speed;
        this.velY = y * this.speed;
    }

    setFacing(value) {
        if (!paused && !this.dead) {
            this.facing = value;
        }
    }

    draw() {
        //draw the square
        fillRect(this.color, this.x, this.y, this.w, this.h);

        //get the arm's x and y
        if (this.facing == 'up' || this.facing == 'down') {
            this.arm[0].w = this.arm[1].w = Math.round(this.w / 5);
            this.arm[0].h = this.arm[1].h = this.h;
            this.arm[0].x = this.x + blockSize;
            this.arm[1].x = this.x - this.arm[1].w;

            if (this.facing == 'up') {
                this.arm[0].y = this.y - Math.round(blockSize / 3);
                this.arm[1].y = this.y - Math.round(this.arm[1].h / 3);
            } else {
                this.arm[0].y = this.y + Math.round(blockSize / 3);
                this.arm[1].y = this.y + Math.round(this.arm[1].h / 3);
            }
            
        } else if (this.facing == 'right' || this.facing == 'left') {
            this.arm[0].h = this.arm[1].h = Math.round(this.h / 5);
            this.arm[0].w = this.arm[1].w = this.w;
            this.arm[0].y = this.y + blockSize;
            this.arm[1].y = this.y - this.arm[1].h;
            
            if (this.facing == 'left') {
                this.arm[0].x = this.x - Math.round(blockSize / 3);
                this.arm[1].x = this.x - Math.round(this.arm[1].w / 3);
            } else {
                this.arm[0].x = this.x + Math.round(blockSize / 3);
                this.arm[1].x = this.x + Math.round(this.arm[1].w / 3);
            }
        }
        
        //draw the arms
        fillRect(this.armColor, this.arm[0].x, this.arm[0].y, this.arm[0].w, this.arm[0].h);
        fillRect(this.armColor, this.arm[1].x, this.arm[1].y, this.arm[1].w, this.arm[1].h);

        //draw the vitals area
        var barW = px(300);
        var labelColors = ['#ffffff', '#ffffff', '#ffffff'];
        if (this.waterAmnt < 50 && Math.round(this.waterAmnt) % 2 == 0) { labelColors[0] = '#000000' }
        if (this.foodAmnt < 50 && Math.round(this.foodAmnt) % 2 == 0) { labelColors[1] = '#000000' }
        if (this.warmthAmnt < 50 && Math.round(this.warmthAmnt) % 2 == 0) { labelColors[2] = '#000000' }

        fillRect(invColor, 0, height - px(60), barW, px(60));

        //draw the vitals bars
        fillRect(thirstColor, 0, height - px(20), barW * (this.waterAmnt / 100), px(20));
        fillRect(foodColor, 0, height - px(40), barW * (this.foodAmnt / 100), px(20));
        fillRect(warmthColor, 0, height - px(60), barW * (this.warmthAmnt / 100), px(20));

        //draw labels
        fillText('Water', px(10), height - px(10), 'left', 'middle', 20, labelColors[0]);
        fillText('Food', px(10), height - px(30), 'left', 'middle', 20, labelColors[1]);
        fillText('Warmth', px(10), height - px(50), 'left', 'middle', 20, labelColors[2]);
    }

    update() {
        //decrease vitals
        this.waterAmnt -= thirst;
        this.foodAmnt -= hunger;

        if (this.inLiq) {
            this.warmthAmnt -= cooling * 2;
        } else {
            this.warmthAmnt -= cooling;
        }

        //check if near fire
        if (campFire.lit && collide(new Dummy(this.x - this.w, this.y - this.h, this.w * 3, this.h * 3), campFire)) {
            //increase warmth by 4x the cooling rate
            this.warmthAmnt += cooling * 4;

            //make sure the warmthAmnt never goes above 100
            if (this.warmthAmnt > 100) {
                this.warmthAmnt = 100;
            }
        }

        //make sure the player is still alive
        if (this.waterAmnt <= 0) {
            this.dead = true;
            alert('You died of thirst! Tip: you can drink water from the pond.');
        } else if (this.foodAmnt <= 0) {
            this.dead = true;
            alert('You died of starvation! Tip: you can pick berries from the bushes.');
        } else if (this.warmthAmnt <=0) {
            this.dead = true;
            alert('You died of hypothermia! Tip: stand by the fire to recover warmth.')
        }

        //check if in a liquid
        this.inLiq = false;
        for (let i = 0; i < liquids.length; i++) {
            if (collide(liquids[i], this)) {
                this.inLiq = true;
                break;
            }
        }

        //half velocity if in liquid
        if (this.inLiq) {
            this.velX = Math.round(this.velX / 2);
            this.velY = Math.round(this.velY / 2);
        }

        //apply velocity
        this.x += this.velX;
        this.y += this.velY;

        //prevent collision with campFire or any trees
        if (collide(this, campFire)) {
            this.x += this.velX * -5;
            this.y += this.velY * -5;
        }

        for (let i = 0; i < trees.length; i++) {
            let tree = trees[i];
            if (collide(this, tree)) {
                this.x += this.velX * -5;
                this.y += this.velY * -5;
            }
        }

        //reset velocity
        this.velX = this.velY = 0;

        //make sure x and y are valid
        if (this.x < 0) { this.x = 0 } else if (this.x + this.w > width) { this.x = width - this.w }
        if (this.y < 0) { this.y = 0 } else if (this.y + this.h > height) { this.y = height - this.h }
    }

    facingLiq() {
        for (let i = 0; i < liquids.length; i++) {
            if (collide(this.getFace(), liquids[i])) { return true }
        }
        return false;
    }

    drink() {
        if (this.waterAmnt > 75) { return }

        if (this.inLiq || this.facingLiq()) {
            this.waterAmnt += 25; //replenish 1/4
        } else if (this.inv.has('water')) {
            this.inv.remove('water');
            this.waterAmnt += 25; //replenish 1/4
        } else { return; }

        //make sure the waterAmnt never goes over 100
        if (this.waterAmnt > 100) {
            this.waterAmnt = 100;
        }
    }

    eat() {
        if (this.foodAmnt > 90) { return }

        if (this.inv.has('berries')) {
            this.inv.remove('berries');
            this.foodAmnt += 10; //replenish 10%
        }

        //make sure the foodAmnt never goes over 100
        if (this.foodAmnt > 100) {
            this.foodAmnt = 100;
        }
    }

    getFace() {
        if (this.facing == 'up') {
            var x = this.x;
            var y = this.y - this.h;
        } else if (this.facing == 'right') {
            var x = this.x + this.w;
            var y = this.y;
        } else if (this.facing == 'down') {
            var x = this.x;
            var y = this.y + this.h;
        } else if (this.facing == 'left') {
            var x = this.x - this.w;
            var y = this.y;
        }

        return new Dummy(x, y, this.w, this.h);
    }
}

class Fire {
    constructor(x, y, colors=fireColors) {
        this.x = x;
        this.fullY = this.y = y;
        this.w = this.h = blockSize;

        this.colors = colors;
        this.color = colors[0];

        this.maxFuel = 5000;
        this.fuel = 5000;
        this.lit = true;
    }

    draw() {
        //fillRect(this.color, this.x, this.y, this.w, this.h);

        //draw the fire
        fillTri(this.color, this.x + this.w / 2, this.y, this.w, this.h);

        //draw the wood
        fillRect(woodColor, this.x, this.fullY + blockSize / 3 * 2, this.w, blockSize / 3);
    }

    update() {
        var fuelPercent = this.fuel / this.maxFuel;

        if (Math.floor(fuelPercent * this.colors.length) == 0) {
            this.lit = false;
        } else {
            this.lit = true;
        }

        this.color = this.colors[this.colors.length - 1 - Math.floor(fuelPercent * this.colors.length)];
        this.h = blockSize * fuelPercent;
        this.y = this.fullY - this.h + blockSize;

        if (this.fuel > 0) {
            this.fuel --;
        }

        //create embers
        if (this.fuel % 20 == 0 && fuelPercent >= 0.2) {
            particles.push(new Particle(this.x + (Math.random() * this.w), this.fullY + (Math.random() * (blockSize / 3 * 2)),
                blockSize / 10, blockSize / 10, this.color, 100));
        }

        //create smoke
        if (this.fuel % 50 == 0 && fuelPercent >= 0.2) {
            particles.push(new Particle(this.x + (Math.random() * this.w), this.fullY - blockSize + (Math.random() * ((blockSize * 2) / 3 * 2)),
                blockSize / (2 + (Math.random() * 2)), blockSize / (2 + (Math.random() * 2)), invColor, 500));
        }
    }

    addFuel(n=1) {
        if (this.fuel < this.maxFuel - 500) {
            if (player.inv.has('wood')) {
                player.inv.remove('wood');
                this.fuel += n * 500;
                if (this.fuel > this.maxFuel) {
                    this.fuel = this.maxFuel;
                }
                particles.push(new Particle(this.x + (Math.random() * this.w), this.fullY + (Math.random() * (blockSize / 3 * 2)),
                    blockSize / 5, blockSize / 5, woodColor, 100));
            }
        }
    }

    water() {
        if (this.fuel > 0) {
            if (player.inv.has('water')) {
                player.inv.remove('water');
                this.fuel -= 500;
                if (this.fuel < 0) {
                    this.fuel = 0;
                }
            }
        }
    }
}

class Bush {
    constructor(x, y, age=berryTime, fullAge=berryTime, bColor=berryColor) {
        this.x = x;
        this.y = y;
        this.w = this.h = blockSize;

        this.color = bushColor;
        this.berryColor = bColor;

        this.age = age;
        this.fullAge = fullAge;
        this.berries = 0;
        this.waterAmnt = 100; //percent

        this.dead = false;
    }

    draw() {
        if (this.dead) { return }

        //draw the bush
        if (this.waterAmnt >= 50) {
            var color = this.color;
        } else {
            var color = dryBushColor;
        }

        fillRect(color, this.x, this.y, this.w, this.h);

        //draw the berries
        if (this.berries > 0) {
            var berryOffset = (this.w / 5);
            fillRect(this.berryColor, this.x + berryOffset, this.y + berryOffset, berryOffset, berryOffset);

            if (this.berries > 1) {
                fillRect(this.berryColor, this.x + this.w - (berryOffset * 2), this.y + this.h - (berryOffset * 3), berryOffset, berryOffset);
            }

            if (this.berries > 2) {
                fillRect(this.berryColor, this.x + Math.round(berryOffset * 1.5), this.y + this.h - (berryOffset * 2), berryOffset, berryOffset);
            }
        }
    }

    update() {
        this.waterAmnt -= dehydration;
        if (this.waterAmnt <= 0) {
            this.dead = true;
        }

        if (this.dead) { return }

        if (this.age < this.fullAge && this.waterAmnt >= 50) {
            this.age ++;
        }

        if (this.waterAmnt >= 30) {
            this.berries = Math.floor(this.age / this.fullAge * 3);
        } else {
            this.berries = 0;
            this.age = 0;
        }
    }

    pickBerry() {
        if (this.dead) { return }

        if (this.berries > 0) {
            this.age -= Math.round(this.fullAge / 3);
            this.berries = Math.floor(this.age / this.fullAge * 3);
            player.inv.give('berries');
        }
    }

    water() {
        if (this.dead) { return }

        if (player.inv.has('water')) {
            player.inv.remove('water');
            this.waterAmnt = 100;
        }
    }
}

class Block {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.w = this.h = blockSize;

        this.color = color;
    }

    draw() {
        fillRect(this.color, this.x, this.y, this.w, this.h);
    }
}

class Liquid {
    constructor(x, y, color=waterColor) {
        this.x = x;
        this.y = y;
        this.w = this.h = blockSize;

        this.color = color;
    }

    draw() {
        fillRect(this.color, this.x, this.y, this.w, this.h);
    }

    collect() {
        player.inv.give('water');
    }

    water() {
        if (player.inv.has('water')) {
            player.inv.remove('water');
        }
    }
}

class Tree {
    constructor(fullX, fullY, age=treeTime, fullAge=treeTime, ) {
        this.x = this.fullX = fullX;
        this.y = this.fullY = fullY;
        this.w = this.h = this.fullW = this.fullH = blockSize;

        this.color = woodColor;
        this.leafColor = bushColor;

        this.age = age;
        this.fullAge = fullAge;
    }

    draw() {
        if (this.age < this.fullAge) {
            this.w = Math.round(this.fullW * (this.age / this.fullAge));
            this.h = Math.round(this.fullH * (this.age / this.fullAge));
            this.x = this.fullX + (this.fullW - this.w) / 2;
            this.y = this.fullY + (this.fullH - this.h) / 2;
        } else {
            this.w = this.fullW;
            this.h = this.fullH;
            this.x = this.fullX;
            this.y = this.fullY;
        }

        //draw the trunk
        fillRect(this.color, this.x, this.y, this.w, this.h);

        //draw the leaves
        fillTri(this.leafColor, this.x + (this.w / 2), this.y - (this.h / 1.5), this.w * 1.5, this.h);
    }

    update() {
        this.age ++;
    }

    harvest() {
        if (this.age > this.fullAge) {
            var n = 3;
        } else {
            var n = Math.ceil((this.age / this.fullAge) * 3);
        }

        //create particles

        for (let i = 0; i < n; i++) {
            particles.push(new Particle(this.x + (Math.random() * this.w), this.fullY + (Math.random() * (blockSize / 3 * 2)),
                blockSize / 5, blockSize / 5, woodColor, 100));
        }

        player.inv.give('wood', n);
        this.age = 0;
    }
}

class Particle {
    constructor(x, y, w, h, color, timer) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;

        this.color = color;
        this.timer = timer;
    }

    update() {
        if (this.timer <= 0) { return }
        this.timer --;
    }

    draw() {
        if (this.timer <= 0) { return }
        fillRect(this.color, this.x, this.y, this.w, this.h);
    }
}

//class arrays
var blocks = blockEntities = trees = bushes = [];
var liquids = [];
var particles = [];

var campFire = player = null;

//called every ms
function update() {
    //check each key
    if (within(keysJustUp, keys['pause'])) {
        if (paused) {
            paused = false;
        } else {
            paused = true;
        }
    } else if (!paused) {

        if (within(currentKeys, keys['up'])){ 
            player.setVel(0, -1);
            player.setFacing('up');
        } else if (within(currentKeys, keys['down'])){ 
            player.setVel(0, 1);
            player.setFacing('down');
        } else if (within(currentKeys, keys['left'])){ 
            player.setVel(-1);
            player.setFacing('left');
        } else if (within(currentKeys, keys['right'])){ 
            player.setVel(1);
            player.setFacing('right');
        }

        _1: if (within(keysJustUp, keys['interact'])) {
            //interact with the campFire
            if (collide(player.getFace(), campFire)) {
                campFire.addFuel();
            } else {
                //interact with a bush
                for (let i = 0; i < bushes.length; i++) {
                    let b = bushes[i];

                    if(collide(player.getFace(), b)) {
                        b.pickBerry();
                        break _1;
                    }
                }

                //interact with a tree
                for (let i = 0; i < trees.length; i++) {
                    let t = trees[i];

                    if(collide(player.getFace(), t)) {
                        t.harvest();
                        break _1;
                    }
                }

                //interact with a liquid
                for (let i = 0; i < liquids.length; i++) {
                    let l = liquids[i];

                    if(collide(player.getFace(), l)) {
                        l.collect();
                        break _1;
                    }
                }
            }
        } else _2: if (within(keysJustUp, keys['water'])) {
            //water the campFire
            if (collide(player.getFace(), campFire)) {
                campFire.water();                    
            } else {
                //water a bush
                for (let i = 0; i < bushes.length; i++) {
                    let b = bushes[i];

                    if(collide(player.getFace(), b)) {
                        b.water();
                        break _2;
                    }
                }

                //water a liquid
                for (let i = 0; i < liquids.length; i++) {
                    let l = liquids[i];

                    if(collide(player.getFace(), l)) {
                        l.water();
                        break _2;
                    }
                }
            }
        } else _3: if (within(keysJustUp, keys['plant'])) {
            if (player.inv.has('berries')) {
                player.inv.remove('berries');

                let x = Math.round(player.x / blockSize) * blockSize;
                let y = Math.round(player.y / blockSize) * blockSize;
                let dummy = new Dummy(x, y, blockSize, blockSize);

                //make sure it doesn't collide with other bushes
                for (let i = 0; i < bushes.length; i++) {
                    if (collide(bushes[i], dummy)) {
                        break _3;
                    }
                }

                //make sure it doesn't collide with trees
                for (let i = 0; i < trees.length; i++) {
                    if (collide(trees[i], dummy)) {
                        break _3;
                    }
                }

                //make sure it isn't in water
                for (let i = 0; i < liquids.length; i ++) {
                    if (collide(liquids[i], dummy)) {
                        break _3;
                    }
                }

                bushes.push(new Bush(x, y, 0));
            }
        } else if (within(keysJustUp, keys['drink'])) {
            player.drink();
        } else if (within(keysJustUp, keys['eat'])) {
            player.eat();
        }
    }

    //reset keysJustUp
    keysJustUp = [];

    if (!paused) {

        time ++;

        //clear the screen
        fillRect(bgColor, 0, 0, width, height);

        //if the player is dead, stop the game
        if (player.dead) { window.location.href = window.location.href; return false; }

        //update the player
        player.update();

        //update the campFire
        campFire.update();

        //destroy all the dead bushes
        for (let i = bushes.length - 1; i > -1; i--) {
            if (bushes[i].dead) {
                bushes.splice(i, 1);
            }
        }

        //update the bushes
        for (let i = 0; i < bushes.length; i++) {
            bushes[i].update();
        }

        //update the trees
        for (let i = 0; i < trees.length; i++) {
            trees[i].update();
        }

        //destroy all the dead particles
        for (let i = particles.length - 1; i > -1; i--) {
            if (particles[i].timer <= 0) {
                particles.splice(i, 1);
            }
        }

        //update the particles
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
        }
    }

    //draw every block
    for (let i = 0; i < blocks.length; i++) {
        blocks[i].draw();
    }

    //draw every liquid
    for (let i = 0; i < liquids.length; i++) {
        liquids[i].draw();
    }

    //draw the bushes
    for (let i = 0; i < bushes.length; i++) {
        bushes[i].draw();
    }

    //draw the campFire
    campFire.draw();

    //draw the player
    player.draw();

    //draw the trees
    for (let i = 0; i < trees.length; i++) {
        trees[i].draw();
    }

    //draw the particles
    for (let i = 0; i < particles.length; i++) {
        particles[i].draw();
    }

    //draw the inventory
    player.inv.draw();

    //show the time in seconds
    fillText('Time:', blockSize / 4, blockSize / 4, 'left', 'top')
    fillText(readableTime(), blockSize / 4, blockSize / 1.25, 'left', 'top')

    if (paused) {
        //darken the screen
        fillRect(invColor, 0, 0, width, height);
    }
}

//called when the user hits a button
function startGame() {
    //make the button invisible
    document.getElementById('startBtn').style.display = 'none';

    //make the canvas visible
    canvas.style.display = 'inline';

    //get the canvas
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    //get the window's width and height
    width = ctx.canvas.clientWidth;
    height = ctx.canvas.clientHeight;

    //get the scale (based on width)
    scale = Math.round(width / 1250);

    //pre-defined px values
    playerSize = blockSize = px(50);

    //draw temporary loading text
    fillText('Loading...', width / 2, height / 2);

    //create the player
    player = new Player();

    //create all the blocks
    for (let x = 0; x < Math.ceil(width / blockSize); x++) {
        for (let y = 0; y < Math.ceil(height / blockSize); y++) {
            blocks.push(new Block(x * blockSize, y * blockSize, randChoice(blockColors)))
        }
    }

    particle = new Block(0, 0, null);

    //create all the water

    //make one big square
    for (let x = 0; x < 6; x++) {
        for (let y = 6; y < Math.ceil(height / blockSize); y++) {
            liquids.push(new Liquid(x * blockSize, y * blockSize));
        }
    }

    //add a line on top
    for (let x = 0; x < 4; x++) {
        liquids.push(new Liquid(x * blockSize, 5 * blockSize));
    }

    //add a line on the side
    for (let y = 9; y < Math.ceil(height / blockSize); y++) {
        liquids.push(new Liquid(6 * blockSize, y * blockSize));
    }

    //add another line on the side
    for (let y = 12; y < Math.ceil(height / blockSize); y++) {
        liquids.push(new Liquid(7 * blockSize, y * blockSize));
    }

    //create all the trees (x14)
    trees = [
        new Tree(blockSize, blockSize * 2),
        new Tree(blockSize * 3, blockSize),
        new Tree(blockSize * 6, blockSize * 3),
        new Tree(blockSize * 9, blockSize),
        new Tree(blockSize * 12, blockSize * 3),
        new Tree(blockSize * 16, blockSize),
        new Tree(blockSize * 9, blockSize * 13),
        new Tree(blockSize * 13, blockSize * 12),
        new Tree(blockSize * 17, blockSize * 10),
        new Tree(blockSize * 20, blockSize * 13),
        new Tree(blockSize * 23, blockSize * 11),
        new Tree(blockSize * 22, blockSize * 6),
        new Tree(blockSize * 23, blockSize * 4),
        new Tree(blockSize * 18, blockSize * 5)
    ];

    //create the campFire
    campFire = new Fire(Math.ceil(width / 2 / blockSize) * blockSize, Math.ceil(height / 2 / blockSize) * blockSize);

    //create all the bushes (x10)
    bushes = [
        new Bush(Math.ceil(width / 2 / blockSize - 3) * blockSize, Math.ceil(height / 2 / blockSize - 2) * blockSize),
        new Bush(blockSize * 3, blockSize * 3),
        new Bush(blockSize * 20, blockSize * 2),
        new Bush(blockSize * 24, blockSize * 9),
        new Bush(blockSize * 16, blockSize * 13)
    ];

    window.onkeydown = function(e){
        if (e.target == document.body && within(Object.values(keys), e.keyCode)) {
            e.preventDefault();
        }

        if (!within(currentKeys, e.keyCode)) {
            currentKeys.push(e.keyCode);
        }
    };

    window.onkeyup = function(e) {
        keysJustUp.push(e.keyCode);
        currentKeys = currentKeys.filter(function(key) {
            return key !== e.keyCode;
        });
    };

    //start the update loop
    setInterval(update, 1);
};