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
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        for (const circle of this.circles) {
            const dx = mouseX - circle.v.x;
            const dy = mouseY - circle.v.y;
            const insideCircle = Math.sqrt(dx * dx + dy * dy) < RADIUS;

            if (insideCircle) {
                circle.isPressed = true;
            }
        }
    }

    onMouseMove(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        for (const circle of this.circles) {
            if (circle.isPressed) {
                circle.update(new Vector2(mouseX, mouseY));
                this.render();
            }
        }
    }

    onMouseUp(e: MouseEvent) {
        for (const circle of this.circles) {
            circle.isPressed = false;
        }
    }

    render(): void {
        this.clearScreen();
        this.renderBoard();
        this.renderCircles();
        this.connectCircles();
    }

    clearScreen(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
        const redCircle = this.circles[0];
        const blueCircle = this.circles[1];
        const greenCircle = this.circles[2];
        this.drawLine(redCircle.v, blueCircle.v, 'white', 2);
        this.drawLine(blueCircle.v, greenCircle.v, 'white', 2);

        let prevV: Vector2 = null;

        for (let t = 0; t <= 1; t+= 0.05) {
            const l1 = this.lerp(redCircle.v, blueCircle.v, t);
            const l2 = this.lerp(blueCircle.v, greenCircle.v, t);
            const l3 = this.lerp(l1, l2, t);

            if (prevV) {
                this.drawLine(prevV, l3, 'red', 2);
            }

            prevV = new Vector2(l3.x, l3.y);
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
        new Circle(new Vector2(CENTER - (STEP * 3), CENTER + (STEP * 3)), RADIUS, 'red'),
        new Circle(new Vector2(CENTER, CENTER - STEP * 3), RADIUS, 'blue'),
        new Circle(new Vector2(CENTER + (STEP * 3), CENTER + (STEP * 3)), RADIUS, 'green')
    ];
    const board = new Board(DIMENSION, STEP);
    const bezierCanvas = new BezierCanvas(canvas, board, circles);

    bezierCanvas.render();
}

main();
