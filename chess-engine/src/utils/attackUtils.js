// src/utils/attackUtils.js

import { getValidMoves } from '../validators/getMoves.js';


export const isSquareAttacked = (square, board, byColor, lastMove, castlingRights) => {
    if (!square) return false;

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (!piece || piece[0] !== byColor) continue;

            // Fast path for king attacks (adjacent squares)
            if (piece[1] === 'k') {
                const rowDiff = Math.abs(row - square.row);
                const colDiff = Math.abs(col - square.col);
                if (rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0)) {
                    return true;
                }
                continue;
            }

            // For other pieces, get their valid moves
            const moves = getValidMoves({ row, col }, board, byColor, lastMove, castlingRights);
            if (moves.some(m => m.row === square.row && m.col === square.col)) {
                return true;
            }
        }
    }
    return false;
};


export const doesPieceAttackSquare = (piecePos, square, board, byColor, lastMove, castlingRights) => {
    const piece = board[piecePos.row][piecePos.col];
    if (!piece || piece[0] !== byColor) return false;

    const moves = getValidMoves(piecePos, board, byColor, lastMove, castlingRights);
    return moves.some(m => m.row === square.row && m.col === square.col);
};