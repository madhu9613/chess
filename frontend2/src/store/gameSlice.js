import { createSlice, createSelector } from '@reduxjs/toolkit';
import { ChessGame } from '@mady9613/chess-engine';

const game = new ChessGame();

const initialState = {
    gameInstance: game,
    ui: {
        selectedSquare: null,
        candidateMoves: [],
        checkmateAnimation: false,
    },
    multiplayer: {
        playerColor: null,
        opponentJoined: false,
        isMyTurn: false,
        roomId: null,
        opponentName: null,
    },
    settings: {
        soundEnabled: true,
        showCoordinates: true,
        flipBoard: false,
    },
};

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        makeMove: (state, action) => {
            const { from, to, promotion } = action.payload;
            const result = state.gameInstance.move({ from, to, promotion });

            if (result.success) {
                state.ui.selectedSquare = null;
                state.ui.candidateMoves = [];

                if (result.checkmate) {
                    state.ui.checkmateAnimation = true;
                }
            }
            return state;
        },

        selectSquare: (state, action) => {
            const square = action.payload;
            const piece = state.gameInstance.getPieceAt(square);
            const currentTurn = state.gameInstance.getTurn();
            const playerColor = state.multiplayer.playerColor;

            let canSelect = false;
            if (playerColor) {
                canSelect = state.multiplayer.isMyTurn && piece && piece[0] === playerColor;
            } else {
                canSelect = piece && piece[0] === currentTurn;
            }

            if (canSelect) {
                state.ui.selectedSquare = square;
                state.ui.candidateMoves = state.gameInstance.getValidMoves(square);
            } else {
                state.ui.selectedSquare = null;
                state.ui.candidateMoves = [];
            }
        },

        clearSelection: (state) => {
            state.ui.selectedSquare = null;
            state.ui.candidateMoves = [];
        },

        // resetGame: (state) => {
        //     state.gameInstance.reset();
        //     state.ui.selectedSquare = null;
        //     state.ui.candidateMoves = [];
        //     state.ui.checkmateAnimation = false;
        // },
        // In gameSlice.js reducers, add:
        resetGame: (state) => {
            state.gameInstance.reset();
            state.ui.selectedSquare = null;
            state.ui.candidateMoves = [];
            state.ui.checkmateAnimation = false;
            state.multiplayer.isMyTurn = state.multiplayer.playerColor === 'w';
        },

        undoMove: (state) => {
            state.gameInstance.undo();
            state.ui.selectedSquare = null;
            state.ui.candidateMoves = [];
        },

        redoMove: (state) => {
            state.gameInstance.redo();
            state.ui.selectedSquare = null;
            state.ui.candidateMoves = [];
        },

        setPlayerColor: (state, action) => {
            state.multiplayer.playerColor = action.payload;
            state.multiplayer.isMyTurn = action.payload === 'w';
        },

        setOpponentJoined: (state, action) => {
            state.multiplayer.opponentJoined = action.payload;
        },

        setMyTurn: (state, action) => {
            state.multiplayer.isMyTurn = action.payload;
        },

        setRoomId: (state, action) => {
            state.multiplayer.roomId = action.payload;
        },

        setOpponentName: (state, action) => {
            state.multiplayer.opponentName = action.payload;
        },

        toggleFlipBoard: (state) => {
            state.settings.flipBoard = !state.settings.flipBoard;
        },

        toggleCoordinates: (state) => {
            state.settings.showCoordinates = !state.settings.showCoordinates;
        },

        toggleSound: (state) => {
            state.settings.soundEnabled = !state.settings.soundEnabled;
        },

        syncGameState: (state, action) => {
            state.gameInstance.loadFEN(action.payload.fen);
        },
    },
});

// ========== SELECTORS ==========
// Game instance selectors
const selectGameState = (state) => state.game;

export const selectGame = (state) => state.game.gameInstance;

// Selectors for game instance
export const selectBoard = (state) => state.game.gameInstance.getBoard();

export const selectTurn = (state) => state.game.gameInstance.getTurn();
export const selectIsCheck = (state) => state.game.gameInstance.isCheck();
export const selectIsCheckmate = (state) => state.game.gameInstance.isCheckmate();
export const selectIsStalemate = (state) => state.game.gameInstance.isStalemate();
export const selectIsGameOver = (state) => state.game.gameInstance.isGameOver();
export const selectWinner = (state) => state.game.gameInstance.getWinner();

export const selectMoveHistory = (state) => state.game.gameInstance.getMoveHistory();

export const selectCanUndo = (state) => state.game.gameInstance.canUndo();
export const selectCanRedo = (state) => state.game.gameInstance.canRedo();
export const selectFEN = (state) => state.game.gameInstance.getFEN();

// UI Selectors
export const selectSelectedSquare = (state) => state.game.ui.selectedSquare;

export const selectCandidateMoves = (state) => state.game.ui.candidateMoves;

export const selectCheckmateAnimation = (state) => state.game.ui.checkmateAnimation;

// Multiplayer Selectors
export const selectPlayerColor = (state) => state.game.multiplayer.playerColor;
export const selectIsMyTurn = (state) => state.game.multiplayer.isMyTurn;
export const selectOpponentJoined = (state) => state.game.multiplayer.opponentJoined;
export const selectRoomId = (state) => state.game.multiplayer.roomId;
export const selectOpponentName = (state) => state.game.multiplayer.opponentName;

// Settings Selectors
export const selectSoundEnabled = (state) => state.game.settings.soundEnabled;
export const selectShowCoordinates = (state) => state.game.settings.showCoordinates;
export const selectFlipBoard = (state) => state.game.settings.flipBoard;

export const selectSettings = (state) => state.game.settings;

// ========== EXPORT ACTIONS ==========
export const {
    makeMove,
    selectSquare,
    clearSelection,
    resetGame,
    undoMove,
    redoMove,
    setPlayerColor,
    setOpponentJoined,
    setMyTurn,
    setRoomId,
    setOpponentName,
    toggleFlipBoard,
    toggleCoordinates,
    toggleSound,
    syncGameState,
} = gameSlice.actions;

export default gameSlice.reducer;