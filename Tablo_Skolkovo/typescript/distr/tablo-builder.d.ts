/// <reference types="node" />
export declare class TabloBuilder {
    private bufArr;
    private startByte;
    private endByte;
    constructor();
    setString(string: string): this;
    setPause(pause: string): this;
    setSpeed(speed: string): this;
    setEffect(effect: string): this;
    setCenter(center: string): this;
    finalize(): Buffer;
}