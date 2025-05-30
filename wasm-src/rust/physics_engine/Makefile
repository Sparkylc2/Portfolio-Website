CARGO_HOME := $(realpath ../../../lib/rust/cargo)
RUSTUP_HOME := $(realpath ../../../lib/rust/rustup)

all:
	CARGO_HOME=$(CARGO_HOME) RUSTUP_HOME=$(RUSTUP_HOME) RUSTFLAGS='-C target-feature=+bulk-memory' \
		wasm-pack build --target web --release --out-dir ../../../public/wasm
	rm -f ../../../public/wasm/*.d.ts

clean:
	rm -rf ../../../public/wasm/physics_engine*
	rm -rf $(CARGO_HOME) $(RUSTUP_HOME) ../../../lib/rust/target
