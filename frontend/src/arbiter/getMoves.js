import { useContext } from 'react';
import { getBishapMoves } from './PiecesLogic/bishap';
import { getKingMoves } from './PiecesLogic/king';
import { getKnightMoves } from './PiecesLogic/knight';
import { getPawnMoves } from './PiecesLogic/pawn';
import { getQueenMoves } from './PiecesLogic/queen';
import { getRookMoves } from './PiecesLogic/rook';
import { AppContext } from '../context/AppContext';

export const getValidMoves = (from, board, turn,lastMove) => {
    const piece = board[from.row][from.col];
   

    if (!piece || piece[0] !== turn) return [];

    const type = piece[1]; // second letter is piece type (e.g., 'r' for rook)

    switch (type) {
        case 'r':
            return getRookMoves(from, board, turn);

        case 'b':
            return getBishapMoves(from,board,turn);

        case 'n':
             return getKnightMoves(from,board,turn);
        case 'p':
            return getPawnMoves(from,board,turn,lastMove);
        
        case 'q':
            return getQueenMoves(from,board,turn);
        
        case 'k':
            return getKingMoves(from,board,turn)

        default:
            // For testing: allow moving to any square except own pieces
            {
            const moves = [];
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    if (row === from.row && col === from.col) continue;

                    const targetPiece = board[row][col];
                    const isFriendly = targetPiece && targetPiece[0] === turn;

                    if (isFriendly) continue; 

                    const isCapture = targetPiece && targetPiece[0] !== turn;

                    moves.push({ row, col, capture: isCapture });
                }
            }
            return moves;
        }

    }
};
