import type { Bit, Bit32, Bit5 } from "../types";
import { andGate, inverter, orGateNInp } from "./gates";
import { mux2To1, mux32To1 } from "./mux_demux";

export function logicalShifter(data: Bit32, shiftBy: Bit32, shiftDir: Bit): Bit32 {
    // if shift value larger then 2^5 - 1, return 0
    const validShiftStartIndx = 32 - 5;
    const isValidShift = inverter(
        orGateNInp(shiftBy.slice(0, validShiftStartIndx))
    );
    const selectionBits = shiftBy.slice(validShiftStartIndx) as Bit5;

    const selectedDirData = data.map((dt, indx) => mux2To1(
        dt,
        data[data.length - (indx + 1)],
        shiftDir // shiftDir = 0 is left shift, 1 is right shift
    )) as Bit32;
    
    const shiftMuxOutputData = selectedDirData.map((_, indx) => {
        const bit0Array = Array.from({length: indx}).fill(0) as Bit[];
        const dataForMux = [...selectedDirData.slice(indx), ...bit0Array] as Bit32;
        const shiftedBit = mux32To1(dataForMux, selectionBits);

        return andGate(shiftedBit, isValidShift);
    }) as Bit32;

    return shiftMuxOutputData.map((dt, indx) => mux2To1(
        dt,
        shiftMuxOutputData[shiftMuxOutputData.length - (indx + 1)],
        shiftDir // shiftDir = 0 is left shift, 1 is right shift, on right shift reverse the reversed data
    )) as Bit32;
}