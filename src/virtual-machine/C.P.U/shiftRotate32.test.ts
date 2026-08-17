import { describe, expect, it } from "vitest";

import { shiftRotate32 } from "./shiftRotate32";
import type { Bit32 } from "../types";
import { decimalToBinary } from "../utils/convertion";

/**
 * Convert a JS number into Bit32.
 */
function toBit32(value: number): Bit32 {
    return decimalToBinary(value >>> 0, 32) as Bit32;
}

/**
 * Convert Bit32 back into an unsigned JS number.
 */
function fromBit32(bits: Bit32): number {
    return parseInt(bits.join(""), 2) >>> 0;
}

/**
 * Reference implementation.
 *
 * IMPORTANT:
 * This is deliberately written using normal JS operations.
 * It is the "truth model" against which the gate implementation
 * is tested.
 */
function referenceShiftRotate(
    data: number,
    shiftBy: number,
    shiftDir: 0 | 1,
    rotate: 0 | 1
): number {
    data >>>= 0;
    shiftBy >>>= 0;

    if (rotate) {
        const amount = shiftBy % 32;

        if (amount === 0) {
            return data;
        }

        if (shiftDir === 0) {
            // left rotate
            return (
                ((data << amount) |
                    (data >>> (32 - amount))) >>> 0
            );
        }

        // right rotate
        return (
            ((data >>> amount) |
                (data << (32 - amount))) >>> 0
        );
    }

    // Normal logical shift.
    //
    // Your implementation considers shift >= 32 invalid.
    if (shiftBy >= 32) {
        return 0;
    }

    if (shiftDir === 0) {
        // logical left shift
        return (data << shiftBy) >>> 0;
    }

    // logical right shift
    return data >>> shiftBy;
}

function run(
    data: number,
    shiftBy: number,
    shiftDir: 0 | 1,
    rotate: 0 | 1
): number {
    const result = shiftRotate32(
        toBit32(data),
        toBit32(shiftBy),
        shiftDir,
        rotate
    );

    return fromBit32(result);
}

describe("shiftRotate32", () => {

    // ------------------------------------------------------------
    // BASIC SANITY TESTS
    // ------------------------------------------------------------

    describe("basic behavior", () => {

        it("does nothing when shifting by zero", () => {
            const values = [
                0x00000000,
                0x00000001,
                0xffffffff,
                0xaaaaaaaa,
                0x55555555,
                0x80000000,
                0x00000001,
                0x12345678,
                0xdeadbeef,
            ];

            for (const data of values) {
                expect(run(data, 0, 0, 0)).toBe(data >>> 0);
                expect(run(data, 0, 1, 0)).toBe(data >>> 0);
                expect(run(data, 0, 0, 1)).toBe(data >>> 0);
                expect(run(data, 0, 1, 1)).toBe(data >>> 0);
            }
        });

        it("shifting zero always produces zero", () => {
            for (let shift = 0; shift < 32; shift++) {
                expect(run(0, shift, 0, 0)).toBe(0);
                expect(run(0, shift, 1, 0)).toBe(0);
            }
        });

        it("rotating zero always produces zero", () => {
            for (let shift = 0; shift < 100; shift++) {
                expect(run(0, shift, 0, 1)).toBe(0);
                expect(run(0, shift, 1, 1)).toBe(0);
            }
        });

        it("shifting all ones behaves correctly", () => {
            const data = 0xffffffff;

            for (let shift = 0; shift < 32; shift++) {
                expect(run(data, shift, 0, 0))
                    .toBe(referenceShiftRotate(data, shift, 0, 0));

                expect(run(data, shift, 1, 0))
                    .toBe(referenceShiftRotate(data, shift, 1, 0));
            }
        });

        it("rotating all ones does nothing", () => {
            const data = 0xffffffff;

            for (let shift = 0; shift < 100; shift++) {
                expect(run(data, shift, 0, 1)).toBe(data);
                expect(run(data, shift, 1, 1)).toBe(data);
            }
        });
    });


    // ------------------------------------------------------------
    // EXHAUSTIVE SHIFT AMOUNTS
    // ------------------------------------------------------------

    describe("all valid shift amounts", () => {

        const dataPatterns = [
            0x00000000,
            0xffffffff,
            0xaaaaaaaa,
            0x55555555,
            0x80000000,
            0x00000001,
            0x80000001,
            0x7fffffff,
            0x12345678,
            0x87654321,
            0xdeadbeef,
            0xcafebabe,
        ];

        for (const data of dataPatterns) {
            for (let shift = 0; shift < 32; shift++) {

                it(
                    `left shift: 0x${data.toString(16)} << ${shift}`,
                    () => {
                        expect(run(data, shift, 0, 0))
                            .toBe(
                                referenceShiftRotate(
                                    data,
                                    shift,
                                    0,
                                    0
                                )
                            );
                    }
                );

                it(
                    `right shift: 0x${data.toString(16)} >> ${shift}`,
                    () => {
                        expect(run(data, shift, 1, 0))
                            .toBe(
                                referenceShiftRotate(
                                    data,
                                    shift,
                                    1,
                                    0
                                )
                            );
                    }
                );
            }
        }
    });


    // ------------------------------------------------------------
    // EXHAUSTIVE ROTATION
    // ------------------------------------------------------------

    describe("all rotation amounts", () => {

        const dataPatterns = [
            0x00000000,
            0xffffffff,
            0xaaaaaaaa,
            0x55555555,
            0x80000000,
            0x00000001,
            0x80000001,
            0x7fffffff,
            0x12345678,
            0x87654321,
            0xdeadbeef,
            0xcafebabe,
        ];

        for (const data of dataPatterns) {
            for (let shift = 0; shift < 64; shift++) {

                it(
                    `left rotate: 0x${data.toString(16)} rol ${shift}`,
                    () => {
                        expect(run(data, shift, 0, 1))
                            .toBe(
                                referenceShiftRotate(
                                    data,
                                    shift,
                                    0,
                                    1
                                )
                            );
                    }
                );

                it(
                    `right rotate: 0x${data.toString(16)} ror ${shift}`,
                    () => {
                        expect(run(data, shift, 1, 1))
                            .toBe(
                                referenceShiftRotate(
                                    data,
                                    shift,
                                    1,
                                    1
                                )
                            );
                    }
                );
            }
        }
    });


    // ------------------------------------------------------------
    // CRITICAL BOUNDARY VALUES
    // ------------------------------------------------------------

    describe("boundary shift amounts", () => {

        const shifts = [
            0,
            1,
            2,
            3,
            4,
            7,
            8,
            15,
            16,
            17,
            23,
            24,
            30,
            31,
            32,
            33,
            63,
            64,
            65,
            127,
            128,
            255,
            256,
            1023,
            0xffffffff,
        ];

        const data = [
            0x00000000,
            0x00000001,
            0x80000000,
            0xffffffff,
            0xaaaaaaaa,
            0x55555555,
            0x12345678,
            0xdeadbeef,
        ];

        for (const value of data) {
            for (const shift of shifts) {

                it(
                    `boundary: data=0x${value.toString(16)}, shift=${shift}`,
                    () => {

                        expect(run(value, shift, 0, 0))
                            .toBe(
                                referenceShiftRotate(
                                    value,
                                    shift,
                                    0,
                                    0
                                )
                            );

                        expect(run(value, shift, 1, 0))
                            .toBe(
                                referenceShiftRotate(
                                    value,
                                    shift,
                                    1,
                                    0
                                )
                            );

                        expect(run(value, shift, 0, 1))
                            .toBe(
                                referenceShiftRotate(
                                    value,
                                    shift,
                                    0,
                                    1
                                )
                            );

                        expect(run(value, shift, 1, 1))
                            .toBe(
                                referenceShiftRotate(
                                    value,
                                    shift,
                                    1,
                                    1
                                )
                            );
                    }
                );
            }
        }
    });


    // ------------------------------------------------------------
    // SINGLE-BIT TESTS
    // ------------------------------------------------------------

    describe("single-bit patterns", () => {

        for (let bit = 0; bit < 32; bit++) {

            const data = (2 ** bit) >>> 0;

            for (let shift = 0; shift < 32; shift++) {

                it(
                    `single bit ${bit}, left shift ${shift}`,
                    () => {
                        expect(run(data, shift, 0, 0))
                            .toBe(
                                referenceShiftRotate(
                                    data,
                                    shift,
                                    0,
                                    0
                                )
                            );
                    }
                );

                it(
                    `single bit ${bit}, right shift ${shift}`,
                    () => {
                        expect(run(data, shift, 1, 0))
                            .toBe(
                                referenceShiftRotate(
                                    data,
                                    shift,
                                    1,
                                    0
                                )
                            );
                    }
                );

                it(
                    `single bit ${bit}, left rotate ${shift}`,
                    () => {
                        expect(run(data, shift, 0, 1))
                            .toBe(
                                referenceShiftRotate(
                                    data,
                                    shift,
                                    0,
                                    1
                                )
                            );
                    }
                );

                it(
                    `single bit ${bit}, right rotate ${shift}`,
                    () => {
                        expect(run(data, shift, 1, 1))
                            .toBe(
                                referenceShiftRotate(
                                    data,
                                    shift,
                                    1,
                                    1
                                )
                            );
                    }
                );
            }
        }
    });


    // ------------------------------------------------------------
    // ROTATION INVARIANTS
    // ------------------------------------------------------------

    describe("rotation invariants", () => {

        const values = [
            0x12345678,
            0xdeadbeef,
            0x80000001,
            0xaaaaaaaa,
            0x55555555,
        ];

        it("rotating by 32 returns the original value", () => {
            for (const data of values) {
                expect(run(data, 32, 0, 1)).toBe(data >>> 0);
                expect(run(data, 32, 1, 1)).toBe(data >>> 0);
            }
        });

        it("rotating by 64 returns the original value", () => {
            for (const data of values) {
                expect(run(data, 64, 0, 1)).toBe(data >>> 0);
                expect(run(data, 64, 1, 1)).toBe(data >>> 0);
            }
        });

        it("rotate by N is equivalent to rotate by N % 32", () => {
            for (const data of values) {
                for (let shift = 0; shift < 128; shift++) {

                    expect(run(data, shift, 0, 1))
                        .toBe(run(data, shift % 32, 0, 1));

                    expect(run(data, shift, 1, 1))
                        .toBe(run(data, shift % 32, 1, 1));
                }
            }
        });

        it("left rotate N followed by right rotate N restores the value", () => {
            for (const data of values) {
                for (let shift = 0; shift < 32; shift++) {

                    const rotated = run(data, shift, 0, 1);

                    const restored = run(
                        rotated,
                        shift,
                        1,
                        1
                    );

                    expect(restored).toBe(data >>> 0);
                }
            }
        });
    });


    // ------------------------------------------------------------
    // SHIFT INVARIANTS
    // ------------------------------------------------------------

    describe("shift invariants", () => {

        it("left shifting by 31 only preserves the original LSB", () => {
            expect(run(0x00000001, 31, 0, 0))
                .toBe(0x80000000);

            expect(run(0x00000000, 31, 0, 0))
                .toBe(0);

            expect(run(0x00000002, 31, 0, 0))
                .toBe(0);
        });

        it("right shifting by 31 only preserves the original MSB", () => {
            expect(run(0x80000000, 31, 1, 0))
                .toBe(1);

            expect(run(0x00000000, 31, 1, 0))
                .toBe(0);

            expect(run(0x40000000, 31, 1, 0))
                .toBe(0);
        });

        it("shift >= 32 produces zero", () => {
            const values = [
                0,
                1,
                0xffffffff,
                0x80000000,
                0x12345678,
                0xdeadbeef,
            ];

            const shifts = [
                32,
                33,
                63,
                64,
                127,
                255,
                256,
                1024,
                0xffffffff,
            ];

            for (const data of values) {
                for (const shift of shifts) {
                    expect(run(data, shift, 0, 0)).toBe(0);
                    expect(run(data, shift, 1, 0)).toBe(0);
                }
            }
        });
    });


    // ------------------------------------------------------------
    // RANDOMIZED FUZZ TEST
    // ------------------------------------------------------------

    describe("randomized testing", () => {

        it("passes 1,000 random cases", () => {

            for (let i = 0; i < 1_000; i++) {

                const data =
                    Math.floor(Math.random() * 0x100000000) >>> 0;

                const shift =
                    Math.floor(Math.random() * 0x100000000) >>> 0;

                const shiftDir =
                    Math.random() < 0.5 ? 0 : 1;

                const rotate =
                    Math.random() < 0.5 ? 0 : 1;

                const actual = run(
                    data,
                    shift,
                    shiftDir,
                    rotate
                );

                const expected = referenceShiftRotate(
                    data,
                    shift,
                    shiftDir,
                    rotate
                );

                expect(actual).toBe(expected);
            }
        });
    });
});