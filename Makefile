CPP_DIR = wasm-src/cpp/wind_turbine

.PHONY: all clean rust cpp

all: cpp

rust:
	$(MAKE) -C $(RUST_DIR)

cpp:
	$(MAKE) -C $(CPP_DIR)

clean:
	$(MAKE) -C $(RUST_DIR) clean
	$(MAKE) -C $(CPP_DIR) clean
