import type { Bit32 } from "../types";
import { decimalToBinary } from "../utils/convertion";
import { bitAdderSubstractor32 } from "./adders";
import { register32 } from "./memory";

export class ProgramCounter extends register32 {

    constructor() {
        super();
    }

    increment() {
        const currCounterVal = this.get();
        const incBy = decimalToBinary(4, 32) as Bit32; // Instruction size is 4 bytes
        const nextCount = bitAdderSubstractor32(0, 0, currCounterVal, incBy)[0];
        this.set(nextCount);
    }
}