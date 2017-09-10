export class CanvasInformation {

    public context: CanvasRenderingContext2D;
    public canvas: HTMLCanvasElement;

    constructor(context: CanvasRenderingContext2D) {
        this.context = context;
        this.canvas = <HTMLCanvasElement>context.canvas;
    }

    public static create(w: number, h: number): CanvasInformation {
        let canvas = document.createElement("canvas");
        return CanvasInformation.CreateFromElement(canvas, w, h);
    }

    public static CreateFromElement(canvas: HTMLCanvasElement, w: number, h: number): CanvasInformation {
        if (w == 0)
            w = 1;
        if (h == 0)
            h = 1;
        canvas.width = w;
        canvas.height = h;
        let ctx = <CanvasRenderingContext2D>canvas.getContext("2d");
        return new CanvasInformation(ctx);
    }
}