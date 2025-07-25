use soroban_sdk::{symbol_short, Env};
use tic_tac_toe::{GameStatus, Player, TicTacToeContract, TicTacToeContractClient};

#[test]
fn test_full_game_workflow() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");

    // Create a new game
    let game_id = client.create_game(&player_x);
    assert_eq!(game_id, 1);

    // Join the game with second player
    client.join_game(&game_id, &player_o);

    // Verify initial game state
    let game = client.get_game(&game_id);
    assert_eq!(game.player_x, player_x);
    assert_eq!(game.player_o, player_o);
    assert_eq!(game.current_player, Player::X);
    assert_eq!(game.status, GameStatus::InProgress);

    // Play a complete game where X wins diagonally
    // X | O | X
    // O | X | O
    // ? | ? | X

    // X plays position 0 (top-left)
    let game = client.make_move(&game_id, &player_x, &0);
    assert_eq!(game.current_player, Player::O);
    assert_eq!(game.status, GameStatus::InProgress);

    // O plays position 1 (top-center)
    let game = client.make_move(&game_id, &player_o, &1);
    assert_eq!(game.current_player, Player::X);
    assert_eq!(game.status, GameStatus::InProgress);

    // X plays position 4 (center)
    let game = client.make_move(&game_id, &player_x, &4);
    assert_eq!(game.current_player, Player::O);
    assert_eq!(game.status, GameStatus::InProgress);

    // O plays position 3 (middle-left)
    let game = client.make_move(&game_id, &player_o, &3);
    assert_eq!(game.current_player, Player::X);
    assert_eq!(game.status, GameStatus::InProgress);

    // X plays position 8 (bottom-right) - winning move
    let game = client.make_move(&game_id, &player_x, &8);
    assert_eq!(game.status, GameStatus::XWins);

    // Verify final board state
    let board = client.get_board(&game_id);
    assert_eq!(board.get(0).unwrap(), Some(Player::X));
    assert_eq!(board.get(1).unwrap(), Some(Player::O));
    assert_eq!(board.get(2).unwrap(), None);
    assert_eq!(board.get(3).unwrap(), Some(Player::O));
    assert_eq!(board.get(4).unwrap(), Some(Player::X));
    assert_eq!(board.get(5).unwrap(), None);
    assert_eq!(board.get(6).unwrap(), None);
    assert_eq!(board.get(7).unwrap(), None);
    assert_eq!(board.get(8).unwrap(), Some(Player::X));
}

#[test]
fn test_multiple_concurrent_games() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    // Create multiple games
    let game1_id = client.create_game(&symbol_short!("alice"));
    let game2_id = client.create_game(&symbol_short!("charlie"));
    let game3_id = client.create_game(&symbol_short!("eve"));

    assert_eq!(game1_id, 1);
    assert_eq!(game2_id, 2);
    assert_eq!(game3_id, 3);

    // Join the games with second players
    client.join_game(&game1_id, &symbol_short!("bob"));
    client.join_game(&game2_id, &symbol_short!("david"));
    client.join_game(&game3_id, &symbol_short!("frank"));

    // Make moves in different games
    client.make_move(&game1_id, &symbol_short!("alice"), &0);
    client.make_move(&game2_id, &symbol_short!("charlie"), &4);
    client.make_move(&game3_id, &symbol_short!("eve"), &8);

    // Verify each game maintains its own state
    let board1 = client.get_board(&game1_id);
    let board2 = client.get_board(&game2_id);
    let board3 = client.get_board(&game3_id);

    assert_eq!(board1.get(0).unwrap(), Some(Player::X));
    assert_eq!(board1.get(4).unwrap(), None);
    assert_eq!(board1.get(8).unwrap(), None);

    assert_eq!(board2.get(0).unwrap(), None);
    assert_eq!(board2.get(4).unwrap(), Some(Player::X));
    assert_eq!(board2.get(8).unwrap(), None);

    assert_eq!(board3.get(0).unwrap(), None);
    assert_eq!(board3.get(4).unwrap(), None);
    assert_eq!(board3.get(8).unwrap(), Some(Player::X));
}

#[test]
fn test_game_persistence() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");

    // Create and play several moves
    let game_id = client.create_game(&player_x);
    client.join_game(&game_id, &player_o);
    client.make_move(&game_id, &player_x, &0);
    client.make_move(&game_id, &player_o, &1);
    client.make_move(&game_id, &player_x, &2);

    // Retrieve game state multiple times to ensure persistence
    let game1 = client.get_game(&game_id);
    let game2 = client.get_game(&game_id);
    let board1 = client.get_board(&game_id);
    let board2 = client.get_board(&game_id);

    // All retrievals should return identical state
    assert_eq!(game1.board, game2.board);
    assert_eq!(game1.current_player, game2.current_player);
    assert_eq!(game1.status, game2.status);
    assert_eq!(board1, board2);

    // Verify specific game state
    assert_eq!(game1.current_player, Player::O);
    assert_eq!(board1.get(0).unwrap(), Some(Player::X));
    assert_eq!(board1.get(1).unwrap(), Some(Player::O));
    assert_eq!(board1.get(2).unwrap(), Some(Player::X));
}

#[test]
fn test_winning_conditions_comprehensive() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    // Test all possible winning conditions for X

    // Row wins
    for row in 0..3 {
        let game_id = client.create_game(&symbol_short!("alice"));
        client.join_game(&game_id, &symbol_short!("bob"));

        // X wins the row, O plays other positions
        for col in 0..3 {
            let pos = row * 3 + col;
            client.make_move(&game_id, &symbol_short!("alice"), &pos);

            if col < 2 {
                // Don't make O move after winning move
                let o_pos = ((row + 1) % 3) * 3 + col;
                client.make_move(&game_id, &symbol_short!("bob"), &o_pos);
            }
        }

        let game = client.get_game(&game_id);
        assert_eq!(game.status, GameStatus::XWins);
    }

    // Column wins
    for col in 0..3 {
        let game_id = client.create_game(&symbol_short!("alice"));
        client.join_game(&game_id, &symbol_short!("bob"));

        for row in 0..3 {
            let pos = row * 3 + col;
            client.make_move(&game_id, &symbol_short!("alice"), &pos);

            if row < 2 {
                // Don't make O move after winning move
                let o_pos = row * 3 + ((col + 1) % 3);
                client.make_move(&game_id, &symbol_short!("bob"), &o_pos);
            }
        }

        let game = client.get_game(&game_id);
        assert_eq!(game.status, GameStatus::XWins);
    }

    // Diagonal wins
    // Main diagonal (0, 4, 8)
    let game_id = client.create_game(&symbol_short!("alice"));
    client.join_game(&game_id, &symbol_short!("bob"));
    client.make_move(&game_id, &symbol_short!("alice"), &0);
    client.make_move(&game_id, &symbol_short!("bob"), &1);
    client.make_move(&game_id, &symbol_short!("alice"), &4);
    client.make_move(&game_id, &symbol_short!("bob"), &2);
    client.make_move(&game_id, &symbol_short!("alice"), &8);

    let game = client.get_game(&game_id);
    assert_eq!(game.status, GameStatus::XWins);

    // Anti-diagonal (2, 4, 6)
    let game_id = client.create_game(&symbol_short!("alice"));
    client.join_game(&game_id, &symbol_short!("bob"));
    client.make_move(&game_id, &symbol_short!("alice"), &2);
    client.make_move(&game_id, &symbol_short!("bob"), &0);
    client.make_move(&game_id, &symbol_short!("alice"), &4);
    client.make_move(&game_id, &symbol_short!("bob"), &1);
    client.make_move(&game_id, &symbol_short!("alice"), &6);

    let game = client.get_game(&game_id);
    assert_eq!(game.status, GameStatus::XWins);
}
