import type { Bit } from "../types";

export function andGate(bit0: Bit, bit1: Bit): Bit {
    if (bit0 === 1 && bit1 === 1) return 1;
    else return 0;
}

export function orGate(bit0: Bit, bit1: Bit): Bit {
    if (bit0 === 1 || bit1 === 1) return 1;
    else return 0;
}

export function inverter(bit0: Bit): Bit {
    if (bit0 === 0) return 1;
    else return 0;
}

export function nandGate(bit0: Bit, bit1: Bit): Bit {
    return inverter( andGate(bit0, bit1) );
}

export function norGate(bit0: Bit, bit1: Bit): Bit {
    return inverter( orGate(bit0, bit1) );
}

export function xorGate(bit0: Bit, bit1: Bit): Bit {
    return andGate(
        orGate(bit0, bit1),
        nandGate(bit0, bit1),
    );
}