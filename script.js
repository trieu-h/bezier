var PADDING = 40;
var DIMENSION = 800;
var STEP = 40;
var RADIUS = 10;
var LINE_WIDTH = 5;
var CENTER = (DIMENSION + PADDING * 2) / 2;
var GRID_COLOR = '#d3d3d3';
var BEZIER_CURVE_COLOR = '#FDFDBD';
var POINT_COLOR = '#BCE29E';
var CONNECTING_POINT_COLOR = '#BCCEF8';
var FIRST_LAYER_COLOR = '#FF8DC7';
var SECOND_LAYER_COLOR = '#C47AFF';
var canvas = document.querySelector('canvas');
var animateButton = document.querySelector('button');
var Vec2 = /** @class */ (function () {
    function Vec2(x, y) {
        this.x = x;
        this.y = y;
    }
    Vec2.prototype.clamp = function (min, max) {
        var x = this.x;
        var y = this.y;
        if (x < min.x)
            x = min.x;
        if (x > max.x)
            x = max.x;
        if (y < min.y)
            y = min.y;
        if (y > max.y)
            y = max.y;
        return new Vec2(x, y);
    };
    Vec2.prototype.isInside = function (begin, end) {
        return (begin.x <= this.x && this.x <= end.x) && (begin.y <= this.y && this.y <= end.y);
    };
    Vec2.fromMouse = function (canvas, e) {
        var _a = canvas.getBoundingClientRect(), left = _a.left, top = _a.top;
        return new Vec2(e.clientX - left, e.clientY - top);
    };
    return Vec2;
}());
var Circle = /** @class */ (function () {
    function Circle(position, radius, color) {
        this.isPressed = false;
        this.isHovered = false;
        this.position = position;
        this.radius = radius;
        this.color = color;
    }
    Circle.prototype.update = function (position) {
        this.position = position;
    };
    return Circle;
}());
var Board = /** @class */ (function () {
    function Board(dimension, step, padding) {
        this.dimension = dimension;
        this.step = step;
        this.padding = padding;
    }
    return Board;
}());
var Drawer = /** @class */ (function () {
    function Drawer(ctx) {
        this.ctx = ctx;
    }
    Drawer.prototype.drawLine = function (originV, destV, color, lineWidth) {
        if (lineWidth === void 0) { lineWidth = 1; }
        this.ctx.beginPath();
        this.ctx.moveTo(originV.x, originV.y);
        this.ctx.lineTo(destV.x, destV.y);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.stroke();
    };
    Drawer.prototype.drawCircle = function (circle) {
        this.ctx.save();
        this.ctx.beginPath();
        if (circle.isPressed) {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = "orange";
        }
        this.ctx.arc(circle.position.x, circle.position.y, circle.radius, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = circle.color;
        this.ctx.fill();
        this.ctx.strokeStyle = circle.color;
        this.ctx.stroke();
        this.ctx.restore();
    };
    return Drawer;
}());
var BezierCanvas = /** @class */ (function () {
    function BezierCanvas(canvas, board, circles) {
        var _this = this;
        this.isAnimating = false;
        this.step = 0;
        this.total = 200;
        this.board = board;
        this.circles = circles;
        this.canvas = canvas;
        this.cursor = 'default';
        this.ctx = this.canvas.getContext("2d");
        this.drawer = new Drawer(this.ctx);
        this.canvas.width = this.canvas.height = this.board.dimension + this.board.padding;
        this.canvas.onmousedown = function (e) { return _this.onMouseDown(e); };
        this.canvas.onmousemove = function (e) { return _this.onMouseMove(e); };
        this.canvas.onmouseup = function (e) { return _this.onMouseUp(e); };
        this.minPos = new Vec2(this.board.padding, this.board.padding);
        this.maxPos = new Vec2(this.board.dimension, this.board.dimension);
    }
    BezierCanvas.prototype.onMouseDown = function (e) {
        for (var _i = 0, _a = this.circles; _i < _a.length; _i++) {
            var circle = _a[_i];
            circle.isPressed = circle.isHovered;
            if (circle.isPressed) {
                return;
            }
        }
        var mousePos = Vec2.fromMouse(canvas, e);
        if (mousePos.isInside(this.minPos, this.maxPos)) {
            var minDist = Infinity;
            var circleWithSmallestDistance = null;
            for (var _b = 0, _c = this.circles; _b < _c.length; _b++) {
                var circle = _c[_b];
                var dist = this.dist(circle.position, mousePos);
                if (dist < minDist) {
                    minDist = dist;
                    circleWithSmallestDistance = circle;
                }
            }
            circleWithSmallestDistance.update(mousePos);
        }
    };
    BezierCanvas.prototype.onMouseMove = function (e) {
        var mousePos = Vec2.fromMouse(canvas, e);
        for (var _i = 0, _a = this.circles; _i < _a.length; _i++) {
            var circle = _a[_i];
            var dist = this.dist(mousePos, circle.position);
            var insideCircle = dist < circle.radius;
            circle.isHovered = insideCircle;
            if (circle.isPressed) {
                circle.update(mousePos.clamp(this.minPos, this.maxPos));
            }
        }
        this.cursor = this.circles.some(function (c) { return c.isHovered; }) ? 'pointer' : 'default';
    };
    BezierCanvas.prototype.onMouseUp = function (_e) {
        for (var _i = 0, _a = this.circles; _i < _a.length; _i++) {
            var circle = _a[_i];
            circle.isPressed = false;
        }
    };
    BezierCanvas.prototype.renderBoard = function () {
        this.renderGrid();
        this.renderCircles();
    };
    BezierCanvas.prototype.loop = function () {
        this.renderBoard();
        if (this.isAnimating) {
            this.animate();
        }
        window.requestAnimationFrame(this.loop.bind(this));
    };
    BezierCanvas.prototype.renderGrid = function () {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.style.cursor = this.cursor;
        /* Have to take account the padding when drawing */
        // Vertical lines
        for (var i = this.board.padding; i <= this.board.dimension; i += this.board.step) {
            this.drawer.drawLine(new Vec2(i, this.board.padding), new Vec2(i, this.board.dimension), GRID_COLOR);
        }
        // Horizontal lines
        for (var i = this.board.padding; i <= this.board.dimension; i += this.board.step) {
            this.drawer.drawLine(new Vec2(this.board.padding, i), new Vec2(this.board.dimension, i), GRID_COLOR);
        }
    };
    BezierCanvas.prototype.renderCircles = function () {
        for (var _i = 0, _a = this.circles; _i < _a.length; _i++) {
            var circle = _a[_i];
            this.drawer.drawCircle(circle);
        }
        this.drawer.drawLine(this.circles[0].position, this.circles[1].position, CONNECTING_POINT_COLOR, 2);
        this.drawer.drawLine(this.circles[1].position, this.circles[2].position, CONNECTING_POINT_COLOR, 2);
        this.drawer.drawLine(this.circles[2].position, this.circles[3].position, CONNECTING_POINT_COLOR, 2);
        var prevV = null;
        var steps = 100;
        // If step is 0.01, we will have floating precision issue
        // Do t/steps like this will prevent it
        for (var t = 0; t <= steps; t += 1) {
            var step = t / steps;
            var l1 = this.lerp(this.circles[0].position, this.circles[1].position, step);
            var l2 = this.lerp(this.circles[1].position, this.circles[2].position, step);
            var l3 = this.lerp(this.circles[2].position, this.circles[3].position, step);
            var ll1 = this.lerp(l1, l2, step);
            var ll2 = this.lerp(l2, l3, step);
            var ll3 = this.lerp(ll1, ll2, step);
            if (prevV) {
                this.drawer.drawLine(prevV, ll3, BEZIER_CURVE_COLOR, 2);
            }
            prevV = new Vec2(ll3.x, ll3.y);
        }
    };
    BezierCanvas.prototype.lerp = function (v1, v2, t) {
        var x = v1.x + (v2.x - v1.x) * t;
        var y = v1.y + (v2.y - v1.y) * t;
        return new Vec2(x, y);
    };
    BezierCanvas.prototype.dist = function (v1, v2) {
        var dx = v1.x - v2.x;
        var dy = v1.y - v2.y;
        return Math.sqrt(Math.pow(dx, 2) + (Math.pow(dy, 2)));
    };
    BezierCanvas.prototype.animate = function () {
        var t = this.step / this.total;
        var l1 = this.lerp(this.circles[0].position, this.circles[1].position, t);
        this.drawer.drawCircle(new Circle(l1, 8, FIRST_LAYER_COLOR));
        var l2 = this.lerp(this.circles[1].position, this.circles[2].position, t);
        this.drawer.drawCircle(new Circle(l2, 8, FIRST_LAYER_COLOR));
        var l3 = this.lerp(this.circles[2].position, this.circles[3].position, t);
        this.drawer.drawCircle(new Circle(l3, 8, FIRST_LAYER_COLOR));
        var ll1 = this.lerp(l1, l2, t);
        this.drawer.drawCircle(new Circle(ll1, 8, SECOND_LAYER_COLOR));
        var ll2 = this.lerp(l2, l3, t);
        this.drawer.drawCircle(new Circle(ll2, 8, SECOND_LAYER_COLOR));
        var ll3 = this.lerp(ll1, ll2, t);
        this.drawer.drawCircle(new Circle(ll3, 8, SECOND_LAYER_COLOR));
        this.drawer.drawLine(l1, l2, FIRST_LAYER_COLOR, 2);
        this.drawer.drawLine(l2, l3, FIRST_LAYER_COLOR, 2);
        this.drawer.drawLine(ll1, ll2, SECOND_LAYER_COLOR, 2);
        this.step += 1;
        if (this.step === this.total) {
            this.isAnimating = false;
            this.step = 0;
        }
    };
    BezierCanvas.prototype.triggerAnimation = function () {
        this.isAnimating = true;
    };
    return BezierCanvas;
}());
function main() {
    var circles = [
        new Circle(new Vec2(CENTER - (STEP * 4), CENTER + (STEP * 3)), RADIUS, POINT_COLOR),
        new Circle(new Vec2(CENTER - (STEP * 4), CENTER - (STEP * 3)), RADIUS, POINT_COLOR),
        new Circle(new Vec2(CENTER + (STEP * 4), CENTER - (STEP * 3)), RADIUS, POINT_COLOR),
        new Circle(new Vec2(CENTER + (STEP * 4), CENTER + (STEP * 3)), RADIUS, POINT_COLOR)
    ];
    var board = new Board(DIMENSION, STEP, PADDING);
    var bezierCanvas = new BezierCanvas(canvas, board, circles);
    window.requestAnimationFrame(bezierCanvas.loop.bind(bezierCanvas));
    animateButton.addEventListener('click', function () { return bezierCanvas.triggerAnimation(); });
}
main();
