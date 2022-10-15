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
    circle: Circle;

    constructor(dimension: number, step: number, circle: Circle) {
        this.dimension = dimension;
        this.step = step;
        this.circle = circle;
    }
}

class BezierCanvas {
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    board: Board;
    circle: Circle;

    constructor(canvas: HTMLCanvasElement, board: Board, circle: Circle) {
        this.board = board;
        this.circle = circle;
        this.canvas = canvas;
        this.canvas.width = this.canvas.height = this.board.dimension;
        this.ctx = canvas.getContext("2d")!;
    }

    render(): void {
        this.renderBoard();
        this.renderCircle();
    }

    renderBoard(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = 0; i <= this.board.dimension; i+= this.board.step) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.board.dimension);
            this.ctx.strokeStyle = '#B8B8B8'; // TODO: Change opacity
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        for (let i = 0; i <= this.board.dimension; i+= this.board.step) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.board.dimension, i);
            this.ctx.strokeStyle = '#B8B8B8';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    renderCircle(): void {
        this.ctx.beginPath();
        this.ctx.arc(this.circle.x, this.circle.y, this.circle.radius, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = this.circle.color;
        this.ctx.fill();
        this.ctx.stroke();
    }
}

function main(): void {
    const canvas = document.querySelector('canvas')!;
    const circle = new Circle(CENTER, CENTER, RADIUS, 'red');
    const board = new Board(DIMENSION, STEP, circle);
    const bezierCanvas = new BezierCanvas(canvas, board, circle);
    bezierCanvas.render();

    let isPressed = false;

    canvas.onmousedown = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const dx = mouseX - circle.x;
        const dy = mouseY - circle.y;
        const insideCircle = Math.sqrt(dx * dx + dy * dy) < RADIUS;

        if (insideCircle) {
            isPressed = true;
        }
    }

    canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const dx = mouseX - circle.x;
        const dy = mouseY - circle.y;

        if (isPressed) {
             circle.update(mouseX, mouseY);
             bezierCanvas.render();
        }
    }

    canvas.onmouseup = (e) => {
        isPressed = false;
    }
}

main();
