import type { Bit, Bit32, Bit5 } from "../types";
import { andGate, inverter, orGateNInp } from "./gates";
import { mux32To1 } from "./mux_demux";

export function logicalLeftShifter(data: Bit32, shiftBy: Bit32): Bit32 {
    // if shift value larger then 2^5 - 1, return 0
    const validShiftStartIndx = 32 - 5;
    const isValidShift = inverter(
        orGateNInp(shiftBy.slice(0, validShiftStartIndx))
    );
    const selectionBits = shiftBy.slice(validShiftStartIndx) as Bit5;
    return data.map((_, indx) => {
        const bit0Array = Array.from({length: indx}).fill(0) as Bit[];
        const dataForMux = [...data.slice(indx), ...bit0Array] as Bit32;
        const shiftedBit = mux32To1(dataForMux, selectionBits);

        return andGate(shiftedBit, isValidShift);
    }) as Bit32;
}