EMCC = emcc
SRC = airfoil_simulator.cpp
OUT = ../../../src/wasm/airfoil_simulator.js
EIGEN = ../../../lib/cpp

all:
	$(EMCC) $(SRC) -I$(EIGEN) -O2 \
		--bind -sASSERTIONS -s MODULARIZE=1 -s EXPORT_ES6=1 -s ENVIRONMENT=web \
		-o $(OUT)

clean:
	rm -f ../../../src/wasm/airfoil_simulator.*
	rm -f ../../../src/wasm/*.d.ts
