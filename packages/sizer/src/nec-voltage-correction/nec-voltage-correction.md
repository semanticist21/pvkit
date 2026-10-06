# nec-voltage-correction — NEC Table 690.7(A) Voc correction factor

For crystalline and multicrystalline silicon modules without a manufacturer coefficient, NEC
690.7(A)(2) multiplies the rated `voc` by a factor looked up from the lowest expected ambient
temperature:

| Ambient °C | Factor | Ambient °C | Factor |
| --- | --- | --- | --- |
| 24 to 20 | 1.02 | −11 to −15 | 1.16 |
| 19 to 15 | 1.04 | −16 to −20 | 1.18 |
| 14 to 10 | 1.06 | −21 to −25 | 1.20 |
| 9 to 5 | 1.08 | −26 to −30 | 1.21 |
| 4 to 0 | 1.10 | −31 to −35 | 1.23 |
| −1 to −5 | 1.12 | −36 to −40 | 1.25 |
| −6 to −10 | 1.14 | | |

Rows are whole degrees; a fractional temperature between two rows takes the colder row (the
higher factor). ≥ 25 °C → 1. Below −40 °C the code defers to the manufacturer → RangeError.
The table is unchanged from NEC 2011 through 2023 (2005/2008 had a coarser 5-row table).

## Reference

- **Spec:** NFPA 70, National Electrical Code 2023, §690.7(A)(2) and Table 690.7(A).
- **Reference implementation:** the table in `scripts/fixtures/sizer.py`, transcribed
  independently of the TS source; rows −20 → 1.18, −23.3 (−10 °F) → 1.20, −30 → 1.21 also
  checked against published worked examples.
- **Fixtures:** `nec-voltage-correction-fixtures.json` (64 cases: both ends of every row,
  between-row values, 25/30 °C, −40/−40.5/−60 °C, 30 random).
- **Tolerance:** exact (table lookup).
