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

class BezierCanvas {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private board: Board;
    private circles: Circle[];
    private cursor: CSSStyleDeclaration['cursor'];
    private intervalRef: number | null = null;
    private isAnimating = false;

    constructor(canvas: HTMLCanvasElement, board: Board, circles: Circle[]) {
        this.board = board;
        this.circles = circles;
        this.canvas = canvas;
        this.cursor = 'default';
        this.ctx = this.canvas.getContext("2d")!;
        this.canvas.width = this.canvas.height = this.board.dimension;
        this.canvas.onmousedown = (e) => {
            if (!this.isAnimating) { this.onMouseDown(e) };
        };
        this.canvas.onmousemove = (e) => {
            if (!this.isAnimating) { this.onMouseMove(e) };
        };
        this.canvas.onmouseup = (e) => {
            if (!this.isAnimating) { this.onMouseUp(e) };
        };
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
            const dx = mouseX - circle.center.x;
            const dy = mouseY - circle.center.y;
            const insideCircle = Math.sqrt(dx * dx + dy * dy) < RADIUS;

            circle.isHovered = insideCircle;

            if (circle.isPressed) {
                circle.update(new Vec2(mouseX, mouseY));
            }
        }

        this.cursor = this.circles.some(c => c.isHovered) ? 'pointer': 'default';
        this.render();
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
    }

    clearScreen(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderCursor(): void {
        this.canvas.style.cursor = this.cursor;
    }

    renderBoard(): void {
        for (let i = 0; i <= this.board.dimension; i+= this.board.step) {
            this.drawLine(new Vec2(i, 0), new Vec2(i, this.board.dimension), GRID_COLOR);
        }

        for (let i = 0; i <= this.board.dimension; i+= this.board.step) {
            this.drawLine(new Vec2(0, i), new Vec2(this.board.dimension, i), GRID_COLOR);
        }
    }

    renderCircles(): void {
        for (const circle of this.circles) {
            this.drawCircle(circle);
        }
    }

    connectCircles(): void {
        this.drawLine(this.circles[0].center, this.circles[1].center, CONNECTING_POINT_COLOR, 2);
        this.drawLine(this.circles[1].center, this.circles[2].center, CONNECTING_POINT_COLOR, 2);
        this.drawLine(this.circles[2].center, this.circles[3].center, CONNECTING_POINT_COLOR, 2);

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
                this.drawLine(prevV, ll3, BEZIER_CURVE_COLOR, 2);
            }

            prevV = new Vec2(ll3.x, ll3.y);
        }
    }

    lerp(v1: Vec2, v2: Vec2, t: number): Vec2 {
       const x = v1.x + (v2.x - v1.x) * t;
       const y = v1.y + (v2.y - v1.y) * t;
       return new Vec2(x, y);
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
       this.ctx.beginPath();
       this.ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, 2 * Math.PI, false);
       this.ctx.fillStyle = circle.color;
       this.ctx.fill();
       this.ctx.strokeStyle = circle.color;
       this.ctx.stroke();
    }

    animate(): void {
       if (this.intervalRef) { clearInterval(this.intervalRef) };
       this.isAnimating = true;
       const steps = 100;
       let t = 0;

       this.intervalRef = setInterval( () => {
           t+= 1;
           this.render();
           const step = t/steps;

           const l1 = this.lerp(this.circles[0].center, this.circles[1].center, step);
           this.drawCircle(new Circle(l1, 8, FIRST_LAYER_COLOR));

           const l2 = this.lerp(this.circles[1].center, this.circles[2].center, step);
           this.drawCircle(new Circle(l2, 8, FIRST_LAYER_COLOR));

           const l3 = this.lerp(this.circles[2].center, this.circles[3].center, step);
           this.drawCircle(new Circle(l3, 8, FIRST_LAYER_COLOR));

           const ll1 = this.lerp(l1, l2, step);
           this.drawCircle(new Circle(ll1, 8, SECOND_LAYER_COLOR));

           const ll2 = this.lerp(l2, l3, step);
           this.drawCircle(new Circle(ll2, 8, SECOND_LAYER_COLOR));

           const ll3 = this.lerp(ll1, ll2, step);
           this.drawCircle(new Circle(ll3, 8, SECOND_LAYER_COLOR));

           this.drawLine(l1, l2, FIRST_LAYER_COLOR, 2);

           this.drawLine(l2, l3, FIRST_LAYER_COLOR, 2);

           this.drawLine(ll1, ll2, SECOND_LAYER_COLOR, 2);

           if ( t === 100 ) {
              clearInterval(this.intervalRef!);
              this.render();
              this.isAnimating = false;
           }
       }, 10)
    }
}

function main(): void {
    const canvas = document.querySelector('canvas')!;
    const circles = [
        new Circle(new Vec2(CENTER - (STEP * 4), CENTER + (STEP * 3)), RADIUS, POINT_COLOR),
        new Circle(new Vec2(CENTER - (STEP * 4), CENTER - (STEP * 3)), RADIUS, POINT_COLOR),
        new Circle(new Vec2(CENTER + (STEP * 4), CENTER - (STEP * 3)), RADIUS, POINT_COLOR),
        new Circle(new Vec2(CENTER + (STEP * 4), CENTER + (STEP * 3)), RADIUS, POINT_COLOR)
    ];
    const board = new Board(DIMENSION, STEP);
    const bezierCanvas = new BezierCanvas(canvas, board, circles);
    bezierCanvas.render();

    const button = document.querySelector('button')!;
    button.addEventListener('click', bezierCanvas.animate.bind(bezierCanvas));
}

main();
