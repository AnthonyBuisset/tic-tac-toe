#!/bin/bash

set -e

if [ ! -f .contract-id ]; then
    echo "❌ Contract not deployed. Run ./scripts/deploy.sh first"
    exit 1
fi

CONTRACT_ID=$(cat .contract-id)
echo "🎮 Interacting with Tic-Tac-Toe Contract: $CONTRACT_ID"
echo ""

case "${1:-help}" in
    "create")
        echo "🆕 Creating new game between alice and bob..."
        GAME_ID=$(stellar contract invoke \
            --id $CONTRACT_ID \
            --source alice \
            --network local \
            -- \
            create_game \
            --player_x alice \
            --player_o bob)
        echo "✅ Game created with ID: $GAME_ID"
        echo "$GAME_ID" > .game-id
        ;;
    
    "move")
        if [ ! -f .game-id ]; then
            echo "❌ No active game. Create one first with: $0 create"
            exit 1
        fi
        
        GAME_ID=$(cat .game-id)
        PLAYER=${2:-alice}
        POSITION=${3:-0}
        
        echo "🎯 Making move for $PLAYER at position $POSITION..."
        stellar contract invoke \
            --id $CONTRACT_ID \
            --source $PLAYER \
            --network local \
            -- \
            make_move \
            --game_id $GAME_ID \
            --player $PLAYER \
            --position $POSITION
        ;;
    
    "status")
        if [ ! -f .game-id ]; then
            echo "❌ No active game. Create one first with: $0 create"
            exit 1
        fi
        
        GAME_ID=$(cat .game-id)
        echo "📊 Game Status:"
        stellar contract invoke \
            --id $CONTRACT_ID \
            --source alice \
            --network local \
            -- \
            get_game \
            --game_id $GAME_ID
        ;;
    
    "board")
        if [ ! -f .game-id ]; then
            echo "❌ No active game. Create one first with: $0 create"
            exit 1
        fi
        
        GAME_ID=$(cat .game-id)
        echo "📋 Current Board:"
        stellar contract invoke \
            --id $CONTRACT_ID \
            --source alice \
            --network local \
            -- \
            get_board \
            --game_id $GAME_ID
        ;;
    
    "help"|*)
        echo "🎮 Tic-Tac-Toe Contract Interaction Script"
        echo ""
        echo "Usage: $0 <command> [args...]"
        echo ""
        echo "Commands:"
        echo "  create              Create a new game between alice and bob"
        echo "  move <player> <pos> Make a move (position 0-8)"
        echo "  status              Show current game status"
        echo "  board               Show current board state"
        echo "  help                Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 create"
        echo "  $0 move alice 0"
        echo "  $0 move bob 4"
        echo "  $0 status"
        echo "  $0 board"
        ;;
esac