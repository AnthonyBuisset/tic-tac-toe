#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Env, Symbol, Vec};

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum DataKey {
    Game(u32),
    GameCounter,
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
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Game {
    pub board: Vec<Option<Player>>,
    pub current_player: Player,
    pub player_x: Symbol,
    pub player_o: Symbol,
    pub status: GameStatus,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct GameInfo {
    pub id: u32,
    pub player_x: Symbol,
    pub player_o: Symbol,
    pub status: GameStatus,
}

#[contract]
pub struct TicTacToeContract;

#[contractimpl]
impl TicTacToeContract {
    pub fn create_game(env: Env, player_x: Symbol) -> u32 {
        let game_counter = env
            .storage()
            .persistent()
            .get(&DataKey::GameCounter)
            .unwrap_or(0u32);
        let new_game_id = game_counter + 1;

        let mut board = Vec::new(&env);
        for _ in 0..9 {
            board.push_back(None);
        }

        let game = Game {
            board,
            current_player: Player::X,
            player_x,
            player_o: symbol_short!("waiting"),
            status: GameStatus::InProgress,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Game(new_game_id), &game);
        env.storage()
            .persistent()
            .set(&DataKey::GameCounter, &new_game_id);

        new_game_id
    }

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

        game.player_o = player_o;

        env.storage()
            .persistent()
            .set(&DataKey::Game(game_id), &game);
        
        game
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
                games.push_back(GameInfo {
                    id: i,
                    player_x: game.player_x,
                    player_o: game.player_o,
                    status: game.status,
                });
            }
        }

        games
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
