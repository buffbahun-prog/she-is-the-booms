import type { Bit, Bit32, Bit5 } from "../types";
import { andGate, inverter, orGate, orGateNInp } from "./gates";
import { mux2To1, mux32To1 } from "./mux_demux";

export function shiftRotate32(data: Bit32, shiftBy: Bit32, shiftDir: Bit, rotate: Bit): Bit32 {
    // if shift value larger then 2^5 - 1, return 0
    const SHIFT_BITS = 5;
    const validShiftStartIndex = 32 - SHIFT_BITS;
    const isValidShift = inverter(
        orGateNInp(shiftBy.slice(0, validShiftStartIndex))
    );

    // equivalent to shiftBy % 32
    const selectionBits = shiftBy.slice(validShiftStartIndex) as Bit5;

    const transformedData = data.map((dt, indx) => mux2To1(
        dt,
        data[data.length - (indx + 1)],
        shiftDir // shiftDir = 0 is left shift, 1 is right shift
    )) as Bit32;
    
    const shiftMuxOutputData = transformedData.map((_, indx) => {
        const rotatedArray = transformedData.slice(0, indx);
        const shiftFillArray = rotatedArray.map(bit => andGate(bit, rotate));
        const dataForMux = [...transformedData.slice(indx), ...shiftFillArray] as Bit32;
        const shiftedBit = mux32To1(dataForMux, selectionBits);

        return andGate(shiftedBit, orGate(
            rotate,
            isValidShift
        ));
    }) as Bit32;

    return shiftMuxOutputData.map((dt, indx) => mux2To1(
        dt,
        shiftMuxOutputData[shiftMuxOutputData.length - (indx + 1)],
        shiftDir // shiftDir = 0 is left shift, 1 is right shift, on right shift reverse the reversed data
    )) as Bit32;
}