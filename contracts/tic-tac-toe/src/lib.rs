#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Env, Symbol, Vec};

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum DataKey {
    Game(u32),
    GameCounter,
    Balance(Symbol),        // User balances by symbol
    GameBet(u32),          // Betting info for each game
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum Player {
    X,
    O,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum GameStatus {
    InProgress,
    XWins,
    OWins,
    Draw,
    Claimed,               // Rewards have been claimed
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum TokenType {
    Native,                // XLM
    Stellar(Symbol),       // Stellar Asset Contract Address as Symbol
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct UserBalance {
    pub native: i128,      // XLM balance
    pub tokens: Vec<(Symbol, i128)>, // Token balances
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct GameBet {
    pub amount: i128,
    pub token_type: TokenType,
    pub player_x_paid: bool,
    pub player_o_paid: bool,
    pub rewards_claimed: bool,
    pub player_x_claimed: bool,
    pub player_o_claimed: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Game {
    pub board: Vec<Option<Player>>,
    pub current_player: Player,
    pub player_x: Symbol,
    pub player_o: Symbol,
    pub status: GameStatus,
    pub has_bet: bool,     // Whether this game has betting enabled
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct GameInfo {
    pub id: u32,
    pub player_x: Symbol,
    pub player_o: Symbol,
    pub status: GameStatus,
    pub has_bet: bool,
    pub bet_amount: i128,
    pub bet_token_native: bool,    // true for native XLM, false for stellar token
    pub bet_token_symbol: Symbol,  // token symbol if not native
}

#[contract]
pub struct TicTacToeContract;

#[contractimpl]
impl TicTacToeContract {
    // === ESCROW MANAGEMENT ===
    
    /// Deposit native XLM to user's balance
    pub fn deposit_native(env: Env, user: Symbol, amount: i128) {
        if amount <= 0 {
            panic!("Amount must be positive");
        }
        
        let mut balance = Self::get_user_balance(&env, &user);
        balance.native += amount;
        
        env.storage()
            .persistent()
            .set(&DataKey::Balance(user), &balance);
    }
    
    /// Deposit tokens to user's balance
    pub fn deposit_token(env: Env, user: Symbol, token_address: Symbol, amount: i128) {
        if amount <= 0 {
            panic!("Amount must be positive");
        }
        
        let mut balance = Self::get_user_balance(&env, &user);
        
        // Find existing token balance or add new one
        let mut found = false;
        for i in 0..balance.tokens.len() {
            let (symbol, bal) = balance.tokens.get(i).unwrap();
            if symbol == token_address {
                balance.tokens.set(i, (symbol, bal + amount));
                found = true;
                break;
            }
        }
        
        if !found {
            balance.tokens.push_back((token_address, amount));
        }
        
        env.storage()
            .persistent()
            .set(&DataKey::Balance(user), &balance);
    }
    
    /// Withdraw native XLM from user's balance
    pub fn withdraw_native(env: Env, user: Symbol, amount: i128) {
        if amount <= 0 {
            panic!("Amount must be positive");
        }
        
        let mut balance = Self::get_user_balance(&env, &user);
        
        if balance.native < amount {
            panic!("Insufficient balance");
        }
        
        balance.native -= amount;
        
        env.storage()
            .persistent()
            .set(&DataKey::Balance(user), &balance);
    }
    
    /// Withdraw tokens from user's balance
    pub fn withdraw_token(env: Env, user: Symbol, token_address: Symbol, amount: i128) {
        if amount <= 0 {
            panic!("Amount must be positive");
        }
        
        let mut balance = Self::get_user_balance(&env, &user);
        
        for i in 0..balance.tokens.len() {
            let (symbol, bal) = balance.tokens.get(i).unwrap();
            if symbol == token_address {
                if bal < amount {
                    panic!("Insufficient token balance");
                }
                balance.tokens.set(i, (symbol, bal - amount));
                
                env.storage()
                    .persistent()
                    .set(&DataKey::Balance(user), &balance);
                return;
            }
        }
        
        panic!("Token not found in balance");
    }
    
    /// Get user's balance
    pub fn get_balance(env: Env, user: Symbol) -> UserBalance {
        Self::get_user_balance(&env, &user)
    }
    
    // === GAME MANAGEMENT ===
    
    /// Create a game without betting
    pub fn create_game(env: Env, player_x: Symbol) -> u32 {
        Self::create_game_internal(&env, player_x, None, None)
    }
    
    /// Create a game with betting
    pub fn create_game_with_bet(env: Env, player_x: Symbol, bet_amount: i128, token_type: TokenType) -> u32 {
        if bet_amount <= 0 {
            panic!("Bet amount must be positive");
        }
        
        // Check if player has sufficient balance
        let balance = Self::get_user_balance(&env, &player_x);
        match &token_type {
            TokenType::Native => {
                if balance.native < bet_amount {
                    panic!("Insufficient native balance for bet");
                }
            }
            TokenType::Stellar(token_symbol) => {
                let mut has_balance = false;
                for i in 0..balance.tokens.len() {
                    let (symbol, bal) = balance.tokens.get(i).unwrap();
                    if symbol == *token_symbol && bal >= bet_amount {
                        has_balance = true;
                        break;
                    }
                }
                if !has_balance {
                    panic!("Insufficient token balance for bet");
                }
            }
        }
        
        let game_id = Self::create_game_internal(&env, player_x.clone(), Some(bet_amount), Some(token_type.clone()));
        
        // Lock the bet amount from player X
        Self::lock_bet(&env, &player_x, bet_amount, &token_type);
        
        // Create betting info
        let game_bet = GameBet {
            amount: bet_amount,
            token_type,
            player_x_paid: true,
            player_o_paid: false,
            rewards_claimed: false,
            player_x_claimed: false,
            player_o_claimed: false,
        };
        
        env.storage()
            .persistent()
            .set(&DataKey::GameBet(game_id), &game_bet);
        
        game_id
    }
    
    fn create_game_internal(env: &Env, player_x: Symbol, bet_amount: Option<i128>, _token_type: Option<TokenType>) -> u32 {
        let game_counter = env
            .storage()
            .persistent()
            .get(&DataKey::GameCounter)
            .unwrap_or(0u32);
        let new_game_id = game_counter + 1;

        let mut board = Vec::new(env);
        for _ in 0..9 {
            board.push_back(None);
        }

        let game = Game {
            board,
            current_player: Player::X,
            player_x,
            player_o: symbol_short!("waiting"),
            status: GameStatus::InProgress,
            has_bet: bet_amount.is_some(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Game(new_game_id), &game);
        env.storage()
            .persistent()
            .set(&DataKey::GameCounter, &new_game_id);

        new_game_id
    }

    /// Join a game (handles both betting and non-betting games)
    pub fn join_game(env: Env, game_id: u32, player_o: Symbol) -> Game {
        let mut game: Game = env
            .storage()
            .persistent()
            .get(&DataKey::Game(game_id))
            .expect("Game not found");

        if game.player_o != symbol_short!("waiting") {
            panic!("Game already has two players");
        }

        if game.player_x == player_o {
            panic!("Cannot join your own game");
        }

        // Handle betting if this game has a bet
        if game.has_bet {
            let mut game_bet: GameBet = env
                .storage()
                .persistent()
                .get(&DataKey::GameBet(game_id))
                .expect("Game bet not found");

            if game_bet.player_o_paid {
                panic!("Player O has already paid");
            }

            // Check if player O has sufficient balance
            let balance = Self::get_user_balance(&env, &player_o);
            match &game_bet.token_type {
                TokenType::Native => {
                    if balance.native < game_bet.amount {
                        panic!("Insufficient native balance for bet");
                    }
                }
                TokenType::Stellar(token_symbol) => {
                    let mut has_balance = false;
                    for i in 0..balance.tokens.len() {
                        let (symbol, bal) = balance.tokens.get(i).unwrap();
                        if symbol == *token_symbol && bal >= game_bet.amount {
                            has_balance = true;
                            break;
                        }
                    }
                    if !has_balance {
                        panic!("Insufficient token balance for bet");
                    }
                }
            }

            // Lock the bet amount from player O
            Self::lock_bet(&env, &player_o, game_bet.amount, &game_bet.token_type);
            
            // Update betting info
            game_bet.player_o_paid = true;
            env.storage()
                .persistent()
                .set(&DataKey::GameBet(game_id), &game_bet);
        }

        game.player_o = player_o;

        env.storage()
            .persistent()
            .set(&DataKey::Game(game_id), &game);
        
        game
    }
    
    /// Claim rewards after game ends
    pub fn claim_rewards(env: Env, game_id: u32, player: Symbol) {
        let game: Game = env
            .storage()
            .persistent()
            .get(&DataKey::Game(game_id))
            .expect("Game not found");

        if !game.has_bet {
            panic!("Game has no betting");
        }

        if game.status == GameStatus::InProgress {
            panic!("Game is still in progress");
        }

        if game.player_x != player && game.player_o != player {
            panic!("Not a player in this game");
        }

        let mut game_bet: GameBet = env
            .storage()
            .persistent()
            .get(&DataKey::GameBet(game_id))
            .expect("Game bet not found");

        // Check if this specific player has already claimed
        let is_player_x = game.player_x == player;
        if (is_player_x && game_bet.player_x_claimed) || (!is_player_x && game_bet.player_o_claimed) {
            panic!("Rewards already claimed");
        }

        let can_claim = match game.status {
            GameStatus::XWins => is_player_x,
            GameStatus::OWins => !is_player_x,
            GameStatus::Draw => true, // Both players can claim in a draw
            _ => false,
        };

        if !can_claim {
            panic!("Player cannot claim rewards");
        }

        let reward_amount = match game.status {
            GameStatus::XWins | GameStatus::OWins => game_bet.amount * 2, // Winner gets both bets
            GameStatus::Draw => game_bet.amount, // Each player gets their bet back
            _ => panic!("Invalid game status for claiming"),
        };

        // Give rewards to player
        Self::unlock_bet(&env, &player, reward_amount, &game_bet.token_type);

        // Mark this specific player as having claimed
        if is_player_x {
            game_bet.player_x_claimed = true;
        } else {
            game_bet.player_o_claimed = true;
        }
        
        // Mark overall rewards as claimed if appropriate
        if game.status != GameStatus::Draw {
            // For wins, mark as fully claimed since only winner can claim
            game_bet.rewards_claimed = true;
        } else {
            // For draws, mark as fully claimed only if both players have claimed
            if game_bet.player_x_claimed && game_bet.player_o_claimed {
                game_bet.rewards_claimed = true;
            }
        }
        
        env.storage()
            .persistent()
            .set(&DataKey::GameBet(game_id), &game_bet);
    }
    
    // === HELPER FUNCTIONS ===
    
    fn get_user_balance(env: &Env, user: &Symbol) -> UserBalance {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(user.clone()))
            .unwrap_or(UserBalance {
                native: 0,
                tokens: Vec::new(env),
            })
    }
    
    fn lock_bet(env: &Env, user: &Symbol, amount: i128, token_type: &TokenType) {
        let mut balance = Self::get_user_balance(env, user);
        
        match token_type {
            TokenType::Native => {
                balance.native -= amount;
            }
            TokenType::Stellar(token_symbol) => {
                for i in 0..balance.tokens.len() {
                    let (symbol, bal) = balance.tokens.get(i).unwrap();
                    if symbol == *token_symbol {
                        balance.tokens.set(i, (symbol, bal - amount));
                        break;
                    }
                }
            }
        }
        
        env.storage()
            .persistent()
            .set(&DataKey::Balance(user.clone()), &balance);
    }
    
    fn unlock_bet(env: &Env, user: &Symbol, amount: i128, token_type: &TokenType) {
        let mut balance = Self::get_user_balance(env, user);
        
        match token_type {
            TokenType::Native => {
                balance.native += amount;
            }
            TokenType::Stellar(token_symbol) => {
                let mut found = false;
                for i in 0..balance.tokens.len() {
                    let (symbol, bal) = balance.tokens.get(i).unwrap();
                    if symbol == *token_symbol {
                        balance.tokens.set(i, (symbol, bal + amount));
                        found = true;
                        break;
                    }
                }
                
                if !found {
                    balance.tokens.push_back((token_symbol.clone(), amount));
                }
            }
        }
        
        env.storage()
            .persistent()
            .set(&DataKey::Balance(user.clone()), &balance);
    }

    pub fn list_games(env: Env) -> Vec<GameInfo> {
        let game_counter = env
            .storage()
            .persistent()
            .get(&DataKey::GameCounter)
            .unwrap_or(0u32);

        let mut games = Vec::new(&env);

        for i in 1..=game_counter {
            if let Some(game) = env
                .storage()
                .persistent()
                .get::<DataKey, Game>(&DataKey::Game(i))
            {
                let (has_bet, bet_amount, bet_token_native, bet_token_symbol) = if game.has_bet {
                    if let Some(game_bet) = env
                        .storage()
                        .persistent()
                        .get::<DataKey, GameBet>(&DataKey::GameBet(i))
                    {
                        let (is_native, token_symbol) = match game_bet.token_type {
                            TokenType::Native => (true, symbol_short!("XLM")),
                            TokenType::Stellar(symbol) => (false, symbol),
                        };
                        (true, game_bet.amount, is_native, token_symbol)
                    } else {
                        (false, 0, true, symbol_short!("XLM"))
                    }
                } else {
                    (false, 0, true, symbol_short!("XLM"))
                };

                games.push_back(GameInfo {
                    id: i,
                    player_x: game.player_x,
                    player_o: game.player_o,
                    status: game.status,
                    has_bet,
                    bet_amount,
                    bet_token_native,
                    bet_token_symbol,
                });
            }
        }

        games
    }
    
    /// Get betting information for a specific game
    pub fn get_game_bet(env: Env, game_id: u32) -> Option<GameBet> {
        env.storage()
            .persistent()
            .get(&DataKey::GameBet(game_id))
    }

    pub fn make_move(env: Env, game_id: u32, player: Symbol, position: u32) -> Game {
        if position >= 9 {
            panic!("Invalid position: must be 0-8");
        }

        let mut game: Game = env
            .storage()
            .persistent()
            .get(&DataKey::Game(game_id))
            .expect("Game not found");

        if game.status != GameStatus::InProgress {
            panic!("Game is already finished");
        }

        if game.player_o == symbol_short!("waiting") {
            panic!("Game needs a second player");
        }

        let expected_player = match game.current_player {
            Player::X => game.player_x.clone(),
            Player::O => game.player_o.clone(),
        };

        if player != expected_player {
            panic!("Not your turn");
        }

        if game.board.get(position).unwrap().is_some() {
            panic!("Position already taken");
        }

        game.board.set(position, Some(game.current_player.clone()));

        game.status = Self::check_winner(&game.board);

        if game.status == GameStatus::InProgress {
            game.current_player = match game.current_player {
                Player::X => Player::O,
                Player::O => Player::X,
            };
        }

        env.storage()
            .persistent()
            .set(&DataKey::Game(game_id), &game);
        game
    }

    pub fn get_game(env: Env, game_id: u32) -> Game {
        env.storage()
            .persistent()
            .get(&DataKey::Game(game_id))
            .expect("Game not found")
    }

    pub fn get_board(env: Env, game_id: u32) -> Vec<Option<Player>> {
        let game: Game = env
            .storage()
            .persistent()
            .get(&DataKey::Game(game_id))
            .expect("Game not found");
        game.board
    }

    fn check_winner(board: &Vec<Option<Player>>) -> GameStatus {
        let winning_positions = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8], // rows
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8], // columns
            [0, 4, 8],
            [2, 4, 6], // diagonals
        ];

        for positions in winning_positions.iter() {
            let a = board.get(positions[0]).unwrap();
            let b = board.get(positions[1]).unwrap();
            let c = board.get(positions[2]).unwrap();

            if let (Some(player_a), Some(player_b), Some(player_c)) = (a, b, c) {
                if player_a == player_b && player_b == player_c {
                    return match player_a {
                        Player::X => GameStatus::XWins,
                        Player::O => GameStatus::OWins,
                    };
                }
            }
        }

        let mut is_full = true;
        for i in 0..9 {
            if board.get(i).unwrap().is_none() {
                is_full = false;
                break;
            }
        }

        if is_full {
            GameStatus::Draw
        } else {
            GameStatus::InProgress
        }
    }
}

pub fn hello() -> Symbol {
    symbol_short!("Hello")
}

#[cfg(test)]
mod test;
