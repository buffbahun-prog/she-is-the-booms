import { bitAdderSubstractor32 } from "./virtual-machine/C.P.U/adders";
import { Clock } from "./virtual-machine/C.P.U/clock";
import { orGate } from "./virtual-machine/C.P.U/gates";
import { mux2To1, mux32Bit2To1 } from "./virtual-machine/C.P.U/mux_demux";
import { ProgramCounter } from "./virtual-machine/C.P.U/program-counter";
import { logicalLeftShifter } from "./virtual-machine/C.P.U/shifter_rotator";
import type { Bit32 } from "./virtual-machine/types";
import { binaryToDecimal, decimalToBinary } from "./virtual-machine/utils/convertion";

// SET THIS: Set to true if your circuit automatically flips carryOut to act 
// as an active-high Borrow Flag during subtraction operations.
const INVERT_CARRY_FOR_BORROW = false; 

interface TestCase {
  desc: string;
  subMode: 0 | 1;
  inp0: number;
  inp1: number;
  expSumHex: string;
  expCarryOut: 0 | 1;
  expOverflow: 0 | 1;
}

const testCases: TestCase[] = [
  // --- ADDITION TESTS (subMode = 0) ---
  { desc: "Addition: 5 + 2", subMode: 0, inp0: 5, inp1: 2, expSumHex: "0x00000007", expCarryOut: 0, expOverflow: 0 },
  { desc: "Addition: -5 + -2", subMode: 0, inp0: -5, inp1: -2, expSumHex: "0xFFFFFFF9", expCarryOut: 1, expOverflow: 0 },
  { desc: "Addition: Signed Positive Overflow (Max + 1)", subMode: 0, inp0: 2147483647, inp1: 1, expSumHex: "0x80000000", expCarryOut: 0, expOverflow: 1 },
  { desc: "Addition: Signed Negative Overflow (Min + -1)", subMode: 0, inp0: -2147483648, inp1: -1, expSumHex: "0x7FFFFFFF", expCarryOut: 1, expOverflow: 1 },
  { desc: "Addition: Max Unsigned Limits (All Bits High)", subMode: 0, inp0: -1, inp1: -1, expSumHex: "0xFFFFFFFE", expCarryOut: 1, expOverflow: 0 },

  // --- SUBTRACTION TESTS (subMode = 1) ---
  { desc: "Subtraction: 5 - 2", subMode: 1, inp0: 5, inp1: 2, expSumHex: "0x00000003", expCarryOut: 1, expOverflow: 0 },
  { desc: "Subtraction: 2 - 5 (Negative Result)", subMode: 1, inp0: 2, inp1: 5, expSumHex: "0xFFFFFFFD", expCarryOut: 0, expOverflow: 0 },
  { desc: "Subtraction: -5 - (-2)", subMode: 1, inp0: -5, inp1: -2, expSumHex: "0xFFFFFFFD", expCarryOut: 0, expOverflow: 0 },
  { desc: "Subtraction: Signed Overflow (Max - -1)", subMode: 1, inp0: 2147483647, inp1: -1, expSumHex: "0x80000000", expCarryOut: 0, expOverflow: 1 },
  { desc: "Subtraction: Signed Overflow (Min - 1)", subMode: 1, inp0: -2147483648, inp1: 1, expSumHex: "0x7FFFFFFF", expCarryOut: 1, expOverflow: 1 },
  { desc: "Subtraction: Equal numbers x - x", subMode: 1, inp0: 0x12345678, inp1: 0x12345678, expSumHex: "0x00000000", expCarryOut: 1, expOverflow: 0 },
  { desc: "Subtraction: Boundary Borrow Check (0 - 1)", subMode: 1, inp0: 0, inp1: 1, expSumHex: "0xFFFFFFFF", expCarryOut: 0, expOverflow: 0 },

  // --- EXTREME BOUNDARY ADDITIONS (subMode = 0) ---
  {
    desc: "Addition: Absolute Max + Absolute Max (Unsigned Wrap)",
    subMode: 0,
    inp0: -1,         // 0xFFFFFFFF (Max Unsigned)
    inp1: -1,         // 0xFFFFFFFF
    expSumHex: "0xFFFFFFFE",
    expCarryOut: 1,
    expOverflow: 0    // Signed interpretation: -1 + -1 = -2 (Valid)
  },
  {
    desc: "Addition: Signed Min + Signed Min (Severe Signed Overflow)",
    subMode: 0,
    inp0: -2147483648, // 0x80000000 (Min Signed)
    inp1: -2147483648, // 0x80000000
    expSumHex: "0x00000000",
    expCarryOut: 1,
    expOverflow: 1    // Two negatives made a zero (Invalid signed math!)
  },
  {
    desc: "Addition: Signed Min + Signed Max (Identity Alignment)",
    subMode: 0,
    inp0: -2147483648, // 0x80000000
    inp1: 2147483647,  // 0x7FFFFFFF
    expSumHex: "0xFFFFFFFF", // -1 in signed decimal
    expCarryOut: 0,
    expOverflow: 0
  },

  // --- EXTREME BOUNDARY SUBTRACTIONS (subMode = 1) ---
  {
    desc: "Subtraction: 0 - Max Unsigned (Underflow Boundary)",
    subMode: 1,
    inp0: 0,
    inp1: -1,         // 0xFFFFFFFF
    expSumHex: "0x00000001",
    expCarryOut: 0,   // 0 < Max Unsigned, requires a borrow
    expOverflow: 0
  },
  {
    desc: "Subtraction: Max Unsigned - 0",
    subMode: 1,
    inp0: -1,         // 0xFFFFFFFF
    inp1: 0,
    expSumHex: "0xFFFFFFFF",
    expCarryOut: 1,   // Max > 0, no borrow required
    expOverflow: 0
  },
  {
    desc: "Subtraction: Signed Min - Signed Max (Signed Overflow)",
    subMode: 1,
    inp0: -2147483648, // 0x80000000
    inp1: 2147483647,  // 0x7FFFFFFF
    expSumHex: "0x00000001",
    expCarryOut: 1,   // Raw binary arithmetic results in carryOut 1
    expOverflow: 1    // Negative minus positive resulted in positive
  },
  {
    desc: "Subtraction: Signed Max - Signed Min (Signed Overflow)",
    subMode: 1,
    inp0: 2147483647,  // 0x7FFFFFFF
    inp1: -2147483648, // 0x80000000
    expSumHex: "0xFFFFFFFF",
    expCarryOut: 0,   // Raw binary arithmetic results in carryOut 0
    expOverflow: 1    // Positive minus negative resulted in negative
  },

  // --- SPECIAL BIT PATTERNS & MATH IDENTITIES ---
  {
    desc: "Pattern Check: Alternating Bits Addition",
    subMode: 0,
    inp0: 0x55555555, // 01010101...
    inp1: 0xAAAAAAAA, // 10101010...
    expSumHex: "0xFFFFFFFF",
    expCarryOut: 0,
    expOverflow: 0
  },
  {
    desc: "Pattern Check: Alternating Bits Subtraction",
    subMode: 1,
    inp0: 0x55555555,
    inp1: 0xAAAAAAAA,
    expSumHex: "0xAAAAAAAB", // Corrected from 0xAAAAAAAA
    expCarryOut: 0,   
    expOverflow: 1           // Corrected from 0 (Positive - Negative = Negative)
  },
  {
    desc: "Identity Check: Zero Minus Signed Minimum",
    subMode: 1,
    inp0: 0,
    inp1: -2147483648, // 0x80000000
    expSumHex: "0x80000000",
    expCarryOut: 0,   // 0 < 0x80000000 (unsigned context), requires borrow
    expOverflow: 1    // 0 - (-Min) wraps back around to a negative!
  }
];


// Helper to convert any integer safely to signed 32-bit binary arrays
function numberToBit32(num: number): Bit32 {
  const buffer = new BigUint64Array(1);
  buffer[0] = BigInt(num);
  const val32 = Number(buffer[0] & 0xFFFFFFFFn);
  return val32.toString(2).padStart(32, "0").split("").map(dg => dg === "0" ? 0 : 1) as Bit32;
}

// Helper to translate bit array back to a Hex string for clear comparison
function bit32ToHex(bits: number[]): string {
  const binaryString = bits.join("");
  const hex = parseInt(binaryString, 2).toString(16).toUpperCase();
  return "0x" + hex.padStart(8, "0");
}

let passedCount = 0;

console.log("=== STARTING 32-BIT ADDER-SUBTRACTOR TEST BENCH ===\n");

testCases.forEach((tc, index) => {
  const val1 = numberToBit32(tc.inp0);
  const val2 = numberToBit32(tc.inp1);

  // Execute your virtual machine implementation
  const [sumBits, carryOut, overflow] = bitAdderSubstractor32(tc.subMode, orGate(0, tc.subMode), val1, val2);

  const actualSumHex = bit32ToHex(sumBits);
  
  // Handle x86 vs Raw flag adjustments automatically for reporting
  let expectedCarry = tc.expCarryOut;
  if (tc.subMode === 1 && INVERT_CARRY_FOR_BORROW) {
    expectedCarry = expectedCarry === 1 ? 0 : 1;
  }

  const sumPassed = actualSumHex === tc.expSumHex;
  const carryPassed = carryOut === expectedCarry;
  const overflowPassed = overflow === tc.expOverflow;

  if (sumPassed && carryPassed && overflowPassed) {
    console.log(` ✅ Test ${index + 1} Passed: ${tc.desc}`);
    passedCount++;
  } else {
    console.log(` ❌ Test ${index + 1} FAILED: ${tc.desc}`);
    console.log(`    Inputs:   inp0: ${tc.inp0} | inp1: ${tc.inp1} | subMode: ${tc.subMode}`);
    if (!sumPassed)       console.log(`    Sum:      Expected ${tc.expSumHex}, Got ${actualSumHex}`);
    if (!carryPassed)     console.log(`    CarryOut: Expected ${expectedCarry}, Got ${carryOut}`);
    if (!overflowPassed)  console.log(`    Overflow: Expected ${tc.expOverflow}, Got ${overflow}`);
    console.log("");
  }
});

console.log(`\n=== TEST RUN COMPLETE: ${passedCount}/${testCases.length} PASSED ===`);

// const clock = new Clock(1);

// clock.addEventListener("clk", (evt) => {
//   console.log("evt", evt);
// });

const counter = new ProgramCounter();
counter.clear();
console.log(binaryToDecimal(counter.get()));
counter.increment();
console.log(binaryToDecimal(counter.get()));
counter.set(decimalToBinary(1036, 32) as Bit32);
console.log(binaryToDecimal(counter.get()));
counter.increment();
console.log(binaryToDecimal(counter.get()));
counter.increment();
console.log(binaryToDecimal(counter.get()));
counter.set([1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0]);
console.log(binaryToDecimal(counter.get()));
counter.increment();
console.log(binaryToDecimal(counter.get()));

console.log(mux2To1(0, 1, 1));
console.log(mux2To1(0, 1, 0));
console.log(mux32Bit2To1(
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  1,
));

// logicalLeftShifter.test.ts

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function bits(binary: string): Bit32 {
    if (binary.length !== 32) {
        throw new Error(`Expected 32-bit string, got ${binary.length} bits`);
    }

    return binary.split("").map(Number) as Bit32;
}

function binary(data: Bit32): string {
    return data.join("");
}

function shiftBits(shift: number): Bit32 {
    if (shift < 0 || shift > 0xFFFFFFFF) {
        throw new Error(`Invalid 32-bit shift value: ${shift}`);
    }

    return bits(
        (shift >>> 0)
            .toString(2)
            .padStart(32, "0")
    );
}

/*
 * Expected result according to the specification of our shifter:
 *
 *   0 <= shift <= 31  -> logical left shift
 *   shift >= 32       -> 32 zeroes
 */
function expectedLeftShift(data: string, shift: number): string {
    const value = parseInt(data, 2) >>> 0;

    if (shift >= 32) {
        return "0".repeat(32);
    }

    return ((value << shift) >>> 0)
        .toString(2)
        .padStart(32, "0");
}

function assertShift(
    data: string,
    shift: number,
    expected?: string
): void {
    const actual = binary(
        logicalLeftShifter(
            bits(data),
            shiftBits(shift)
        )
    );

    const expectedResult =
        expected ?? expectedLeftShift(data, shift);

    if (actual !== expectedResult) {
        throw new Error(
            [
                `FAIL: ${data} << ${shift}`,
                `Expected: ${expectedResult}`,
                `Actual:   ${actual}`,
            ].join("\n")
        );
    }
}

/* -------------------------------------------------------------------------- */
/* 1. Zero shift                                                             */
/* -------------------------------------------------------------------------- */

console.log("1. Zero shift");

assertShift(
    "00000000000000000000000000000000",
    0
);

assertShift(
    "00000000000000000000000000000001",
    0
);

assertShift(
    "11111111111111111111111111111111",
    0
);

assertShift(
    "10101010101010101010101010101010",
    0
);

assertShift(
    "01010101010101010101010101010101",
    0
);

assertShift(
    "11001100110011001100110011001100",
    0
);

/* -------------------------------------------------------------------------- */
/* 2. Simple shifts                                                          */
/* -------------------------------------------------------------------------- */

console.log("2. Simple shifts");

assertShift(
    "00000000000000000000000000000001",
    1
);

assertShift(
    "00000000000000000000000000000001",
    2
);

assertShift(
    "00000000000000000000000000000001",
    3
);

assertShift(
    "00000000000000000000000000000001",
    4
);

assertShift(
    "00000000000000000000000000000001",
    8
);

assertShift(
    "00000000000000000000000000000001",
    16
);

assertShift(
    "00000000000000000000000000000001",
    31
);

/* -------------------------------------------------------------------------- */
/* 3. MSB and LSB boundary tests                                             */
/* -------------------------------------------------------------------------- */

console.log("3. MSB / LSB boundary tests");

// MSB shifted out immediately.
assertShift(
    "10000000000000000000000000000000",
    1
);

// LSB travels all the way to the MSB.
assertShift(
    "00000000000000000000000000000001",
    31
);

// Two low bits: only the second-lowest bit survives a 31-bit shift.
assertShift(
    "00000000000000000000000000000011",
    31
);

// MSB shifted by 31 -> zero.
assertShift(
    "10000000000000000000000000000000",
    31
);

/* -------------------------------------------------------------------------- */
/* 4. All zeroes                                                             */
/* -------------------------------------------------------------------------- */

console.log("4. All zeroes");

for (let shift = 0; shift <= 31; shift++) {
    assertShift(
        "00000000000000000000000000000000",
        shift
    );
}

/* -------------------------------------------------------------------------- */
/* 5. All ones                                                               */
/* -------------------------------------------------------------------------- */

console.log("5. All ones");

for (let shift = 0; shift <= 31; shift++) {
    assertShift(
        "11111111111111111111111111111111",
        shift
    );
}

/* -------------------------------------------------------------------------- */
/* 6. Alternating patterns                                                   */
/* -------------------------------------------------------------------------- */

console.log("6. Alternating patterns");

const alternatingPatterns = [
    "10101010101010101010101010101010",
    "01010101010101010101010101010101",
];

for (const data of alternatingPatterns) {
    for (const shift of [0, 1, 2, 3, 4, 8, 16, 24, 31]) {
        assertShift(data, shift);
    }
}

/* -------------------------------------------------------------------------- */
/* 7. Repeating patterns                                                     */
/* -------------------------------------------------------------------------- */

console.log("7. Repeating patterns");

const repeatingPatterns = [
    "11001100110011001100110011001100",
    "00110011001100110011001100110011",
    "11110000111100001111000011110000",
    "00001111000011110000111100001111",
    "10011001100110011001100110011001",
    "01100110011001100110011001100110",
];

for (const data of repeatingPatterns) {
    for (let shift = 0; shift <= 31; shift++) {
        assertShift(data, shift);
    }
}

/* -------------------------------------------------------------------------- */
/* 8. Interesting arbitrary values                                           */
/* -------------------------------------------------------------------------- */

console.log("8. Arbitrary values");

const arbitraryValues = [
    "00010010001101000101011001111000",
    "10110101100100101110100011010011",
    "11001010111100001111000010101010",
    "01100110100101101001011001101001",
    "10011001100110011001100110011001",
    "11100011101010100101010111100010",
    "01001110110101011000111100101101",
];

for (const data of arbitraryValues) {
    for (const shift of [0, 1, 2, 3, 5, 7, 8, 15, 16, 17, 23, 24, 30, 31]) {
        assertShift(data, shift);
    }
}

/* -------------------------------------------------------------------------- */
/* 9. Every legal shift amount                                               */
/* -------------------------------------------------------------------------- */

console.log("9. Every shift amount: 0–31");

const testData = [
    "00000000000000000000000000000001",
    "00000000000000000000000000000011",
    "10101010101010101010101010101010",
    "01010101010101010101010101010101",
    "11111111111111111111111111111111",
    "10000000000000000000000000000000",
    "11001100110011001100110011001100",
    "00110011001100110011001100110011",
    "10110101100100101110100011010011",
];

for (const data of testData) {
    for (let shift = 0; shift <= 31; shift++) {
        assertShift(data, shift);
    }
}

/* -------------------------------------------------------------------------- */
/* 10. Out-of-range shifts                                                   */
/* -------------------------------------------------------------------------- */

console.log("10. Out-of-range shifts");

// Your implementation explicitly defines:
// shift >= 32 -> zero

const outOfRangeData = [
    "00000000000000000000000000000001",
    "11111111111111111111111111111111",
    "10101010101010101010101010101010",
    "01010101010101010101010101010101",
    "11001100110011001100110011001100",
];

for (const data of outOfRangeData) {
    for (const shift of [32, 33, 34, 63, 64, 127, 128, 255]) {
        assertShift(
            data,
            shift,
            "00000000000000000000000000000000"
        );
    }
}

/* -------------------------------------------------------------------------- */
/* 11. Single-bit exhaustive test                                            */
/* -------------------------------------------------------------------------- */

console.log("11. Single-bit exhaustive test");

for (let position = 0; position < 32; position++) {
    const data = Array(32).fill(0) as Bit32;

    data[position] = 1;

    const dataString = binary(data);

    for (let shift = 0; shift <= 31; shift++) {
        assertShift(dataString, shift);
    }
}

/* -------------------------------------------------------------------------- */
/* 12. Powers of two                                                         */
/* -------------------------------------------------------------------------- */

console.log("12. Powers of two");

for (let position = 0; position < 32; position++) {
    const data = (2 ** position)
        .toString(2)
        .padStart(32, "0");

    for (const shift of [0, 1, 2, 4, 8, 16, 31]) {
        assertShift(data, shift);
    }
}

/* -------------------------------------------------------------------------- */
/* 13. Randomized testing                                                    */
/* -------------------------------------------------------------------------- */

console.log("13. Randomized testing");

for (let i = 0; i < 10_000; i++) {
    const value = Math.floor(Math.random() * 2 ** 32) >>> 0;

    // Include 32 as well because your implementation explicitly
    // considers it invalid.
    const shift = Math.floor(Math.random() * 33);

    const data = value
        .toString(2)
        .padStart(32, "0");

    assertShift(data, shift);
}

/* -------------------------------------------------------------------------- */
/* Done                                                                       */
/* -------------------------------------------------------------------------- */

console.log("======================================");
console.log("All logicalLeftShifter tests passed!");
console.log("======================================");