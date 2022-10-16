var OFFSET = 20;
var DIMENSION = 800;
var STEP = 40;
var RADIUS = 10;
var LINE_WIDTH = 5;
var CENTER = DIMENSION / 2;
var GRID_COLOR = '#d3d3d3';
var Vector2 = /** @class */ (function () {
    function Vector2(x, y) {
        this.x = x;
        this.y = y;
    }
    return Vector2;
}());
var Circle = /** @class */ (function () {
    function Circle(v, radius, color) {
        this.isPressed = false;
        this.isHovered = false;
        this.v = v;
        this.radius = radius;
        this.color = color;
    }
    Circle.prototype.update = function (v) {
        this.v = v;
    };
    return Circle;
}());
var Board = /** @class */ (function () {
    function Board(dimension, step) {
        this.dimension = dimension;
        this.step = step;
    }
    return Board;
}());
var BezierCanvas = /** @class */ (function () {
    function BezierCanvas(canvas, board, circles) {
        var _this = this;
        this.cursor = 'default';
        this.board = board;
        this.circles = circles;
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = this.canvas.height = this.board.dimension;
        this.canvas.onmousedown = function (e) { return _this.onMouseDown(e); };
        this.canvas.onmousemove = function (e) { return _this.onMouseMove(e); };
        this.canvas.onmouseup = function (e) { return _this.onMouseUp(e); };
    }
    BezierCanvas.prototype.onMouseDown = function (e) {
        for (var _i = 0, _a = this.circles; _i < _a.length; _i++) {
            var circle = _a[_i];
            circle.isPressed = circle.isHovered;
        }
    };
    BezierCanvas.prototype.onMouseMove = function (e) {
        var rect = this.canvas.getBoundingClientRect();
        var mouseX = e.clientX - rect.left;
        var mouseY = e.clientY - rect.top;
        for (var _i = 0, _a = this.circles; _i < _a.length; _i++) {
            var circle = _a[_i];
            var dx = mouseX - circle.v.x;
            var dy = mouseY - circle.v.y;
            var insideCircle = Math.sqrt(dx * dx + dy * dy) < RADIUS;
            circle.isHovered = insideCircle;
            if (circle.isPressed) {
                circle.update(new Vector2(mouseX, mouseY));
            }
        }
        this.cursor = this.circles.some(function (c) { return c.isHovered; }) ? 'pointer' : 'default';
        this.render();
    };
    BezierCanvas.prototype.onMouseUp = function (e) {
        for (var _i = 0, _a = this.circles; _i < _a.length; _i++) {
            var circle = _a[_i];
            circle.isPressed = false;
        }
    };
    BezierCanvas.prototype.render = function () {
        this.clearScreen();
        this.renderCursor();
        this.renderBoard();
        this.renderCircles();
        this.connectCircles();
    };
    BezierCanvas.prototype.clearScreen = function () {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };
    BezierCanvas.prototype.renderCursor = function () {
        this.canvas.style.cursor = this.cursor;
    };
    BezierCanvas.prototype.renderBoard = function () {
        for (var i = 0; i <= this.board.dimension; i += this.board.step) {
            this.drawLine(new Vector2(i, 0), new Vector2(i, this.board.dimension), GRID_COLOR);
        }
        for (var i = 0; i <= this.board.dimension; i += this.board.step) {
            this.drawLine(new Vector2(0, i), new Vector2(this.board.dimension, i), GRID_COLOR);
        }
    };
    BezierCanvas.prototype.renderCircles = function () {
        for (var _i = 0, _a = this.circles; _i < _a.length; _i++) {
            var circle = _a[_i];
            this.ctx.beginPath();
            this.ctx.arc(circle.v.x, circle.v.y, circle.radius, 0, 2 * Math.PI, false);
            this.ctx.fillStyle = circle.color;
            this.ctx.fill();
            this.ctx.stroke();
        }
    };
    BezierCanvas.prototype.connectCircles = function () {
        var redCircle = this.circles[0];
        var blueCircle = this.circles[1];
        var greenCircle = this.circles[2];
        this.drawLine(redCircle.v, blueCircle.v, 'white', 2);
        this.drawLine(blueCircle.v, greenCircle.v, 'white', 2);
        var prevV = null;
        for (var t = 0; t <= 1; t += 0.05) {
            var l1 = this.lerp(redCircle.v, blueCircle.v, t);
            var l2 = this.lerp(blueCircle.v, greenCircle.v, t);
            var l3 = this.lerp(l1, l2, t);
            if (prevV) {
                this.drawLine(prevV, l3, 'red', 2);
            }
            prevV = new Vector2(l3.x, l3.y);
        }
    };
    BezierCanvas.prototype.lerp = function (v1, v2, t) {
        var x = v1.x + (v2.x - v1.x) * t;
        var y = v1.y + (v2.y - v1.y) * t;
        return new Vector2(x, y);
    };
    BezierCanvas.prototype.drawLine = function (originV, destV, color, lineWidth) {
        if (lineWidth === void 0) { lineWidth = 1; }
        this.ctx.beginPath();
        this.ctx.moveTo(originV.x, originV.y);
        this.ctx.lineTo(destV.x, destV.y);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.stroke();
    };
    return BezierCanvas;
}());
function main() {
    var canvas = document.querySelector('canvas');
    var circles = [
        new Circle(new Vector2(CENTER - (STEP * 3), CENTER + (STEP * 3)), RADIUS, 'red'),
        new Circle(new Vector2(CENTER, CENTER - STEP * 3), RADIUS, 'blue'),
        new Circle(new Vector2(CENTER + (STEP * 3), CENTER + (STEP * 3)), RADIUS, 'green')
    ];
    var board = new Board(DIMENSION, STEP);
    var bezierCanvas = new BezierCanvas(canvas, board, circles);
    bezierCanvas.render();
}
main();
