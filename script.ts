const OFFSET = 20;
const DIMENSION = 800;
const STEP = 40;
const RADIUS = 10;
const LINE_WIDTH = 5;
const CENTER = DIMENSION/2;
const GRID_COLOR = '#d3d3d3';

class Vector2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

class Circle {
    v: Vector2;
    radius: number;
    color: string;
    isPressed: boolean = false;
    isHovered: boolean = false;

    constructor(v: Vector2, radius: number, color: string) {
        this.v = v;
        this.radius = radius;
        this.color = color;
    }

    update(v: Vector2): void {
        this.v = v;
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

class BezierCanvas {
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    board: Board;
    circles: Circle[];
    cursor = 'default';

    constructor(canvas: HTMLCanvasElement, board: Board, circles: Circle[]) {
        this.board = board;
        this.circles = circles;
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = this.canvas.height = this.board.dimension;
        this.canvas.onmousedown = (e) => this.onMouseDown(e);
        this.canvas.onmousemove = (e) => this.onMouseMove(e);
        this.canvas.onmouseup = (e) => this.onMouseUp(e);
    }

    onMouseDown(e: MouseEvent) {
        for (const circle of this.circles) {
            circle.isPressed = circle.isHovered;

            if (circle.isPressed) {
                return;
            }
        }
    }

    onMouseMove(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        for (const circle of this.circles) {
            const dx = mouseX - circle.v.x;
            const dy = mouseY - circle.v.y;
            const insideCircle = Math.sqrt(dx * dx + dy * dy) < RADIUS;

            circle.isHovered = insideCircle;

            if (circle.isPressed) {
                circle.update(new Vector2(mouseX, mouseY));
            }
        }

        this.cursor = this.circles.some(c => c.isHovered) ? 'pointer': 'default';
    }

    onMouseUp(e: MouseEvent) {
        for (const circle of this.circles) {
            circle.isPressed = false;
        }
    }

    render(): void {
        this.clearScreen();
        this.renderCursor();
        this.renderBoard();
        this.renderCircles();
        this.connectCircles();
        window.requestAnimationFrame(this.render.bind(this));
    }

    clearScreen(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderCursor(): void {
        this.canvas.style.cursor = this.cursor;
    }

    renderBoard(): void {
        for (let i = 0; i <= this.board.dimension; i+= this.board.step) {
            this.drawLine(new Vector2(i, 0), new Vector2(i, this.board.dimension), GRID_COLOR);
        }

        for (let i = 0; i <= this.board.dimension; i+= this.board.step) {
            this.drawLine(new Vector2(0, i), new Vector2(this.board.dimension, i), GRID_COLOR);
        }
    }

    renderCircles(): void {
        for (const circle of this.circles) {
            this.ctx.beginPath();
            this.ctx.arc(circle.v.x, circle.v.y, circle.radius, 0, 2 * Math.PI, false);
            this.ctx.fillStyle = circle.color;
            this.ctx.fill();
            this.ctx.stroke();
        }
    }

    connectCircles(): void {
        const firstCircle = this.circles[0];
        const secondCircle = this.circles[1];
        const thirdCircle = this.circles[2];
        const fourthCircle = this.circles[3];
        this.drawLine(firstCircle.v, secondCircle.v, 'white', 2);
        this.drawLine(secondCircle.v, thirdCircle.v, 'white', 2);
        this.drawLine(thirdCircle.v, fourthCircle.v, 'white', 2);

        let prevV = null;
        const steps = 100;

         // If step is 0.01, we will have floating precision issue
         // Do t/steps like this will prevent it
        for (let t = 0; t <= steps; t += 1) {
            const step = t/steps;
            const l1 = this.lerp(firstCircle.v, secondCircle.v, step);
            const l2 = this.lerp(secondCircle.v, thirdCircle.v, step);
            const l3 = this.lerp(thirdCircle.v, fourthCircle.v, step);

            const ll1 = this.lerp(l1, l2, step);
            const ll2 = this.lerp(l2, l3, step);
            const ll3 = this.lerp(ll1, ll2, step);

            if (prevV) {
                this.drawLine(prevV, ll3, 'red', 2);
            }

            prevV = new Vector2(ll3.x, ll3.y);
        }
    }

    lerp(v1: Vector2, v2: Vector2, t: number): Vector2 {
       const x = v1.x + (v2.x - v1.x) * t;
       const y = v1.y + (v2.y - v1.y) * t;
       return new Vector2(x, y);
    }

    drawLine(originV: Vector2, destV: Vector2, color: string, lineWidth = 1): void {
       this.ctx.beginPath();
       this.ctx.moveTo(originV.x, originV.y);
       this.ctx.lineTo(destV.x, destV.y);
       this.ctx.strokeStyle = color;
       this.ctx.lineWidth = lineWidth;
       this.ctx.stroke();
    }
}

function main(): void {
    const canvas = document.querySelector('canvas')!;
    const circles = [
        new Circle(new Vector2(CENTER - (STEP * 4), CENTER + (STEP * 3)), RADIUS, 'red'),
        new Circle(new Vector2(CENTER - (STEP * 4), CENTER - (STEP * 3)), RADIUS, 'yellow'),
        new Circle(new Vector2(CENTER + (STEP * 4), CENTER - (STEP * 3)), RADIUS, 'green'),
        new Circle(new Vector2(CENTER + (STEP * 4), CENTER + (STEP * 3)), RADIUS, 'blue')
    ];
    const board = new Board(DIMENSION, STEP);
    const bezierCanvas = new BezierCanvas(canvas, board, circles);

    window.requestAnimationFrame(bezierCanvas.render.bind(bezierCanvas));
}

main();
