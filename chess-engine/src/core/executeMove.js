// src/core/executeMove.js

import { copyBoard } from '../utils/boardUtils.js';

export const executeMove = (board, move, piece, castlingRights) => {
    // Create deep copies
    const newBoard = copyBoard(board);
    const newCastlingRights = {
        w: { ...castlingRights.w },
        b: { ...castlingRights.b }
    };

    let enPassantTarget = null;
    let capturedPiece = null;

    const fromRow = move.from.row;
    const fromCol = move.from.col;
    const toRow = move.to.row;
    const toCol = move.to.col;

    // Handle castling
    if (move.castle) {
        return handleCastling(newBoard, move, piece, newCastlingRights, fromCol);
    }

    // Handle en passant capture
    if (move.enPassant) {
        return handleEnPassant(newBoard, move, piece, newCastlingRights);
    }

    // Normal move or capture
    capturedPiece = newBoard[toRow][toCol];
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = '';

    // Handle promotion
    if (move.promotion) {
        newBoard[toRow][toCol] = piece[0] + move.promotion;
    }

    // Set en passant target for pawn two-square moves
    if (piece[1] === 'p' && Math.abs(toRow - fromRow) === 2) {
        const direction = piece[0] === 'w' ? -1 : 1;
        enPassantTarget = {
            row: toRow - direction,
            col: toCol
        };
    }

    // Update castling rights
    updateCastlingRights(newCastlingRights, piece, fromRow, fromCol, capturedPiece, toRow, toCol);

    // ALWAYS return consistent shape - NEVER null for castlingRights
    return {
        newBoard,
        newCastlingRights,
        enPassantTarget,
        capturedPiece
    };
};

const handleCastling = (board, move, piece, castlingRights, fromCol) => {
    const row = piece[0] === 'w' ? 7 : 0;
    const toCol = move.castle === 'kingSide' ? 6 : 2;
    const rookFromCol = move.castle === 'kingSide' ? 7 : 0;
    const rookToCol = move.castle === 'kingSide' ? 5 : 3;

    // Move king (use actual fromCol from move, not hardcoded 4)
    board[row][toCol] = piece;
    board[row][fromCol] = '';

    // Move rook
    const rookPiece = board[row][rookFromCol];
    board[row][rookToCol] = rookPiece;
    board[row][rookFromCol] = '';

    // Update castling rights
    if (piece[0] === 'w') {
        castlingRights.w.kingSide = false;
        castlingRights.w.queenSide = false;
    } else {
        castlingRights.b.kingSide = false;
        castlingRights.b.queenSide = false;
    }

    // ALWAYS return consistent shape - NEVER null
    return {
        newBoard: board,
        newCastlingRights: castlingRights,
        enPassantTarget: null,
        capturedPiece: null
    };
};


const handleEnPassant = (board, move, piece, castlingRights) => {
    const direction = piece[0] === 'w' ? -1 : 1;
    const capturedRow = move.to.row - direction;
    const capturedPiece = board[capturedRow][move.to.col];

    // Execute en passant capture
    board[capturedRow][move.to.col] = '';
    board[move.to.row][move.to.col] = piece;
    board[move.from.row][move.from.col] = '';

    // ALWAYS return consistent shape with preserved castlingRights
    return {
        newBoard: board,
        newCastlingRights: castlingRights,  // NEVER null - preserve existing rights
        enPassantTarget: null,
        capturedPiece
    };
};

/**
 * Update castling rights after move
 */
const updateCastlingRights = (castlingRights, piece, fromRow, fromCol, capturedPiece, toRow, toCol) => {
    // King moved
    if (piece[1] === 'k') {
        if (piece[0] === 'w') {
            castlingRights.w.kingSide = false;
            castlingRights.w.queenSide = false;
        } else {
            castlingRights.b.kingSide = false;
            castlingRights.b.queenSide = false;
        }
        return; // King moved, no need to check rook
    }

    // Rook moved from its starting square
    if (piece[1] === 'r') {
        if (piece[0] === 'w') {
            if (fromRow === 7 && fromCol === 0) castlingRights.w.queenSide = false;
            if (fromRow === 7 && fromCol === 7) castlingRights.w.kingSide = false;
        } else {
            if (fromRow === 0 && fromCol === 0) castlingRights.b.queenSide = false;
            if (fromRow === 0 && fromCol === 7) castlingRights.b.kingSide = false;
        }
    }

    // Rook captured on its starting square
    if (capturedPiece && capturedPiece[1] === 'r') {
        if (capturedPiece[0] === 'w') {
            // White rook captured on back rank
            if (toRow === 7 && toCol === 0) castlingRights.w.queenSide = false;
            if (toRow === 7 && toCol === 7) castlingRights.w.kingSide = false;
        } else {
            // Black rook captured on back rank
            if (toRow === 0 && toCol === 0) castlingRights.b.queenSide = false;
            if (toRow === 0 && toCol === 7) castlingRights.b.kingSide = false;
        }
    }
};


export const isCaptureMove = (board, from, to) => {
    return board[to.row][to.col] !== '';
};

export const isPromotionMove = (piece, toRow) => {
    if (piece[1] !== 'p') return false;
    return (piece[0] === 'w' && toRow === 0) || (piece[0] === 'b' && toRow === 7);
};


export const getMoveSAN = (board, move, piece, capturedPiece, isCheck, isCheckmate) => {
    const pieceType = piece[1].toUpperCase();
    const fromFile = String.fromCharCode(97 + move.from.col);
    const toFile = String.fromCharCode(97 + move.to.col);
    const toRank = 8 - move.to.row;

    let san = '';

    // Handle castling
    if (move.castle) {
        return move.castle === 'kingSide' ? 'O-O' : 'O-O-O';
    }

    // Add piece letter (except pawn)
    if (pieceType !== 'P') {
        san += pieceType;
    }

    // Add capture symbol
    if (capturedPiece) {
        if (pieceType === 'P') {
            san += fromFile;
        }
        san += 'x';
    }

    // Add destination square
    san += toFile + toRank;

    // Add promotion
    if (move.promotion) {
        san += '=' + move.promotion.toUpperCase();
    }

    // Add check/checkmate
    if (isCheckmate) {
        san += '#';
    } else if (isCheck) {
        san += '+';
    }

    return san;
};


export const getMoveMetadata = (board, move, piece, turn, getAllLegalMovesFn) => {
    // This would require the game state to determine
    // Implement this separately in ChessGame class
    return {
        isCheck: false,
        isCheckmate: false,
        isStalemate: false
    };
};