import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  standalone: {
    networkPassphrase: "Standalone Network ; February 2017",
    contractId: "CAMFQABRMCWFSPMCYC2GVBUQ56SN46ILYQT7TX4SYQQIXBN4G4RJ5MNR",
  }
} as const

export type DataKey = {tag: "Game", values: readonly [u32]} | {tag: "GameCounter", values: void};

export type Player = {tag: "X", values: void} | {tag: "O", values: void};

export type GameStatus = {tag: "InProgress", values: void} | {tag: "XWins", values: void} | {tag: "OWins", values: void} | {tag: "Draw", values: void};


export interface Game {
  board: Array<Option<Player>>;
  current_player: Player;
  player_o: string;
  player_x: string;
  status: GameStatus;
}

export interface Client {
  /**
   * Construct and simulate a create_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  create_game: ({player_x, player_o}: {player_x: string, player_o: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a make_move transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  make_move: ({game_id, player, position}: {game_id: u32, player: string, position: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Game>>

  /**
   * Construct and simulate a get_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_game: ({game_id}: {game_id: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Game>>

  /**
   * Construct and simulate a get_board transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_board: ({game_id}: {game_id: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Array<Option<Player>>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAgAAAAEAAAAAAAAABEdhbWUAAAABAAAABAAAAAAAAAAAAAAAC0dhbWVDb3VudGVyAA==",
        "AAAAAgAAAAAAAAAAAAAABlBsYXllcgAAAAAAAgAAAAAAAAAAAAAAAVgAAAAAAAAAAAAAAAAAAAFPAAAA",
        "AAAAAgAAAAAAAAAAAAAACkdhbWVTdGF0dXMAAAAAAAQAAAAAAAAAAAAAAApJblByb2dyZXNzAAAAAAAAAAAAAAAAAAVYV2lucwAAAAAAAAAAAAAAAAAABU9XaW5zAAAAAAAAAAAAAAAAAAAERHJhdw==",
        "AAAAAQAAAAAAAAAAAAAABEdhbWUAAAAFAAAAAAAAAAVib2FyZAAAAAAAA+oAAAPoAAAH0AAAAAZQbGF5ZXIAAAAAAAAAAAAOY3VycmVudF9wbGF5ZXIAAAAAB9AAAAAGUGxheWVyAAAAAAAAAAAACHBsYXllcl9vAAAAEQAAAAAAAAAIcGxheWVyX3gAAAARAAAAAAAAAAZzdGF0dXMAAAAAB9AAAAAKR2FtZVN0YXR1cwAA",
        "AAAAAAAAAAAAAAALY3JlYXRlX2dhbWUAAAAAAgAAAAAAAAAIcGxheWVyX3gAAAARAAAAAAAAAAhwbGF5ZXJfbwAAABEAAAABAAAABA==",
        "AAAAAAAAAAAAAAAJbWFrZV9tb3ZlAAAAAAAAAwAAAAAAAAAHZ2FtZV9pZAAAAAAEAAAAAAAAAAZwbGF5ZXIAAAAAABEAAAAAAAAACHBvc2l0aW9uAAAABAAAAAEAAAfQAAAABEdhbWU=",
        "AAAAAAAAAAAAAAAIZ2V0X2dhbWUAAAABAAAAAAAAAAdnYW1lX2lkAAAAAAQAAAABAAAH0AAAAARHYW1l",
        "AAAAAAAAAAAAAAAJZ2V0X2JvYXJkAAAAAAAAAQAAAAAAAAAHZ2FtZV9pZAAAAAAEAAAAAQAAA+oAAAPoAAAH0AAAAAZQbGF5ZXIAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    create_game: this.txFromJSON<u32>,
        make_move: this.txFromJSON<Game>,
        get_game: this.txFromJSON<Game>,
        get_board: this.txFromJSON<Array<Option<Player>>>
  }
}