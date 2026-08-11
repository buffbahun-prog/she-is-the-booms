import type { Bit, Bit32 } from "../types";
import { andGate, inverter, orGate } from "./gates";

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