const PADDING = 40;
const DIMENSION = 800;
const STEP = 40;
const RADIUS = 10;
const LINE_WIDTH = 5;
const CENTER = (DIMENSION + PADDING * 2)/2;
const GRID_COLOR = '#d3d3d3';
const BEZIER_CURVE_COLOR = '#FDFDBD';
const POINT_COLOR = '#BCE29E';
const CONNECTING_POINT_COLOR = '#BCCEF8';
const FIRST_LAYER_COLOR = '#FF8DC7';
const SECOND_LAYER_COLOR = '#C47AFF';
const canvas = document.querySelector('canvas')!;
const animateButton = document.querySelector('button')!;

class Vec2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    clamp(min: Vec2, max: Vec2): Vec2 {
        let x = this.x;
        let y = this.y;

        if (x < min.x) x = min.x;
        if (x > max.x) x = max.x;
        if (y < min.y) y = min.y;
        if (y > max.y) y = max.y;

        return new Vec2(x, y);
    }

    isInside(begin: Vec2, end: Vec2): boolean {
        return (begin.x <= this.x && this.x <= end.x) && (begin.y <= this.y && this.y <= end.y);
    }

    static fromMouse(canvas: HTMLCanvasElement, e: MouseEvent): Vec2 {
        const {left, top} = canvas.getBoundingClientRect();
        return new Vec2(e.clientX - left, e.clientY - top);
    }
}

class Circle {
    position: Vec2;
    radius: number;
    color: string;
    isPressed: boolean = false;
    isHovered: boolean = false;

    constructor(position: Vec2, radius: number, color: string) {
        this.position = position;
        this.radius = radius;
        this.color = color;
    }

    update(position: Vec2): void {
        this.position = position;
    }
}

class Board {
    dimension: number;
    step: number;
    padding: number;

    constructor(dimension: number, step: number, padding: number) {
        this.dimension = dimension;
        this.step = step;
        this.padding = padding;
    }
}

class Drawer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    drawLine(originV: Vec2, destV: Vec2, color: string, lineWidth = 1): void {
       this.ctx.beginPath();
       this.ctx.moveTo(originV.x, originV.y);
       this.ctx.lineTo(destV.x, destV.y);
       this.ctx.strokeStyle = color;
       this.ctx.lineWidth = lineWidth;
       this.ctx.stroke();
    }

    drawCircle(circle: Circle): void {
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
    }
}

class BezierCanvas {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private board: Board;
    private circles: Circle[];
    private cursor: CSSStyleDeclaration['cursor'];
    private isAnimating = false;
    private step = 0;
    private total = 200;
    private drawer: Drawer;
    private minPos: Vec2;
    private maxPos: Vec2;

    constructor(canvas: HTMLCanvasElement, board: Board, circles: Circle[]) {
        this.board = board;
        this.circles = circles;
        this.canvas = canvas;
        this.cursor = 'default';
        this.ctx = this.canvas.getContext("2d")!;
        this.drawer = new Drawer(this.ctx);
        this.canvas.width = this.canvas.height = this.board.dimension + this.board.padding;
        this.canvas.onmousedown = (e) => this.onMouseDown(e);
        this.canvas.onmousemove = (e) => this.onMouseMove(e);
        this.canvas.onmouseup = (e) => this.onMouseUp(e);
        this.minPos = new Vec2(this.board.padding, this.board.padding);
        this.maxPos = new Vec2(this.board.dimension, this.board.dimension);
    }

    onMouseDown(e: MouseEvent): void {
        for (const circle of this.circles) {
            circle.isPressed = circle.isHovered;

            if (circle.isPressed) {
                return;
            }
        }

        const mousePos = Vec2.fromMouse(canvas, e);

        if (mousePos.isInside(this.minPos, this.maxPos)) {
            let minDist = Infinity;
            let circleWithSmallestDistance = null;

            for (const circle of this.circles) {
                const dist = this.dist(circle.position, mousePos);
                if (dist < minDist) {
                    minDist = dist;
                    circleWithSmallestDistance = circle;
                }
            }

            circleWithSmallestDistance!.update(mousePos);
        }
    }

    onMouseMove(e: MouseEvent): void {
        const mousePos = Vec2.fromMouse(canvas, e);

        for (const circle of this.circles) {
            const dist = this.dist(mousePos, circle.position);
            const insideCircle = dist < circle.radius;

            circle.isHovered = insideCircle;

            if (circle.isPressed) {
                circle.update(mousePos.clamp(this.minPos, this.maxPos));
            }
        }

        this.cursor = this.circles.some(c => c.isHovered) ? 'pointer': 'default';
    }

    onMouseUp(_e: MouseEvent): void {
        for (const circle of this.circles) {
            circle.isPressed = false;
        }
    }

    renderBoard(): void {
        this.renderGrid();
        this.renderCircles();
    }

    loop(): void {
        this.renderBoard();
        if (this.isAnimating) {
            this.animate();
        }
        window.requestAnimationFrame(this.loop.bind(this));
    }

    renderGrid(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.style.cursor = this.cursor;

        /* Have to take account the padding when drawing */

        // Vertical lines
        for (let i = this.board.padding; i <= this.board.dimension; i+= this.board.step) {
            this.drawer.drawLine(new Vec2(i, this.board.padding), new Vec2(i, this.board.dimension), GRID_COLOR);
        }

        // Horizontal lines
        for (let i = this.board.padding; i <= this.board.dimension; i+= this.board.step) {
            this.drawer.drawLine(new Vec2(this.board.padding, i), new Vec2(this.board.dimension, i), GRID_COLOR);
        }
    }

    renderCircles(): void {
        for (const circle of this.circles) {
            this.drawer.drawCircle(circle);
        }

        this.drawer.drawLine(this.circles[0].position, this.circles[1].position, CONNECTING_POINT_COLOR, 2);
        this.drawer.drawLine(this.circles[1].position, this.circles[2].position, CONNECTING_POINT_COLOR, 2);
        this.drawer.drawLine(this.circles[2].position, this.circles[3].position, CONNECTING_POINT_COLOR, 2);

        let prevV = null;
        const steps = 100;

         // If step is 0.01, we will have floating precision issue
         // Do t/steps like this will prevent it
        for (let t = 0; t <= steps; t += 1) {
            const step = t/steps;

            const l1 = this.lerp(this.circles[0].position, this.circles[1].position, step);
            const l2 = this.lerp(this.circles[1].position, this.circles[2].position, step);
            const l3 = this.lerp(this.circles[2].position, this.circles[3].position, step);

            const ll1 = this.lerp(l1, l2, step);
            const ll2 = this.lerp(l2, l3, step);
            const ll3 = this.lerp(ll1, ll2, step);

            if (prevV) {
                this.drawer.drawLine(prevV, ll3, BEZIER_CURVE_COLOR, 2);
            }

            prevV = new Vec2(ll3.x, ll3.y);
        }
    }

    lerp(v1: Vec2, v2: Vec2, t: number): Vec2 {
       const x = v1.x + (v2.x - v1.x) * t;
       const y = v1.y + (v2.y - v1.y) * t;
       return new Vec2(x, y);
    }

    dist(v1: Vec2, v2: Vec2): number {
       const dx = v1.x - v2.x;
       const dy = v1.y - v2.y;
       return Math.sqrt(Math.pow(dx, 2) + (Math.pow(dy, 2)));
    }

    animate(): void {
       const t = this.step / this.total;

       const l1 = this.lerp(this.circles[0].position, this.circles[1].position, t);
       this.drawer.drawCircle(new Circle(l1, 8, FIRST_LAYER_COLOR));

       const l2 = this.lerp(this.circles[1].position, this.circles[2].position, t);
       this.drawer.drawCircle(new Circle(l2, 8, FIRST_LAYER_COLOR));

       const l3 = this.lerp(this.circles[2].position, this.circles[3].position, t);
       this.drawer.drawCircle(new Circle(l3, 8, FIRST_LAYER_COLOR));

       const ll1 = this.lerp(l1, l2, t);
       this.drawer.drawCircle(new Circle(ll1, 8, SECOND_LAYER_COLOR));

       const ll2 = this.lerp(l2, l3, t);
       this.drawer.drawCircle(new Circle(ll2, 8, SECOND_LAYER_COLOR));

       const ll3 = this.lerp(ll1, ll2, t);
       this.drawer.drawCircle(new Circle(ll3, 8, SECOND_LAYER_COLOR));

       this.drawer.drawLine(l1, l2, FIRST_LAYER_COLOR, 2);

       this.drawer.drawLine(l2, l3, FIRST_LAYER_COLOR, 2);

       this.drawer.drawLine(ll1, ll2, SECOND_LAYER_COLOR, 2);

       this.step += 1;

       if (this.step === this.total) {
           this.isAnimating = false;
           this.step = 0;
       }
    }

    triggerAnimation(): void {
        this.isAnimating = true;
    }
}

function main(): void {
    const circles = [
        new Circle(new Vec2(CENTER - (STEP * 4), CENTER + (STEP * 3)), RADIUS, POINT_COLOR),
        new Circle(new Vec2(CENTER - (STEP * 4), CENTER - (STEP * 3)), RADIUS, POINT_COLOR),
        new Circle(new Vec2(CENTER + (STEP * 4), CENTER - (STEP * 3)), RADIUS, POINT_COLOR),
        new Circle(new Vec2(CENTER + (STEP * 4), CENTER + (STEP * 3)), RADIUS, POINT_COLOR)
    ];
    const board = new Board(DIMENSION, STEP, PADDING);
    const bezierCanvas = new BezierCanvas(canvas, board, circles);

    window.requestAnimationFrame(bezierCanvas.loop.bind(bezierCanvas));
    animateButton.addEventListener('click', () => bezierCanvas.triggerAnimation());
}

main();
