// src/validators/isMoveLegal.js

import { getValidMoves } from './getMoves.js';
import { copyBoard } from '../utils/boardUtils.js';
import { executeMove } from '../core/executeMove.js';
import { isSquareAttacked } from '../utils/attackUtils.js';

export const isMoveLegal = ({ from, to, board, turn, lastMove = null, castlingRights = null }) => {
    const piece = board[from.row][from.col];
    if (!piece || piece[0] !== turn) return false;

    const legalMoves = getValidMoves(from, board, turn, lastMove, castlingRights);

    const isValidMove = legalMoves.some(m => m.row === to.row && m.col === to.col);
    if (!isValidMove) return false;

    if (!castlingRights) return true;

    const fullMove = { from, to };
    const { newBoard } = executeMove(copyBoard(board), fullMove, piece, castlingRights);

    let kingPos = null;
    if (piece[1] === 'k') {
        kingPos = { row: to.row, col: to.col };
    } else {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (newBoard[r][c] === turn + 'k') {
                    kingPos = { row: r, col: c };
                    break;
                }
            }
        }
    }

    return !isSquareAttacked(
        kingPos,
        newBoard,
        turn === 'w' ? 'b' : 'w',
        fullMove,
        castlingRights
    );
};


export const isMoveLegalBasic = ({ from, to, board, turn }) => {
    const piece = board[from.row][from.col];
    if (!piece || piece[0] !== turn) return false;

    const legalMoves = getValidMoves(from, board, turn, null, null);
    return legalMoves.some(m => m.row === to.row && m.col === to.col);
};