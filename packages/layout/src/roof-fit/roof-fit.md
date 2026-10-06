# roof-fit

Usable span L = side − 2·setback; modules per run n = ⌊(L + g)/(m + g)⌋ for module side m
and gap g (n·m + (n−1)·g ≤ L). Portrait puts the short side along the eave. With no
`orientation`, the one fitting more modules wins (portrait on a tie). The grid is centred
in the usable rectangle.

## Reference

1. Spec — plain packing arithmetic (no paper; single-orientation rectangular grid, as in
   PVWatts/SAM-style roof sketches).
2. Reference implementation — hand counts in the test.
3. No fixture file. Exact integer counts; positions to 1e-12.
