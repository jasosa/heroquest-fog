// ═══════════════════════════════════════════════
//  REAL HEROQUEST BOARD  (26 cols × 19 rows)
//  "C"   = corridor
//  "R1"–"R22" = named rooms
// ═══════════════════════════════════════════════
const C = "C";
const R1  = "R1";  const R2  = "R2";  const R3  = "R3";
const R4  = "R4";  const R5  = "R5";  const R6  = "R6";
const R7  = "R7";  const R8  = "R8";  const R9  = "R9";
const R10 = "R10"; const R11 = "R11"; const R12 = "R12";
const R13 = "R13"; const R14 = "R14"; const R15 = "R15";
const R16 = "R16"; const R17 = "R17"; const R18 = "R18";
const R19 = "R19"; const R20 = "R20"; const R21 = "R21";
const R22 = "R22";

//  0    1    2    3    4    5    6    7    8    9    10   11   12   13    14   15   16    17   18   19   20    21   22   23   24   25
export const BOARD = [
  [ C,   C,   C,   C,   C,   C,   C,   C,   C,   C,    C,   C,   C,   C,    C,   C,    C,   C,   C,   C,   C,   C,   C,   C,    C,  C], // 0
  [ C,  R1,  R1,  R1,  R1,  R2,  R2,  R2,  R2,  R3,   R3,  R3,   C,   C,   R7,  R7,   R7,  R8,  R8,  R8,  R8,  R9,  R9,  R9,   R9,  C], // 1
  [ C,  R1,  R1,  R1,  R1,  R2,  R2,  R2,  R2,  R3,   R3,  R3,   C,   C,   R7,  R7,   R7,  R8,  R8,  R8,  R8,  R9,  R9,  R9,   R9,  C], // 2
  [ C,  R1,  R1,  R1,  R1,  R2,  R2,  R2,  R2,  R3,   R3,  R3,   C,   C,   R7,  R7,   R7,  R8,  R8,  R8,  R8,  R9,  R9,  R9,   R9,  C], // 3
  [ C,  R4,  R4,  R4,  R4,  R5,  R5,  R5,  R5,  R3,   R3,  R3,   C,   C,   R7,  R7,   R7,  R8,  R8,  R8,  R8,  R9,  R9,  R9,   R9,  C], // 4
  [ C,  R4,  R4,  R4,  R4,  R5,  R5,  R5,  R5,  R3,   R3,  R3,   C,   C,   R7,  R7,   R7, R10, R10, R10, R10, R11, R11, R11,  R11,  C], // 5
  [ C,  R4,  R4,  R4,  R4,  R5,  R5,  R5,  R5,   C,    C,   C,   C,   C,    C,   C,    C, R10, R10, R10, R10, R11, R11, R11,  R11,  C], // 6
  [ C,  R4,  R4,  R4,  R4,  R5,  R5,  R5,  R5,   C,   R6,  R6,  R6,  R6,   R6,  R6,   C,  R10, R10, R10, R10, R11, R11, R11,  R11,  C], // 7
  [ C,  R4,  R4,  R4,  R4,  R5,  R5,  R5,  R5,   C,   R6,  R6,  R6,  R6,   R6,  R6,   C,  R10, R10, R10, R10, R11, R11, R11,  R11,  C], // 8
  [ C,   C,   C,   C,   C,   C,   C,   C,   C,   C,   R6,  R6,  R6,  R6,   R6,  R6,   C,    C,   C,   C,   C,   C,   C,   C,    C,  C], // 9
  [ C,  R12, R12, R12, R12, R13, R13, R14, R14,  C,   R6,  R6,  R6,  R6,   R6,  R6,   C,  R18, R18, R18, R18, R19, R19, R19,  R19,  C], // 10
  [ C,  R12, R12, R12, R12, R13, R13, R14, R14,  C,   R6,  R6,  R6,  R6,   R6,  R6,   C,  R18, R18, R18, R18, R19, R19, R19,  R19,  C], // 11
  [ C,  R12, R12, R12, R12, R13, R13, R14, R14,  C,    C,   C,   C,   C,    C,   C,   C,   R18, R18, R18, R18, R19, R19, R19,  R19,  C], // 12
  [ C,  R12, R12, R12, R12, R16, R16, R16, R16, R17, R17, R17,   C,   C,  R20, R20,  R20, R20, R18, R18, R18, R19, R19, R19,  R19,  C], // 13
  [ C,  R15, R15, R15, R15, R16, R16, R16, R16, R17, R17, R17,   C,   C,  R20, R20,  R20, R20, R21, R21, R21, R22, R22, R22,  R22,  C], // 14
  [ C,  R15, R15, R15, R15, R16, R16, R16, R16, R17, R17, R17,   C,   C,  R20, R20,  R20, R20, R21, R21, R21, R22, R22, R22,  R22,  C], // 15
  [ C,  R15, R15, R15, R15, R16, R16, R16, R16, R17, R17, R17,   C,   C,  R20, R20,  R20, R20, R21, R21, R21, R22, R22, R22,  R22,  C], // 16
  [ C,  R15, R15, R15, R15, R16, R16, R16, R16, R17, R17, R17,   C,   C,  R20, R20,  R20, R20, R21, R21, R21, R22, R22, R22,  R22,  C], // 17
  [ C,   C,   C,   C,   C,   C,   C,   C,   C,   C,    C,   C,   C,   C,    C,   C,    C,   C,   C,   C,   C,   C,   C,   C,    C,  C], // 18
];

export const ROWS = 19;
export const COLS = 26;
export const CELL = 37; // pixels per grid cell
