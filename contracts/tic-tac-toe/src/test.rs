use super::*;
use soroban_sdk::{symbol_short, Env};

#[test]
fn test_create_game() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");

    let game_id = client.create_game(&player_x);
    assert_eq!(game_id, 1);

    let game = client.join_game(&game_id, &player_o);
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

    let game_id = client.create_game(&player_x);
    client.join_game(&game_id, &player_o);

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

    let game_id = client.create_game(&player_x);
    client.join_game(&game_id, &player_o);

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

    let game_id = client.create_game(&player_x);
    client.join_game(&game_id, &player_o);

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

    let game_id = client.create_game(&player_x);
    client.join_game(&game_id, &player_o);

    client.make_move(&game_id, &player_x, &9);
}

#[test]
fn test_winning_game_x() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");

    let game_id = client.create_game(&player_x);
    client.join_game(&game_id, &player_o);

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

    let game_id = client.create_game(&player_x);
    client.join_game(&game_id, &player_o);

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

    let game_id = client.create_game(&player_x);
    client.join_game(&game_id, &player_o);

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

    let game_id = client.create_game(&player_x);
    client.join_game(&game_id, &player_o);

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

    let game_id1 = client.create_game(&player_x1);
    let game_id2 = client.create_game(&player_x2);

    assert_eq!(game_id1, 1);
    assert_eq!(game_id2, 2);

    client.join_game(&game_id1, &player_o1);
    client.join_game(&game_id2, &player_o2);

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

    let game_id = client.create_game(&player_x);
    client.join_game(&game_id, &player_o);

    client.make_move(&game_id, &player_x, &0);
    client.make_move(&game_id, &player_o, &4);

    let board = client.get_board(&game_id);
    assert_eq!(board.get(0).unwrap(), Some(Player::X));
    assert_eq!(board.get(4).unwrap(), Some(Player::O));

    for i in [1, 2, 3, 5, 6, 7, 8] {
        assert_eq!(board.get(i).unwrap(), None);
    }
}

#[test]
#[should_panic(expected = "Game needs a second player")]
fn test_move_without_second_player() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");

    let game_id = client.create_game(&player_x);
    client.make_move(&game_id, &player_x, &0);
}

#[test]
#[should_panic(expected = "Game already has two players")]
fn test_join_game_twice() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");
    let player_o2 = symbol_short!("charlie");

    let game_id = client.create_game(&player_x);
    client.join_game(&game_id, &player_o);
    client.join_game(&game_id, &player_o2);
}

#[test]
#[should_panic(expected = "Cannot join your own game")]
fn test_join_own_game() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");

    let game_id = client.create_game(&player_x);
    client.join_game(&game_id, &player_x);
}

#[test]
fn test_list_games() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x1 = symbol_short!("alice");
    let player_o1 = symbol_short!("bob");
    let player_x2 = symbol_short!("charlie");

    let game_id1 = client.create_game(&player_x1);
    let _game_id2 = client.create_game(&player_x2);
    client.join_game(&game_id1, &player_o1);

    let games = client.list_games();
    assert_eq!(games.len(), 2);

    let game1_info = games.get(0).unwrap();
    assert_eq!(game1_info.id, 1);
    assert_eq!(game1_info.player_x, player_x1);
    assert_eq!(game1_info.player_o, player_o1);
    assert_eq!(game1_info.status, GameStatus::InProgress);

    let game2_info = games.get(1).unwrap();
    assert_eq!(game2_info.id, 2);
    assert_eq!(game2_info.player_x, player_x2);
    assert_eq!(game2_info.player_o, symbol_short!("waiting"));
    assert_eq!(game2_info.status, GameStatus::InProgress);
}

// === BETTING SYSTEM TESTS ===

#[test]
fn test_deposit_withdraw_native() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let user = symbol_short!("alice");
    
    // Initial balance should be empty
    let balance = client.get_balance(&user);
    assert_eq!(balance.native, 0);
    assert_eq!(balance.tokens.len(), 0);

    // Deposit native XLM
    client.deposit_native(&user, &1000);
    let balance = client.get_balance(&user);
    assert_eq!(balance.native, 1000);

    // Deposit more
    client.deposit_native(&user, &500);
    let balance = client.get_balance(&user);
    assert_eq!(balance.native, 1500);

    // Withdraw some
    client.withdraw_native(&user, &300);
    let balance = client.get_balance(&user);
    assert_eq!(balance.native, 1200);
}

#[test]
#[should_panic(expected = "Amount must be positive")]
fn test_deposit_zero_native() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let user = symbol_short!("alice");
    client.deposit_native(&user, &0);
}

#[test]
#[should_panic(expected = "Insufficient balance")]
fn test_withdraw_insufficient_native() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let user = symbol_short!("alice");
    client.deposit_native(&user, &500);
    client.withdraw_native(&user, &600);
}

#[test]
fn test_deposit_withdraw_tokens() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let user = symbol_short!("alice");
    let token_addr = symbol_short!("USDC");
    
    // Deposit tokens
    client.deposit_token(&user, &token_addr, &2000);
    let balance = client.get_balance(&user);
    assert_eq!(balance.tokens.len(), 1);
    let (token, amount) = balance.tokens.get(0).unwrap();
    assert_eq!(token, token_addr);
    assert_eq!(amount, 2000);

    // Deposit more of the same token
    client.deposit_token(&user, &token_addr, &1000);
    let balance = client.get_balance(&user);
    assert_eq!(balance.tokens.len(), 1);
    let (token, amount) = balance.tokens.get(0).unwrap();
    assert_eq!(token, token_addr);
    assert_eq!(amount, 3000);

    // Deposit different token
    let token_addr2 = symbol_short!("USDT");
    client.deposit_token(&user, &token_addr2, &500);
    let balance = client.get_balance(&user);
    assert_eq!(balance.tokens.len(), 2);

    // Withdraw tokens
    client.withdraw_token(&user, &token_addr, &1500);
    let balance = client.get_balance(&user);
    let (token, amount) = balance.tokens.get(0).unwrap();
    assert_eq!(token, token_addr);
    assert_eq!(amount, 1500);
}

#[test]
#[should_panic(expected = "Insufficient token balance")]
fn test_withdraw_insufficient_tokens() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let user = symbol_short!("alice");
    let token_addr = symbol_short!("USDC");
    
    client.deposit_token(&user, &token_addr, &1000);
    client.withdraw_token(&user, &token_addr, &1500);
}

#[test]
#[should_panic(expected = "Token not found in balance")]
fn test_withdraw_nonexistent_token() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let user = symbol_short!("alice");
    let token_addr = symbol_short!("USDC");
    
    client.withdraw_token(&user, &token_addr, &100);
}

#[test]
fn test_create_game_with_native_bet() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");
    
    // Fund players
    client.deposit_native(&player_x, &2000);
    client.deposit_native(&player_o, &2000);
    
    // Create game with bet
    let game_id = client.create_game_with_bet(&player_x, &500, &TokenType::Native);
    assert_eq!(game_id, 1);
    
    // Check player X's balance is locked
    let balance = client.get_balance(&player_x);
    assert_eq!(balance.native, 1500);
    
    // Get game info
    let games = client.list_games();
    let game_info = games.get(0).unwrap();
    assert_eq!(game_info.has_bet, true);
    assert_eq!(game_info.bet_amount, 500);
    assert_eq!(game_info.bet_token_native, true);
    
    // Check bet info
    let bet = client.get_game_bet(&game_id).unwrap();
    assert_eq!(bet.amount, 500);
    assert_eq!(bet.player_x_paid, true);
    assert_eq!(bet.player_o_paid, false);
    assert_eq!(bet.rewards_claimed, false);
}

#[test]
fn test_create_game_with_token_bet() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let token_addr = symbol_short!("USDC");
    
    // Fund player
    client.deposit_token(&player_x, &token_addr, &2000);
    
    // Create game with token bet
    let game_id = client.create_game_with_bet(&player_x, &300, &TokenType::Stellar(token_addr.clone()));
    
    // Check player's token balance is locked
    let balance = client.get_balance(&player_x);
    let (token, amount) = balance.tokens.get(0).unwrap();
    assert_eq!(token, token_addr);
    assert_eq!(amount, 1700);
    
    // Check bet info
    let bet = client.get_game_bet(&game_id).unwrap();
    assert_eq!(bet.amount, 300);
    assert_eq!(bet.token_type, TokenType::Stellar(token_addr));
}

#[test]
#[should_panic(expected = "Bet amount must be positive")]
fn test_create_game_zero_bet() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    client.create_game_with_bet(&player_x, &0, &TokenType::Native);
}

#[test]
#[should_panic(expected = "Insufficient native balance for bet")]
fn test_create_game_insufficient_balance() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    client.deposit_native(&player_x, &200);
    client.create_game_with_bet(&player_x, &500, &TokenType::Native);
}

#[test]
fn test_join_betting_game() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");
    
    // Fund players
    client.deposit_native(&player_x, &1000);
    client.deposit_native(&player_o, &1000);
    
    // Create and join betting game
    let game_id = client.create_game_with_bet(&player_x, &300, &TokenType::Native);
    let game = client.join_game(&game_id, &player_o);
    
    // Check both players' balances are locked
    let balance_x = client.get_balance(&player_x);
    let balance_o = client.get_balance(&player_o);
    assert_eq!(balance_x.native, 700);
    assert_eq!(balance_o.native, 700);
    
    // Check bet status
    let bet = client.get_game_bet(&game_id).unwrap();
    assert_eq!(bet.player_x_paid, true);
    assert_eq!(bet.player_o_paid, true);
    
    // Check game structure
    assert_eq!(game.has_bet, true);
    assert_eq!(game.player_x, player_x);
    assert_eq!(game.player_o, player_o);
}

#[test]
#[should_panic(expected = "Insufficient native balance for bet")]
fn test_join_betting_game_insufficient_balance() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");
    
    // Fund only player X adequately
    client.deposit_native(&player_x, &1000);
    client.deposit_native(&player_o, &200);
    
    let game_id = client.create_game_with_bet(&player_x, &300, &TokenType::Native);
    client.join_game(&game_id, &player_o);
}

#[test]
fn test_winner_claims_all_rewards() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");
    
    // Fund players
    client.deposit_native(&player_x, &1000);
    client.deposit_native(&player_o, &1000);
    
    // Create and join betting game
    let game_id = client.create_game_with_bet(&player_x, &400, &TokenType::Native);
    client.join_game(&game_id, &player_o);
    
    // Play game to X victory
    client.make_move(&game_id, &player_x, &0);
    client.make_move(&game_id, &player_o, &3);
    client.make_move(&game_id, &player_x, &1);
    client.make_move(&game_id, &player_o, &4);
    client.make_move(&game_id, &player_x, &2); // X wins
    
    let game = client.get_game(&game_id);
    assert_eq!(game.status, GameStatus::XWins);
    
    // Player X claims rewards (should get 800 total)
    client.claim_rewards(&game_id, &player_x);
    
    let balance_x = client.get_balance(&player_x);
    let balance_o = client.get_balance(&player_o);
    assert_eq!(balance_x.native, 1400); // 600 + 800 reward
    assert_eq!(balance_o.native, 600);  // 1000 - 400 bet
    
    // Check bet is marked as claimed
    let bet = client.get_game_bet(&game_id).unwrap();
    assert_eq!(bet.rewards_claimed, true);
}

#[test]
fn test_draw_both_players_claim() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");
    
    // Fund players
    client.deposit_native(&player_x, &1000);
    client.deposit_native(&player_o, &1000);
    
    // Create and join betting game
    let game_id = client.create_game_with_bet(&player_x, &250, &TokenType::Native);
    client.join_game(&game_id, &player_o);
    
    // Play to draw
    client.make_move(&game_id, &player_x, &0);
    client.make_move(&game_id, &player_o, &1);
    client.make_move(&game_id, &player_x, &2);
    client.make_move(&game_id, &player_o, &4);
    client.make_move(&game_id, &player_x, &3);
    client.make_move(&game_id, &player_o, &5);
    client.make_move(&game_id, &player_x, &7);
    client.make_move(&game_id, &player_o, &6);
    client.make_move(&game_id, &player_x, &8);
    
    let game = client.get_game(&game_id);
    assert_eq!(game.status, GameStatus::Draw);
    
    // Both players claim their bets back
    client.claim_rewards(&game_id, &player_x);
    client.claim_rewards(&game_id, &player_o);
    
    let balance_x = client.get_balance(&player_x);
    let balance_o = client.get_balance(&player_o);
    assert_eq!(balance_x.native, 1000); // Original balance restored
    assert_eq!(balance_o.native, 1000); // Original balance restored
}

#[test]
#[should_panic(expected = "Game has no betting")]
fn test_claim_rewards_no_betting() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");
    
    // Create regular game without betting
    let game_id = client.create_game(&player_x);
    client.join_game(&game_id, &player_o);
    
    // Play to completion
    client.make_move(&game_id, &player_x, &0);
    client.make_move(&game_id, &player_o, &3);
    client.make_move(&game_id, &player_x, &1);
    client.make_move(&game_id, &player_o, &4);
    client.make_move(&game_id, &player_x, &2);
    
    client.claim_rewards(&game_id, &player_x);
}

#[test]
#[should_panic(expected = "Game is still in progress")]
fn test_claim_rewards_game_in_progress() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");
    
    client.deposit_native(&player_x, &1000);
    client.deposit_native(&player_o, &1000);
    
    let game_id = client.create_game_with_bet(&player_x, &200, &TokenType::Native);
    client.join_game(&game_id, &player_o);
    
    // Make one move but don't finish
    client.make_move(&game_id, &player_x, &0);
    
    client.claim_rewards(&game_id, &player_x);
}

#[test]
#[should_panic(expected = "Player cannot claim rewards")]
fn test_loser_cannot_claim() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");
    
    client.deposit_native(&player_x, &1000);
    client.deposit_native(&player_o, &1000);
    
    let game_id = client.create_game_with_bet(&player_x, &300, &TokenType::Native);
    client.join_game(&game_id, &player_o);
    
    // Play to X victory
    client.make_move(&game_id, &player_x, &0);
    client.make_move(&game_id, &player_o, &3);
    client.make_move(&game_id, &player_x, &1);
    client.make_move(&game_id, &player_o, &4);
    client.make_move(&game_id, &player_x, &2);
    
    // Player O (loser) tries to claim
    client.claim_rewards(&game_id, &player_o);
}

#[test]
#[should_panic(expected = "Rewards already claimed")]
fn test_double_claim_rewards() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");
    
    client.deposit_native(&player_x, &1000);
    client.deposit_native(&player_o, &1000);
    
    let game_id = client.create_game_with_bet(&player_x, &200, &TokenType::Native);
    client.join_game(&game_id, &player_o);
    
    // Play to X victory
    client.make_move(&game_id, &player_x, &0);
    client.make_move(&game_id, &player_o, &3);
    client.make_move(&game_id, &player_x, &1);
    client.make_move(&game_id, &player_o, &4);
    client.make_move(&game_id, &player_x, &2);
    
    // Claim once
    client.claim_rewards(&game_id, &player_x);
    
    // Try to claim again
    client.claim_rewards(&game_id, &player_x);
}

#[test]
fn test_token_betting_full_workflow() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");
    let token_addr = symbol_short!("USDC");
    
    // Fund players with tokens
    client.deposit_token(&player_x, &token_addr, &5000);
    client.deposit_token(&player_o, &token_addr, &5000);
    
    // Create token betting game
    let game_id = client.create_game_with_bet(&player_x, &1000, &TokenType::Stellar(token_addr.clone()));
    client.join_game(&game_id, &player_o);
    
    // Play to O victory
    client.make_move(&game_id, &player_x, &0);
    client.make_move(&game_id, &player_o, &3);
    client.make_move(&game_id, &player_x, &1);
    client.make_move(&game_id, &player_o, &4);
    client.make_move(&game_id, &player_x, &6);
    client.make_move(&game_id, &player_o, &5); // O wins
    
    // Player O claims rewards
    client.claim_rewards(&game_id, &player_o);
    
    let balance_x = client.get_balance(&player_x);
    let balance_o = client.get_balance(&player_o);
    
    // Check token balances
    let (_, amount_x) = balance_x.tokens.get(0).unwrap();
    let (_, amount_o) = balance_o.tokens.get(0).unwrap();
    assert_eq!(amount_x, 4000); // 5000 - 1000 bet
    assert_eq!(amount_o, 6000); // 4000 + 2000 reward
}

#[test]
fn test_mixed_game_types() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_a = symbol_short!("alice");
    let player_b = symbol_short!("bob");
    let player_c = symbol_short!("charlie");
    let player_d = symbol_short!("david");
    
    // Fund all players
    client.deposit_native(&player_a, &1000);
    client.deposit_native(&player_b, &1000);
    client.deposit_native(&player_c, &1000);
    client.deposit_native(&player_d, &1000);
    
    // Create one regular game and one betting game
    let regular_game = client.create_game(&player_a);
    let betting_game = client.create_game_with_bet(&player_c, &300, &TokenType::Native);
    
    // Join games
    client.join_game(&regular_game, &player_b);
    client.join_game(&betting_game, &player_d);
    
    // Check games list
    let games = client.list_games();
    assert_eq!(games.len(), 2);
    
    let regular_info = games.get(0).unwrap();
    let betting_info = games.get(1).unwrap();
    
    assert_eq!(regular_info.has_bet, false);
    assert_eq!(betting_info.has_bet, true);
    assert_eq!(betting_info.bet_amount, 300);
}

#[test]
#[should_panic(expected = "Not a player in this game")]
fn test_claim_rewards_wrong_player() {
    let env = Env::default();
    let contract_id = env.register(TicTacToeContract, ());
    let client = TicTacToeContractClient::new(&env, &contract_id);

    let player_x = symbol_short!("alice");
    let player_o = symbol_short!("bob");
    let outsider = symbol_short!("charlie");
    
    client.deposit_native(&player_x, &1000);
    client.deposit_native(&player_o, &1000);
    
    let game_id = client.create_game_with_bet(&player_x, &200, &TokenType::Native);
    client.join_game(&game_id, &player_o);
    
    // Play to X victory
    client.make_move(&game_id, &player_x, &0);
    client.make_move(&game_id, &player_o, &3);
    client.make_move(&game_id, &player_x, &1);
    client.make_move(&game_id, &player_o, &4);
    client.make_move(&game_id, &player_x, &2);
    
    // Outsider tries to claim
    client.claim_rewards(&game_id, &outsider);
}
