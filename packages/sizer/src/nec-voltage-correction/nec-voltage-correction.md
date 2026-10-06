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

## Reference

- **Spec:** NFPA 70, National Electrical Code 2023, §690.7(A)(2) and Table 690.7(A),
  https://www.nfpa.org/codes-and-standards/nfpa-70-standard-development/70.
- **Table check:** all 13 rows (°C, °F, factor) checked against the NEC 2014 Table 690.7
  reproduced at https://enkonnsolar.com/wp-content/uploads/2023/08/Article-690-Photovoltaic-PV-System.pdf;
  rows 4 … −40 °C also match Mike Holt's 2011 NEC guide (sample at
  https://www.mikeholt.com/instructor2/img/product/pdf/1295899800-sample.pdf). The 2023 text
  sits behind NFPA's free-access login and was not compared row by row.
- **Reference implementation:** the table in `scripts/fixtures/sizer.py` (same author as the
  TS table, so the row check above is the evidence, not their agreement); "between rows →
  colder row" is pvkit's reading of the whole-degree rows.
- **Worked examples (fixture `source` cases):** Mike Holt 2011 guide §690.7, −7 °C → 1.14
  (22.60 V × 1.14 × 23 = 593 V); Penn State AE 868 "Voltage design"
  (https://courses.ems.psu.edu/ae868/node/943), −10 °F → 1.20.
- **Fixtures:** `nec-voltage-correction-fixtures.json` (66 cases: the 2 worked examples, both
  ends of every row, between-row values, 25/30 °C, −40/−40.5/−60 °C, 30 random).
- **Tolerance:** exact (table lookup).
