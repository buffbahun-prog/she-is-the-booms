import type { Bit, Bit32, Bit8 } from "../types";
import { andGate, orGate, xorGate } from "./gates";

export function halfAdder(bit0: Bit, bit1: Bit): [sum: Bit, carryOut: Bit] {
    return [
        xorGate(bit0, bit1),
        andGate(bit0, bit1),
    ]
}

export function fullAdder(carryIn: Bit, bit0: Bit, bit1: Bit): [sum: Bit, carryOut: Bit] {
    const [sumWithoutCarry, carry1] = halfAdder(bit0, bit1);
    const [sum, carry2] = halfAdder(carryIn, sumWithoutCarry);
    return [
        sum,
        orGate(carry1, carry2),
    ];
}

export function bitAdder8(carryIn: Bit, inp0: Bit8, inp1: Bit8): [sum: Bit8, carryOut: Bit , lastBitCarryIn: Bit] {
    const [sum0, carry0] = fullAdder(carryIn, inp0[7], inp1[7]);
    const [sum1, carry1] = fullAdder(carry0, inp0[6], inp1[6]);
    const [sum2, carry2] = fullAdder(carry1, inp0[5], inp1[5]);
    const [sum3, carry3] = fullAdder(carry2, inp0[4], inp1[4]);
    const [sum4, carry4] = fullAdder(carry3, inp0[3], inp1[3]);
    const [sum5, carry5] = fullAdder(carry4, inp0[2], inp1[2]);
    const [sum6, carry6] = fullAdder(carry5, inp0[1], inp1[1]);
    const [sum7, carry7] = fullAdder(carry6, inp0[0], inp1[0]);


    return [
        [sum7, sum6, sum5, sum4, sum3, sum2, sum1, sum0],
        carry7,
        carry6,
    ]
}

export function bitAdder32(carryIn: Bit, inp0: Bit32, inp1: Bit32): [sum: Bit32, carryOur: Bit, overflow: Bit] {
    const [byte0Sum, carryOut0] = bitAdder8(carryIn,
                                           inp0.slice(24, 32) as Bit8,
                                           inp1.slice(24, 32) as Bit8
                                        );
    const [byte1Sum, carryOut1] = bitAdder8(carryOut0,
                                            inp0.slice(16, 24) as Bit8,
                                            inp1.slice(16, 24) as Bit8,
                                        );
    const [byte2Sum, carryOut2] = bitAdder8(carryOut1,
                                            inp0.slice(8, 16) as Bit8,
                                            inp1.slice(8, 16) as Bit8,
                                        );
    const [byte3Sum, carryOut3, lastBitCarryIn] = bitAdder8(carryOut2,
                                            inp0.slice(0, 8) as Bit8,
                                            inp1.slice(0, 8) as Bit8,
                                        );

    return [
        [...byte3Sum, ...byte2Sum, ...byte1Sum, ...byte0Sum],
        // for add operation if 1 overflow,
        // and for sub 1 means A >= B and the result is positive,
        // so no borrow needed
        carryOut3,
        xorGate(lastBitCarryIn, carryOut3),
    ]
}

export function bitAdderSubstractor32(subMode: Bit, carryIn: Bit, inp0: Bit32, inp1: Bit32): [result: Bit32, carryOut: Bit, overflow: Bit] {
    const invertedOnSubInp1 = inp1.map(bit => xorGate(subMode, bit)) as Bit32;
    return bitAdder32(
        orGate(subMode, carryIn),
        inp0,
        invertedOnSubInp1,
    );
}