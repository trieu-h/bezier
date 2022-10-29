var OFFSET = 20;
var DIMENSION = 800;
var STEP = 40;
var RADIUS = 10;
var LINE_WIDTH = 5;
var CENTER = DIMENSION / 2;
var GRID_COLOR = '#d3d3d3';
var BEZIER_CURVE_COLOR = '#FDFDBD';
var OUTER_LINE_COLOR = '#BCCEF8';
var FIRST_LAYER_COLOR = '#FF8DC7';
var SECOND_LAYER_COLOR = '#C47AFF';
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
        this.intervalRef = null;
        this.isAnimating = false;
        this.board = board;
        this.circles = circles;
        this.canvas = canvas;
        this.cursor = 'default';
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = this.canvas.height = this.board.dimension;
        this.canvas.onmousedown = function (e) {
            if (!_this.isAnimating) {
                _this.onMouseDown(e);
            }
            ;
        };
        this.canvas.onmousemove = function (e) {
            if (!_this.isAnimating) {
                _this.onMouseMove(e);
            }
            ;
        };
        this.canvas.onmouseup = function (e) {
            if (!_this.isAnimating) {
                _this.onMouseUp(e);
            }
            ;
        };
    }
    BezierCanvas.prototype.onMouseDown = function (e) {
        for (var _i = 0, _a = this.circles; _i < _a.length; _i++) {
            var circle = _a[_i];
            circle.isPressed = circle.isHovered;
            if (circle.isPressed) {
                return;
            }
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
            this.drawCircle(circle);
        }
    };
    BezierCanvas.prototype.connectCircles = function () {
        var firstCircle = this.circles[0];
        var secondCircle = this.circles[1];
        var thirdCircle = this.circles[2];
        var fourthCircle = this.circles[3];
        this.drawLine(firstCircle.v, secondCircle.v, OUTER_LINE_COLOR, 2);
        this.drawLine(secondCircle.v, thirdCircle.v, OUTER_LINE_COLOR, 2);
        this.drawLine(thirdCircle.v, fourthCircle.v, OUTER_LINE_COLOR, 2);
        var prevV = null;
        var steps = 100;
        // If step is 0.01, we will have floating precision issue
        // Do t/steps like this will prevent it
        for (var t = 0; t <= steps; t += 1) {
            var step = t / steps;
            var l1 = this.lerp(firstCircle.v, secondCircle.v, step);
            var l2 = this.lerp(secondCircle.v, thirdCircle.v, step);
            var l3 = this.lerp(thirdCircle.v, fourthCircle.v, step);
            var ll1 = this.lerp(l1, l2, step);
            var ll2 = this.lerp(l2, l3, step);
            var ll3 = this.lerp(ll1, ll2, step);
            if (prevV) {
                this.drawLine(prevV, ll3, BEZIER_CURVE_COLOR, 2);
            }
            prevV = new Vector2(ll3.x, ll3.y);
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
    BezierCanvas.prototype.drawCircle = function (circle) {
        this.ctx.beginPath();
        this.ctx.arc(circle.v.x, circle.v.y, circle.radius, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = circle.color;
        this.ctx.fill();
        this.ctx.strokeStyle = circle.color;
        this.ctx.stroke();
    };
    BezierCanvas.prototype.animate = function () {
        var _this = this;
        if (this.intervalRef) {
            clearInterval(this.intervalRef);
        }
        ;
        this.isAnimating = true;
        var steps = 100;
        var t = 0;
        this.intervalRef = setInterval(function () {
            t += 1;
            _this.render();
            var step = t / steps;
            var l1 = _this.lerp(_this.circles[0].v, _this.circles[1].v, step);
            _this.drawCircle(new Circle(l1, 8, FIRST_LAYER_COLOR));
            var l2 = _this.lerp(_this.circles[1].v, _this.circles[2].v, step);
            _this.drawCircle(new Circle(l2, 8, FIRST_LAYER_COLOR));
            var l3 = _this.lerp(_this.circles[2].v, _this.circles[3].v, step);
            _this.drawCircle(new Circle(l3, 8, FIRST_LAYER_COLOR));
            var ll1 = _this.lerp(l1, l2, step);
            _this.drawCircle(new Circle(ll1, 8, SECOND_LAYER_COLOR));
            var ll2 = _this.lerp(l2, l3, step);
            _this.drawCircle(new Circle(ll2, 8, SECOND_LAYER_COLOR));
            var ll3 = _this.lerp(ll1, ll2, step);
            _this.drawCircle(new Circle(ll3, 8, SECOND_LAYER_COLOR));
            _this.drawLine(l1, l2, FIRST_LAYER_COLOR, 2);
            _this.drawLine(l2, l3, FIRST_LAYER_COLOR, 2);
            _this.drawLine(ll1, ll2, SECOND_LAYER_COLOR, 2);
            if (t === 100) {
                clearInterval(_this.intervalRef);
                _this.render();
                _this.isAnimating = false;
            }
        }, 10);
    };
    return BezierCanvas;
}());
function main() {
    var canvas = document.querySelector('canvas');
    var circles = [
        new Circle(new Vector2(CENTER - (STEP * 4), CENTER + (STEP * 3)), RADIUS, '#BCE29E'),
        new Circle(new Vector2(CENTER - (STEP * 4), CENTER - (STEP * 3)), RADIUS, '#BCE29E'),
        new Circle(new Vector2(CENTER + (STEP * 4), CENTER - (STEP * 3)), RADIUS, '#BCE29E'),
        new Circle(new Vector2(CENTER + (STEP * 4), CENTER + (STEP * 3)), RADIUS, '#BCE29E')
    ];
    var board = new Board(DIMENSION, STEP);
    var bezierCanvas = new BezierCanvas(canvas, board, circles);
    bezierCanvas.render();
    var button = document.querySelector('button');
    button.addEventListener('click', bezierCanvas.animate.bind(bezierCanvas));
}
main();
