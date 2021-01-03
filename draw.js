//a JavaScript library that makes drawing with <canvas> elements much easier
//created by Amelia May Johnson
//github.com/TheAmeliaMay

//tell the user it's been loaded
console.log('draw.js successfully loaded!');

//global variables
var canvas = null;
var ctx = null;
var draw = null;
var FONT = '20px Arial';

//static colors
const CLEAR = '#00000000';
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const RED = '#FF0000';
const GREEN = '#008000';
const YELLOW = '#FFFF00';
const BLUE = '#0000FF';
const BROWN = '#A52A2A';
const PURPLE = '#800080';
const PINK = '#FFC0CB';
const ORANGE = '#FFA500';
const GRAY = GREY = '#808080';

//dynamic colors
var BGCOLOR = BLACK;

//must be called before any drawing can occur
//should be called only once the entire window has loaded
function init() {
    console.log('draw.js successfully initialized!');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    setInterval(update, 1);
}

//draw a rectangle on the canvas
function rect(fill, x, y, w, h, stroke=CLEAR, line=1) {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = line;

    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
}

//draw a square on the canvas
//simply calls rect
function square(fill, x, y, size, stroke=CLEAR, line=1) {
    rect(fill, x, y, size, size, stroke, line);
}

//draw an equilateral or isosceles triangle on the canvas
function tri(fill, x, y, w, h, stroke=CLEAR, line=1) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (w / 2), y + h);
    ctx.lineTo(x - (w / 2), y + h);
    ctx.lineTo(x, y);
    ctx.closePath();

    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = line;

    ctx.fill();
    ctx.stroke();
}

//draw an equilateral triangle
//simply calls tri
function eqTri(fill, x, y, size, stroke=CLEAR, line=1) {
    tri(fill, x, y, size, size, stroke, line);
}

//draw a right triangle
function riTri(fill, x, y, w, h, stroke=CLEAR, line=1) {
    var path = new Path2D();
    path.moveTo(x, y);
    path.lineTo(x + w, y);
    path.lineTo(x, y + h);
    path.lineTo(x, y);

    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = line;

    ctx.fill(path);
    ctx.stroke(path);
}

//draw an ellipse
function ellip(fill, x, y, rX, rY, stroke=CLEAR, line=1, rot=0, a1=0, a2=2 * Math.PI) {
    ctx.beginPath();
    ctx.ellipse(x, y, rX, rY, rot, a1, a2);

    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = line;

    ctx.fill();
    ctx.stroke();
}

//draw a circle
//simply calls ellip
function circ(fill, x, y, size, stroke=CLEAR, line=1) {
    ellip(fill, x, y, size, size, stroke, line);
}

//draw a polygon
function poly(fill, points, stroke=CLEAR, line=1) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);

    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
    }

    ctx.lineTo(points[0][0], points[0][1]);
    ctx.closePath();

    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = line;

    ctx.fill();
    ctx.stroke();
}

//draw text
function drawTxt(fill, text, x, y, font=FONT, stroke=CLEAR, line=1, align='left', bLine='bottom') {
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = bLine;

    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = line;

    ctx.fillText(text, x, y);
    ctx.strokeText(text, x, y);
}

//called every 1ms
function update() {
    //clear the screen
    rect(BGCOLOR, 0, 0, canvas.width, canvas.height);

    //make sure to define your draw function!
    if (draw === null) {
        console.log('draw function has not been defined!');
    } else {
        draw();
    }
}

//change the background color
function setBGCOLOR(color) {
    BGCOLOR = color;
}

//change the font
function setFONT(font) {
    FONT = font;
}