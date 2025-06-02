EMCC = emcc
SRC = wind_turbine.cpp
OUT = ../../../src/wasm/wind_turbine.js
EIGEN = ../../../lib/cpp

all:
	$(EMCC) $(SRC) -I$(EIGEN) -O2 \
		--bind -sASSERTIONS \
		-s MODULARIZE=1 \
		-s ALLOW_MEMORY_GROWTH=1 \
		-s ASSERTIONS=2 \
		-s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
		-s EXPORT_ES6=1 \
		-s ENVIRONMENT=web \
		-lembind \
		-O2 \
		-std=c++17 \
		-o $(OUT)

clean:
	rm -f ../../../src/wasm/wind_turbine.*
	rm -f ../../../src/wasm/*.d.ts

