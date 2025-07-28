# Tic-Tac-Toe Smart Contract Agent Guide

## Build/Test Commands
- **Build**: `make build` or `stellar contract build`
- **Unit tests**: `make test` or `cd contracts/tic-tac-toe && cargo test`
- **Integration tests**: `make integration` or `cd tests && cargo test`
- **Single test**: `cargo test -p tic-tac-toe test_name` or `cargo test -p tic-tac-toe-integration-tests test_name`
- **Lint**: `cargo clippy` (format: `cargo fmt`)
- **Frontend**: `cd frontend && npm run dev` (build: `npm run build`, lint: `npm run lint`)

## Architecture
- **Soroban smart contract** (Rust): `contracts/tic-tac-toe/src/lib.rs`
- **React frontend** (TypeScript): `frontend/` with Stellar SDK integration
- **Integration tests**: `tests/` package with full workflow testing
- **Scripts**: `scripts/` for deployment and interaction (bash)
- **Generated bindings**: `bindings/` for TypeScript contract integration

## Code Style
- **Rust**: Standard formatting with `cargo fmt`, `#![no_std]` for contracts
- **Imports**: Use workspace dependencies, `soroban_sdk` for contracts
- **Types**: `#[contracttype]` for Soroban types, proper `Clone, Debug, Eq, PartialEq` derives
- **Testing**: Use `Env::default()`, `symbol_short!()` macros, descriptive test names
- **Error handling**: Return proper Soroban errors, use `panic!` with descriptive messages
- **Frontend**: React functional components, TypeScript strict mode, ESLint rules
