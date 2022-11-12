const OFFSET = 20;
const DIMENSION = 800;
const STEP = 40;
const RADIUS = 10;
const LINE_WIDTH = 5;
const CENTER = DIMENSION/2;
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
}

class Circle {
    center: Vec2;
    radius: number;
    color: string;
    isPressed: boolean = false;
    isHovered: boolean = false;

    constructor(center: Vec2, radius: number, color: string) {
        this.center = center;
        this.radius = radius;
        this.color = color;
    }

    update(center: Vec2): void {
        this.center = center;
    }
}

class Board {
    dimension: number;
    step: number;

    constructor(dimension: number, step: number) {
        this.dimension = dimension;
        this.step = step;
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
       this.ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, 2 * Math.PI, false);
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

    constructor(canvas: HTMLCanvasElement, board: Board, circles: Circle[]) {
        this.board = board;
        this.circles = circles;
        this.canvas = canvas;
        this.cursor = 'default';
        this.ctx = this.canvas.getContext("2d")!;
        this.drawer = new Drawer(this.ctx);
        this.canvas.width = this.canvas.height = this.board.dimension;
        this.canvas.onmousedown = (e) => this.onMouseDown(e);
        this.canvas.onmousemove = (e) => this.onMouseMove(e);
        this.canvas.onmouseup = (e) => this.onMouseUp(e);
    }

    onMouseDown(e: MouseEvent): void {
        for (const circle of this.circles) {
            circle.isPressed = circle.isHovered;

            if (circle.isPressed) {
                return;
            }
        }

        let minDist = Infinity;
        let circleWithSmallestDistance = null;
        const mouseVec2 = this.mouseCoordToVec2(e);

        for (const circle of this.circles) {
            const dist = this.dist(circle.center, mouseVec2);
            if (dist < minDist) {
                minDist = dist;
                circleWithSmallestDistance = circle;
            }
        }

        circleWithSmallestDistance!.update(mouseVec2);
    }

    onMouseMove(e: MouseEvent): void {
        const mouseVec2 = this.mouseCoordToVec2(e);

        for (const circle of this.circles) {
            const dist = this.dist(mouseVec2, circle.center);
            const insideCircle = dist < RADIUS;

            circle.isHovered = insideCircle;

            if (circle.isPressed) {
                circle.update(mouseVec2);
            }
        }

        this.cursor = this.circles.some(c => c.isHovered) ? 'pointer': 'default';
    }

    onMouseUp(e: MouseEvent): void {
        for (const circle of this.circles) {
            circle.isPressed = false;
        }
    }

    mouseCoordToVec2(e: MouseEvent): Vec2 {
        const rect = this.canvas.getBoundingClientRect();
        return new Vec2(e.clientX - rect.left, e.clientY - rect.top);
    }

    renderBoard(): void {
        this.clearScreen();
        this.renderCursor();
        this.renderGrid();
        this.renderCircles();
        this.connectCircles();
    }

    loop(): void {
        this.renderBoard();
        if (this.isAnimating) {
            this.animate();
        }
        window.requestAnimationFrame(this.loop.bind(this));
    }

    clearScreen(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderCursor(): void {
        this.canvas.style.cursor = this.cursor;
    }

    renderGrid(): void {
        for (let i = 0; i <= this.board.dimension; i+= this.board.step) {
            this.drawer.drawLine(new Vec2(i, 0), new Vec2(i, this.board.dimension), GRID_COLOR);
        }

        for (let i = 0; i <= this.board.dimension; i+= this.board.step) {
            this.drawer.drawLine(new Vec2(0, i), new Vec2(this.board.dimension, i), GRID_COLOR);
        }
    }

    renderCircles(): void {
        for (const circle of this.circles) {
            this.drawer.drawCircle(circle);
        }
    }

    connectCircles(): void {
        this.drawer.drawLine(this.circles[0].center, this.circles[1].center, CONNECTING_POINT_COLOR, 2);
        this.drawer.drawLine(this.circles[1].center, this.circles[2].center, CONNECTING_POINT_COLOR, 2);
        this.drawer.drawLine(this.circles[2].center, this.circles[3].center, CONNECTING_POINT_COLOR, 2);

        let prevV = null;
        const steps = 100;

         // If step is 0.01, we will have floating precision issue
         // Do t/steps like this will prevent it
        for (let t = 0; t <= steps; t += 1) {
            const step = t/steps;

            const l1 = this.lerp(this.circles[0].center, this.circles[1].center, step);
            const l2 = this.lerp(this.circles[1].center, this.circles[2].center, step);
            const l3 = this.lerp(this.circles[2].center, this.circles[3].center, step);

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

       const l1 = this.lerp(this.circles[0].center, this.circles[1].center, t);
       this.drawer.drawCircle(new Circle(l1, 8, FIRST_LAYER_COLOR));

       const l2 = this.lerp(this.circles[1].center, this.circles[2].center, t);
       this.drawer.drawCircle(new Circle(l2, 8, FIRST_LAYER_COLOR));

       const l3 = this.lerp(this.circles[2].center, this.circles[3].center, t);
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

    drawCircle(circle: Circle): void {
       this.ctx.beginPath();
       this.ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, 2 * Math.PI, false);
       this.ctx.fillStyle = circle.color;
       this.ctx.fill();
       this.ctx.strokeStyle = circle.color;
       this.ctx.stroke();
    }
}

function main(): void {
    const circles = [
        new Circle(new Vec2(CENTER - (STEP * 4), CENTER + (STEP * 3)), RADIUS, POINT_COLOR),
        new Circle(new Vec2(CENTER - (STEP * 4), CENTER - (STEP * 3)), RADIUS, POINT_COLOR),
        new Circle(new Vec2(CENTER + (STEP * 4), CENTER - (STEP * 3)), RADIUS, POINT_COLOR),
        new Circle(new Vec2(CENTER + (STEP * 4), CENTER + (STEP * 3)), RADIUS, POINT_COLOR)
    ];
    const board = new Board(DIMENSION, STEP);
    const bezierCanvas = new BezierCanvas(canvas, board, circles);

    window.requestAnimationFrame(bezierCanvas.loop.bind(bezierCanvas));
    animateButton.addEventListener('click', () => bezierCanvas.triggerAnimation());
}

main();
