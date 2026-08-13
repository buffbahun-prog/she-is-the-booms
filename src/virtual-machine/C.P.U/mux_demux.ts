import type { Bit, Bit32, Bit5 } from "../types";
import { andGate, andGateNInp, inverter, orGate, orGateNInp } from "./gates";

export function mux2To1(inp0: Bit, inp1: Bit, select: Bit) {
    return (
        orGate(
            andGate(
                inp0,
                inverter(select),
            ),
            andGate(
                inp1,
                select,
            )
        )
    );
}

export function mux32Bit2To1(inp0: Bit32, inp1: Bit32, select: Bit) {
    return inp0.map((_, indx) => mux2To1(
        inp0[indx],
        inp1[indx],
        select,
    )) as Bit32;
}

export function mux32To1(data: Bit32, selectBits: Bit5): Bit {
    return orGateNInp([
        // for select value 00000, the first bit in the data should be selected
        // so all the select inputs inverted
        andGateNInp([
            data[0],
            ...selectBits.map(bit => inverter(bit)),
        ]),
        // for select value 00001, only the first 4 bits needed to be inverted
        andGateNInp([
            data[1],
            ...selectBits.map((bit, indx) => indx !== 4 ? inverter(bit) : bit),
        ]),
        // for select value 00010, except 3rd index bit other needed to be inverted
        andGateNInp([
            data[2],
            ...selectBits.map((bit, indx) => indx !== 3 ? inverter(bit) : bit),
        ]),
        // for select value 00011, except 3rd and 4th index bit other needed to be inverted
        andGateNInp([
            data[3],
            ...selectBits.map((bit, indx) => indx !== 3 && indx !== 4 ? inverter(bit) : bit),
        ]),
        // for select value 00100, except 2nd index bit other needed to be inverted
        andGateNInp([
            data[4],
            ...selectBits.map((bit, indx) => indx !== 2 ? inverter(bit) : bit),
        ]),
        // for select value 00101, except 2nd and 4th index bit other needed to be inverted
        andGateNInp([
            data[5],
            ...selectBits.map((bit, indx) => indx !== 2 && indx !== 4 ? inverter(bit) : bit),
        ]),
        // for select value 00110, except 2nd and 3rd index bit other needed to be inverted
        andGateNInp([
            data[6],
            ...selectBits.map((bit, indx) => indx !== 2 && indx !== 3 ? inverter(bit) : bit),
        ]),
        // for select value 00111, except 2nd, 3rd and 4th index bit other needed to be inverted
        andGateNInp([
            data[7],
            ...selectBits.map((bit, indx) => indx !== 2 && indx !== 3 && indx !== 4 ? inverter(bit) : bit),
        ]),
        // for select value 01000, except 1st index bit other needed to be inverted
        andGateNInp([
            data[8],
            ...selectBits.map((bit, indx) => indx !== 1 ? inverter(bit) : bit),
        ]),
        // for select value 01001, except 1st and 4th index bit other needed to be inverted
        andGateNInp([
            data[9],
            ...selectBits.map((bit, indx) => indx !== 1 && indx !== 4 ? inverter(bit) : bit),
        ]),
        // for select value 01010, except 1st and 3rd index bit other needed to be inverted
        andGateNInp([
            data[10],
            ...selectBits.map((bit, indx) => indx !== 1 && indx !== 3 ? inverter(bit) : bit),
        ]),
        // for select value 01011, except 1st, 3rd and 4th index bit other needed to be inverted
        andGateNInp([
            data[11],
            ...selectBits.map((bit, indx) => indx !== 1 && indx !== 3 && indx !== 4 ? inverter(bit) : bit),
        ]),
        // for select value 01100, except 1st and 2nd index bit other needed to be inverted
        andGateNInp([
            data[12],
            ...selectBits.map((bit, indx) => indx !== 1 && indx !== 2 ? inverter(bit) : bit),
        ]),
        // for select value 01101, except 1st, 2nd and 4th index bit other needed to be inverted
        andGateNInp([
            data[13],
            ...selectBits.map((bit, indx) => indx !== 1 && indx !== 2 && indx !== 4 ? inverter(bit) : bit),
        ]),
        // for select value 01110, except 1st, 2nd and 3rd index bit other needed to be inverted
        andGateNInp([
            data[14],
            ...selectBits.map((bit, indx) => indx !== 1 && indx !== 2 && indx !== 3 ? inverter(bit) : bit),
        ]),
        // for select value 01111, except 1st, 2nd, 3rd and 4th index bit other needed to be inverted
        andGateNInp([
            data[15],
            ...selectBits.map((bit, indx) => indx !== 1 && indx !== 2 && indx !== 3 && indx !== 4 ? inverter(bit) : bit),
        ]),
        // for select value 10000, except 0th index bit other needed to be inverted
        andGateNInp([
            data[16],
            ...selectBits.map((bit, indx) => indx !== 0 ? inverter(bit) : bit),
        ]),
        // for select value 10001, except 0th and 4th index bit other needed to be inverted
        andGateNInp([
            data[17],
            ...selectBits.map((bit, indx) => indx !== 0 && indx !== 4 ? inverter(bit) : bit),
        ]),
        // for select value 10010, except 0th and 3rd index bit other needed to be inverted
        andGateNInp([
            data[18],
            ...selectBits.map((bit, indx) => indx !== 0 && indx !== 3 ? inverter(bit) : bit),
        ]),
        // for select value 10011, except 0th, 3rd and 4th index bit other needed to be inverted
        andGateNInp([
            data[19],
            ...selectBits.map((bit, indx) => indx !== 0 && indx !== 3 && indx !== 4 ? inverter(bit) : bit),
        ]),
        // for select value 10100, except 0th and 2nd index bit other needed to be inverted
        andGateNInp([
            data[20],
            ...selectBits.map((bit, indx) => indx !== 0 && indx !== 2 ? inverter(bit) : bit),
        ]),
        // for select value 10101, except 0th, 2nd and 4th index bit other needed to be inverted
        andGateNInp([
            data[21],
            ...selectBits.map((bit, indx) => indx !== 0 && indx !== 2 && indx !== 4 ? inverter(bit) : bit),
        ]),
        // for select value 10110, except 0th, 2nd and 3rd index bit other needed to be inverted
        andGateNInp([
            data[22],
            ...selectBits.map((bit, indx) => indx !== 0 && indx !== 2 && indx !== 3 ? inverter(bit) : bit),
        ]),
        // for select value 10111, except 0th, 2nd, 3rd and 4th index bit other needed to be inverted
        andGateNInp([
            data[23],
            ...selectBits.map((bit, indx) => indx !== 0 && indx !== 2 && indx !== 3 && indx !== 4 ? inverter(bit) : bit),
        ]),
        // for select value 11000, except 0th and 1st index bit other needed to be inverted
        andGateNInp([
            data[24],
            ...selectBits.map((bit, indx) => indx !== 0 && indx !== 1 ? inverter(bit) : bit),
        ]),
        // for select value 11001, except 0th, 1st and 4th index bit other needed to be inverted
        andGateNInp([
            data[25],
            ...selectBits.map((bit, indx) => indx !== 0 && indx !== 1 && indx !== 4 ? inverter(bit) : bit),
        ]),
        // for select value 11010, except 0th, 1st and 3rd index bit other needed to be inverted
        andGateNInp([
            data[26],
            ...selectBits.map((bit, indx) => indx !== 0 && indx !== 1 && indx !== 3 ? inverter(bit) : bit),
        ]),
        // for select value 11011, except 0th, 1st, 3rd and 4th index bit other needed to be inverted
        andGateNInp([
            data[27],
            ...selectBits.map((bit, indx) => indx !== 0 && indx !== 1 && indx !== 3 && indx !== 4 ? inverter(bit) : bit),
        ]),
        // for select value 11100, except 0th, 1st and 2nd index bit other needed to be inverted
        andGateNInp([
            data[28],
            ...selectBits.map((bit, indx) => indx !== 0 && indx !== 1 && indx !== 2 ? inverter(bit) : bit),
        ]),
        // for select value 11101, except 0th, 1st, 2nd and 4th index bit other needed to be inverted
        andGateNInp([
            data[29],
            ...selectBits.map((bit, indx) => indx !== 0 && indx !== 1 && indx !== 2 && indx !== 4 ? inverter(bit) : bit),
        ]),
        // for select value 11110, except 0th, 1st, 2nd and 3th index bit other needed to be inverted
        andGateNInp([
            data[30],
            ...selectBits.map((bit, indx) => indx !== 0 && indx !== 1 && indx !== 2 && indx !== 3 ? inverter(bit) : bit),
        ]),
        // for select value 11111, nothing need to be inverted
        andGateNInp([
            data[31],
            ...selectBits,
        ]),
    ]);
}

export function demux1to2(dataInp: Bit, select: Bit): [Bit, Bit] {
    return [
        andGate(
            dataInp,
            inverter(select),
        ),
        andGate(
            dataInp,
            select,
        )
    ]
}