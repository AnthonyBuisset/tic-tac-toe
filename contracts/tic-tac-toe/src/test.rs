use super::*;
use soroban_sdk::{symbol_short, Env};

#[test]
fn test_create_game() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");

    let game_id = client.create_game(&player_x, &player_o);
    assert_eq!(game_id, 1);

    let game = client.get_game(&game_id);
    assert_eq!(game.player_x, player_x);
    assert_eq!(game.player_o, player_o);
    assert_eq!(game.current_player, Player::X);
    assert_eq!(game.status, GameStatus::InProgress);
    assert_eq!(game.board.len(), 9);

    for i in 0..9 {
        assert_eq!(game.board.get(i).unwrap(), None);
    }
}

#[test]
fn test_make_move() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");

    let game_id = client.create_game(&player_x, &player_o);

    let game = client.make_move(&game_id, &player_x, &0);
    assert_eq!(game.board.get(0).unwrap(), Some(Player::X));
    assert_eq!(game.current_player, Player::O);
    assert_eq!(game.status, GameStatus::InProgress);

    let game = client.make_move(&game_id, &player_o, &4);
    assert_eq!(game.board.get(4).unwrap(), Some(Player::O));
    assert_eq!(game.current_player, Player::X);
    assert_eq!(game.status, GameStatus::InProgress);
}

#[test]
#[should_panic(expected = "Not your turn")]
fn test_wrong_player_move() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");

    let game_id = client.create_game(&player_x, &player_o);

    client.make_move(&game_id, &player_o, &0);
}

#[test]
#[should_panic(expected = "Position already taken")]
fn test_position_already_taken() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");

    let game_id = client.create_game(&player_x, &player_o);

    client.make_move(&game_id, &player_x, &0);
    client.make_move(&game_id, &player_o, &0);
}

#[test]
#[should_panic(expected = "Invalid position: must be 0-8")]
fn test_invalid_position() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");

    let game_id = client.create_game(&player_x, &player_o);

    client.make_move(&game_id, &player_x, &9);
}

#[test]
fn test_winning_game_x() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");

    let game_id = client.create_game(&player_x, &player_o);

    client.make_move(&game_id, &player_x, &0);
    client.make_move(&game_id, &player_o, &3);
    client.make_move(&game_id, &player_x, &1);
    client.make_move(&game_id, &player_o, &4);
    let game = client.make_move(&game_id, &player_x, &2);

    assert_eq!(game.status, GameStatus::XWins);
}

#[test]
fn test_winning_game_o() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");

    let game_id = client.create_game(&player_x, &player_o);

    client.make_move(&game_id, &player_x, &0);
    client.make_move(&game_id, &player_o, &3);
    client.make_move(&game_id, &player_x, &1);
    client.make_move(&game_id, &player_o, &4);
    client.make_move(&game_id, &player_x, &6);
    let game = client.make_move(&game_id, &player_o, &5);

    assert_eq!(game.status, GameStatus::OWins);
}

#[test]
fn test_draw_game() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");

    let game_id = client.create_game(&player_x, &player_o);

    client.make_move(&game_id, &player_x, &0);
    client.make_move(&game_id, &player_o, &1);
    client.make_move(&game_id, &player_x, &2);
    client.make_move(&game_id, &player_o, &4);
    client.make_move(&game_id, &player_x, &3);
    client.make_move(&game_id, &player_o, &5);
    client.make_move(&game_id, &player_x, &7);
    client.make_move(&game_id, &player_o, &6);
    let game = client.make_move(&game_id, &player_x, &8);

    assert_eq!(game.status, GameStatus::Draw);
}

#[test]
#[should_panic(expected = "Game is already finished")]
fn test_move_after_game_finished() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");

    let game_id = client.create_game(&player_x, &player_o);

    client.make_move(&game_id, &player_x, &0);
    client.make_move(&game_id, &player_o, &3);
    client.make_move(&game_id, &player_x, &1);
    client.make_move(&game_id, &player_o, &4);
    client.make_move(&game_id, &player_x, &2);

    client.make_move(&game_id, &player_o, &5);
}

#[test]
fn test_multiple_games() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x1 = symbol_short!("alice");
    let player_o1 = symbol_short!("bob");
    let player_x2 = symbol_short!("charlie");
    let player_o2 = symbol_short!("david");

    let game_id1 = client.create_game(&player_x1, &player_o1);
    let game_id2 = client.create_game(&player_x2, &player_o2);

    assert_eq!(game_id1, 1);
    assert_eq!(game_id2, 2);

    client.make_move(&game_id1, &player_x1, &0);
    client.make_move(&game_id2, &player_x2, &4);

    let game1 = client.get_game(&game_id1);
    let game2 = client.get_game(&game_id2);

    assert_eq!(game1.board.get(0).unwrap(), Some(Player::X));
    assert_eq!(game1.board.get(4).unwrap(), None);
    assert_eq!(game2.board.get(0).unwrap(), None);
    assert_eq!(game2.board.get(4).unwrap(), Some(Player::X));
}

#[test]
fn test_get_board() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");

    let game_id = client.create_game(&player_x, &player_o);

    client.make_move(&game_id, &player_x, &0);
    client.make_move(&game_id, &player_o, &4);

    let board = client.get_board(&game_id);
    assert_eq!(board.get(0).unwrap(), Some(Player::X));
    assert_eq!(board.get(4).unwrap(), Some(Player::O));

    for i in [1, 2, 3, 5, 6, 7, 8] {
        assert_eq!(board.get(i).unwrap(), None);
    }
}
