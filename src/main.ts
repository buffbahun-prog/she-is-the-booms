import { bitAdderSubstractor32 } from "./virtual-machine/C.P.U/adders";
import { Clock } from "./virtual-machine/C.P.U/clock";
import { orGate } from "./virtual-machine/C.P.U/gates";
import { mux2To1, mux32Bit2To1 } from "./virtual-machine/C.P.U/mux_demux";
import { ProgramCounter } from "./virtual-machine/C.P.U/program-counter";
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