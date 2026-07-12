import { ChessGame } from '@mady9613/chess-engine';

export const validateMove = (fen, move, turn) => {
    const game = new ChessGame();
    game.loadFEN(fen);

    if (game.getTurn() !== turn) {
        return { success: false, error: 'Not your turn' };
    }

    const result = game.move(move);
    if (!result.success) {
        return { success: false, error: result.error || 'Illegal move' };
    }

    return {
        success: true,
        fen: game.getFEN(),
        san: result.san,
        capture: !!result.capturedPiece,
        check: result.check,
        checkmate: result.checkmate,
        stalemate: result.stalemate,
        promotion: result.promotion || null
    };
};