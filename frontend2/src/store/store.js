import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './gameSlice';

export const store = configureStore({
    reducer: {
        game: gameReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore the ChessGame instance as it's not serializable but needed for internal state
                ignoredActions: ['game/selectSquare', 'game/makeMove', 'game/clearSelection', 'game/resetGame', 'game/undoMove', 'game/redoMove', 'game/syncGameState'],
                ignoredPaths: ['game.gameInstance'],
            },
        }),
});