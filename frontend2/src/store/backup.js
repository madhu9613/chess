import { createSlice, createSelector } from '@reduxjs/toolkit';
import { ChessGame } from '@mady9613/chess-engine';

const _initialGame = new ChessGame();
const initialFEN = _initialGame.getFEN();

const initialState = {
    fen: initialFEN,
    history: [initialFEN],
    historyIndex: 0,
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
            const g = new ChessGame();
            g.loadFEN(state.fen);
            const result = g.move({ from, to, promotion });

            if (result.success) {
                const newFEN = g.getFEN();
                state.history = state.history.slice(0, state.historyIndex + 1);
                state.history.push(newFEN);
                state.historyIndex = state.history.length - 1;
                state.fen = newFEN;

                state.ui.selectedSquare = null;
                state.ui.candidateMoves = [];

                if (result.checkmate) {
                    state.ui.checkmateAnimation = true;
                }
            }
        },

        selectSquare: (state, action) => {
            const square = action.payload;
            const g = new ChessGame();
            g.loadFEN(state.fen);
            const piece = g.getPieceAt(square);
            const currentTurn = g.getTurn();
            const playerColor = state.multiplayer.playerColor;

            let canSelect = false;
            if (playerColor) {
                canSelect = state.multiplayer.isMyTurn && piece && piece[0] === playerColor;
            } else {
                canSelect = piece && piece[0] === currentTurn;
            }

            if (canSelect) {
                state.ui.selectedSquare = square;
                state.ui.candidateMoves = g.getValidMoves(square);
            } else {
                state.ui.selectedSquare = null;
                state.ui.candidateMoves = [];
            }
        },

        clearSelection: (state) => {
            state.ui.selectedSquare = null;
            state.ui.candidateMoves = [];
        },
        
        resetGame: (state) => {
            const g = new ChessGame();
            const baseFEN = g.getFEN();
            state.fen = baseFEN;
            state.history = [baseFEN];
            state.historyIndex = 0;

            state.ui.selectedSquare = null;
            state.ui.candidateMoves = [];
            state.ui.checkmateAnimation = false;
            state.multiplayer.isMyTurn = state.multiplayer.playerColor === 'w';
        },

        undoMove: (state) => {
            if (state.historyIndex > 0) {
                state.historyIndex = state.historyIndex - 1;
                state.fen = state.history[state.historyIndex];
            }
            state.ui.selectedSquare = null;
            state.ui.candidateMoves = [];
        },

        redoMove: (state) => {
            if (state.historyIndex < state.history.length - 1) {
                state.historyIndex = state.historyIndex + 1;
                state.fen = state.history[state.historyIndex];
            }
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
            const fen = action.payload.fen;
            state.fen = fen;
            state.history = [fen];
            state.historyIndex = 0;
        },
    },
});

// ========== SELECTORS ==========
// Game instance selectors
const selectGameState = (state) => state.game;

export const selectFEN = (state) => state.game.fen;
export const selectHistory = (state) => state.game.history;
export const selectHistoryIndex = (state) => state.game.historyIndex;

export const selectBoard = createSelector([selectFEN], (fen) => {
    const g = new ChessGame();
    g.loadFEN(fen);
    return g.getBoard();
});

export const selectTurn = createSelector([selectFEN], (fen) => {
    const g = new ChessGame();
    g.loadFEN(fen);
    return g.getTurn();
});

export const selectIsCheck = createSelector([selectFEN], (fen) => {
    const g = new ChessGame();
    g.loadFEN(fen);
    return g.isCheck();
});

export const selectIsCheckmate = createSelector([selectFEN], (fen) => {
    const g = new ChessGame();
    g.loadFEN(fen);
    return g.isCheckmate();
});

export const selectIsStalemate = createSelector([selectFEN], (fen) => {
    const g = new ChessGame();
    g.loadFEN(fen);
    return g.isStalemate();
});

export const selectIsGameOver = createSelector([selectFEN], (fen) => {
    const g = new ChessGame();
    g.loadFEN(fen);
    return g.isGameOver();
});

export const selectWinner = createSelector([selectFEN], (fen) => {
    const g = new ChessGame();
    g.loadFEN(fen);
    return g.getWinner();
});

export const selectMoveHistory = createSelector([selectFEN], (fen) => {
    const g = new ChessGame();
    g.loadFEN(fen);
    return g.getMoveHistory();
});

export const selectCanUndo = (state) => state.game.historyIndex > 0;
export const selectCanRedo = (state) => state.game.historyIndex < state.game.history.length - 1;

export const selectSelectedSquare = (state) => state.game.ui.selectedSquare;

export const selectCandidateMoves = createSelector([selectFEN, selectSelectedSquare], (fen, square) => {
    if (!square) return [];
    const g = new ChessGame();
    g.loadFEN(fen);
    return g.getValidMoves(square);
});

export const selectCheckmateAnimation = (state) => state.game.ui.checkmateAnimation;

export const selectPlayerColor = (state) => state.game.multiplayer.playerColor;
export const selectIsMyTurn = (state) => state.game.multiplayer.isMyTurn;
export const selectOpponentJoined = (state) => state.game.multiplayer.opponentJoined;
export const selectRoomId = (state) => state.game.multiplayer.roomId;
export const selectOpponentName = (state) => state.game.multiplayer.opponentName;

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