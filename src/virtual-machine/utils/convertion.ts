import type { Bit } from "../types";

export function decimalToBinary(num: number, pad: number): Bit[] {
        const bin: Bit[] = [];
        if (num > 2 ** pad - 1) {
            console.error("binary conversion error as padding is less then number");
        }
        while (bin.length < pad) {
            const remainder = num % 2;
            num = Math.floor(num / 2);
            bin.unshift(remainder as Bit);
        }

        return bin;
    }

export function binaryToDecimal(bin: Bit[]): number {
    return [...bin].reverse().reduce((acc: number, cur: number, indx) => acc + (cur * (2 ** indx)), 0);
}