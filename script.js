"use strict";
const GRID_HEIGHT = 600;
const GRID_WIDTH = 600;
const GRID_COLS = 20;
const GRID_ROWS = 20;
const STEP = 40;
const RADIUS = 10;
const LINE_WIDTH = 5;
const CENTER = GRID_WIDTH / 2;
const GRID_COLOR = '#d3d3d3';
const BEZIER_CURVE_COLOR = '#FDFDBD';
const POINT_COLOR = '#BCE29E';
const CONNECTING_POINT_COLOR = '#BCCEF8';
const FIRST_LAYER_COLOR = '#FF8DC7';
const SECOND_LAYER_COLOR = '#C47AFF';
const canvas = document.querySelector('canvas');
canvas.width = GRID_WIDTH;
canvas.height = GRID_HEIGHT;
const ctx = canvas.getContext("2d");
let showAnimation = true;
class Vec2 {
    dist(that) {
        const dx = this.x - that.x;
        const dy = this.y - that.y;
        return Math.sqrt(Math.pow(dx, 2) + (Math.pow(dy, 2)));
    }
    clamp(min, max) {
        let x = this.x;
        let y = this.y;
        if (x < min.x)
            x = min.x;
        if (x > max.x)
            x = max.x;
        if (y < min.y)
            y = min.y;
        if (y > max.y)
            y = max.y;
        return new Vec2(x, y);
    }
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class Point {
    constructor(pos) {
        this.pos = pos;
        this.isPressed = false;
        this.isHovered = false;
    }
}
function lerp(v1, v2, t) {
    const x = v1.x + (v2.x - v1.x) * t;
    const y = v1.y + (v2.y - v1.y) * t;
    return new Vec2(x, y);
}
function drawLine(ctx, startPos, endPos, color, lineWidth = 1, opacity = 1) {
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.moveTo(startPos.x, startPos.y);
    ctx.lineTo(endPos.x, endPos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
}
function drawCircle(ctx, pos, radius, color, renderShadow = false) {
    ctx.save();
    ctx.beginPath();
    if (renderShadow) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = "orange";
    }
    ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();
}
function renderGrid() {
    ctx.clearRect(0, 0, GRID_WIDTH, GRID_HEIGHT);
    const cell_width = GRID_WIDTH / GRID_COLS;
    const cell_height = GRID_HEIGHT / GRID_ROWS;
    for (let x = 0; x <= GRID_COLS; x++) {
        drawLine(ctx, new Vec2(x * cell_width, 0), new Vec2(x * cell_width, GRID_HEIGHT), GRID_COLOR, 1, 0.5);
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
        drawLine(ctx, new Vec2(0, y * cell_height), new Vec2(GRID_WIDTH, y * cell_height), GRID_COLOR, 1, 0.5);
    }
}
const startRenderingBezier = false;
const points = [];
let prevPos, curPos = null;
let t = 0;
function visualizeBezier(points, t) {
    const aux = (points, t, level) => {
        if (points.length == 0) {
            return;
        }
        for (let i = 0; i < points.length; i++) {
            if (i > points.length - 2) {
                break;
            }
            const thisPoint = points[i];
            const nextPoint = points[i + 1];
            drawLine(ctx, thisPoint, nextPoint, CONNECTING_POINT_COLOR, 2);
        }
        let pointLerps = [];
        for (let i = 0; i < points.length; i++) {
            if (i > points.length - 2) {
                break;
            }
            const thisPoint = points[i];
            const nextPoint = points[i + 1];
            pointLerps.push(lerp(thisPoint, nextPoint, t));
        }
        for (const pointLerp of pointLerps) {
            if (pointLerps.length === 1 && level >= 1) {
                drawCircle(ctx, pointLerp, RADIUS, SECOND_LAYER_COLOR);
            }
            else {
                drawCircle(ctx, pointLerp, RADIUS, FIRST_LAYER_COLOR);
            }
        }
        aux(pointLerps, t, level + 1);
    };
    aux(points.map(p => p.pos), t, 0);
}
function calculateBezierAtStep(points, step) {
    const aux = (points, step, level) => {
        if (points.length == 0) {
            return null;
        }
        for (let i = 0; i < points.length; i++) {
            if (i > points.length - 2) {
                break;
            }
            const thisPoint = points[i];
            const nextPoint = points[i + 1];
        }
        let pointLerps = [];
        for (let i = 0; i < points.length; i++) {
            if (i > points.length - 2) {
                break;
            }
            const thisPoint = points[i];
            const nextPoint = points[i + 1];
            pointLerps.push(lerp(thisPoint, nextPoint, step));
        }
        if (pointLerps.length === 1 && level >= 1) {
            return new Vec2(pointLerps[0].x, pointLerps[0].y);
        }
        return aux(pointLerps, step, level + 1);
    };
    return aux(points.map(p => p.pos), step, 0);
}
function frame() {
    t += 0.001;
    if (t > 1)
        t = 0;
    renderGrid();
    canvas.style.cursor = points.some(c => c.isHovered) ? 'pointer' : 'default';
    for (const point of points) {
        drawCircle(ctx, point.pos, RADIUS, POINT_COLOR, point.isPressed);
    }
    if (showAnimation) {
        visualizeBezier(points, t);
    }
    let prevPos = null;
    let curPos = null;
    const steps = 1000;
    // If step is 0.01, we will have floating precision issue
    // Do t/steps likethis will prevent it
    for (let t = 0; t <= steps; t += 1) {
        const step = t / steps;
        curPos = calculateBezierAtStep(points, step);
        if (prevPos && curPos)
            drawLine(ctx, prevPos, curPos, BEZIER_CURVE_COLOR, 2);
        prevPos = curPos;
    }
    requestAnimationFrame(frame);
}
function isPointInsideCircle(point_pos, circle_pos, radius) {
    let dx = point_pos.x - circle_pos.x;
    let dy = point_pos.y - circle_pos.y;
    let distance_sqr = dx * dx + dy * dy;
    let radius_sqr = radius * radius;
    return distance_sqr <= radius_sqr;
}
canvas.addEventListener('mousedown', (e) => {
    const mousePos = new Vec2(e.offsetX, e.offsetY);
    for (const point of points) {
        if (isPointInsideCircle(mousePos, point.pos, RADIUS)) {
            return;
        }
    }
    const point = new Point(new Vec2(e.offsetX, e.offsetY));
    points.push(point);
    if (!startRenderingBezier && points.length == 2) {
        t = 0;
    }
});
canvas.addEventListener('mousedown', (e) => {
    for (const point of points) {
        point.isPressed = point.isHovered;
        if (point.isPressed) {
            return;
        }
    }
});
let minPos = new Vec2(0, 0);
let maxPos = new Vec2(GRID_WIDTH, GRID_HEIGHT);
canvas.addEventListener('mousemove', (e) => {
    const mousePos = new Vec2(e.offsetX, e.offsetY);
    for (const point of points) {
        const dist = mousePos.dist(point.pos);
        const insidePoint = dist < RADIUS;
        point.isHovered = insidePoint;
        if (point.isPressed) {
            point.pos = mousePos.clamp(minPos, maxPos);
        }
    }
});
canvas.addEventListener('mouseup', (e) => {
    for (const point of points) {
        point.isPressed = false;
    }
});
function handleChange(checkbox) {
    showAnimation = checkbox.checked;
}
requestAnimationFrame(frame);
