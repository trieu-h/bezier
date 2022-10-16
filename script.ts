const OFFSET = 20;
const DIMENSION = 800;
const STEP = 40;
const RADIUS = 10;
const LINE_WIDTH = 5;
const CENTER = DIMENSION/2;

class Circle {
    x: number;
    y: number;
    radius: number;
    color: string;
    isPressed: boolean = false;

    constructor(x: number, y: number, radius: number, color: string) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    update(x: number, y: number): void {
        this.x = x;
        this.y = y;
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
    canvas: HTMLCanvasElement;
    board: Board;
    circles: Circle[];

    get ctx(): CanvasRenderingContext2D {
       return this.canvas.getContext("2d")!;
    }

    constructor(canvas: HTMLCanvasElement, board: Board, circles: Circle[]) {
        this.board = board;
        this.circles = circles;
        this.canvas = canvas;
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
            const dx = mouseX - circle.x;
            const dy = mouseY - circle.y;
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
                circle.update(mouseX, mouseY);
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
            this.drawLine(i, 0, i, this.board.dimension);
        }

        for (let i = 0; i <= this.board.dimension; i+= this.board.step) {
            this.drawLine(0, i, this.board.dimension, i);
        }
    }

    renderCircles(): void {
        for (const circle of this.circles) {
            this.ctx.beginPath();
            this.ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI, false);
            this.ctx.fillStyle = circle.color;
            this.ctx.fill();
            this.ctx.stroke();
        }
    }

    connectCircles(): void {
        const redCircle = this.circles[0];
        const blueCircle = this.circles[1];
        const greenCircle = this.circles[2];
        this.drawLine(redCircle.x, redCircle.y, blueCircle.x, blueCircle.y);
        this.drawLine(blueCircle.x, blueCircle.y, greenCircle.x, greenCircle.y);

        let prevX;
        let prevY;

        for (let t = 0; t <= 1; t+= 0.05) {
            const [x1, y1] = this.lerp(redCircle.x, redCircle.y, blueCircle.x, blueCircle.y, t);
            const [x2, y2] = this.lerp(blueCircle.x, blueCircle.y, greenCircle.x, greenCircle.y, t);
            const [x3, y3] = this.lerp(x1, y1, x2, y2, t);
            console.log('x3, y3', x3, y3);

            if (prevX && prevY) {
                this.drawLine(prevX, prevY, x3, y3);
            }

            prevX = x3;
            prevY = y3;
        }
    }

    lerp(x1: number, y1: number, x2: number, y2: number, t: number): [number, number] {
        const x = x1 + (x2 - x1) * t
        const y = y1 + (y2 - y1) * t
        return [x, y];
    }

    drawLine(originX: number, originY: number, destX: number, destY: number): void {
       this.ctx.beginPath();
       this.ctx.moveTo(originX, originY);
       this.ctx.lineTo(destX, destY);
       this.ctx.strokeStyle = '#B8B8B8';
       this.ctx.lineWidth = 2;
       this.ctx.stroke();
    }
}

function main(): void {
    const big = new Big();
    const canvas = document.querySelector('canvas')!;
    const circles = [
        new Circle(CENTER, CENTER, RADIUS, 'red'),
        new Circle(CENTER - STEP, CENTER - STEP, RADIUS, 'blue'),
        new Circle(CENTER + STEP, CENTER + STEP, RADIUS, 'green')
    ];
    const board = new Board(DIMENSION, STEP);
    const bezierCanvas = new BezierCanvas(canvas, board, circles);

    bezierCanvas.render();
}

main();
