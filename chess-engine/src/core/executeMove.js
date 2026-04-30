
export const executeMove = (board, move, piece, castlingRights) => {
    // Create deep copy of board
    const newBoard = board.map(row => [...row]);
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

    if (move.castle) {
        const row = piece[0] === 'w' ? 7 : 0;

       
        newBoard[toRow][toCol] = piece;
        newBoard[fromRow][fromCol] = '';

        if (move.castle === 'kingSide') {
            // King-side: rook from h-file (col 7) to f-file (col 5)
            const rookPiece = newBoard[row][7];
            newBoard[row][5] = rookPiece;
            newBoard[row][7] = '';
        } else if (move.castle === 'queenSide') {
            // Queen-side: rook from a-file (col 0) to d-file (col 3)
            const rookPiece = newBoard[row][0];
            newBoard[row][3] = rookPiece;
            newBoard[row][0] = '';
        }

        // Update castling rights (king and rook moved)
        if (piece[0] === 'w') {
            newCastlingRights.w.kingSide = false;
            newCastlingRights.w.queenSide = false;
        } else {
            newCastlingRights.b.kingSide = false;
            newCastlingRights.b.queenSide = false;
        }

        return { newBoard, newCastlingRights, enPassantTarget, capturedPiece };
    }

    // Handle en passant capture
    if (move.enPassant) {
        const direction = piece[0] === 'w' ? -1 : 1;
        const capturedRow = toRow - direction;

        capturedPiece = newBoard[capturedRow][toCol];
        newBoard[capturedRow][toCol] = ''; // Remove captured pawn
        newBoard[toRow][toCol] = piece;
        newBoard[fromRow][fromCol] = '';

        return { newBoard, newCastlingRights, enPassantTarget, capturedPiece };
    }

    // Normal move or capture
    capturedPiece = newBoard[toRow][toCol];
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = '';

    // Handle promotion
    if (move.promotion) {
        const promotedPiece = piece[0] + move.promotion;
        newBoard[toRow][toCol] = promotedPiece;
    }

    // Set en passant target for pawn two-square moves
    if (piece[1] === 'p' && Math.abs(toRow - fromRow) === 2) {
        const direction = piece[0] === 'w' ? -1 : 1;
        enPassantTarget = {
            row: toRow - direction,
            col: toCol
        };
    }

    // Update castling rights if king or rook moved
    if (piece[1] === 'k') {
        if (piece[0] === 'w') {
            newCastlingRights.w.kingSide = false;
            newCastlingRights.w.queenSide = false;
        } else {
            newCastlingRights.b.kingSide = false;
            newCastlingRights.b.queenSide = false;
        }
    }

    if (piece[1] === 'r') {
        if (piece[0] === 'w') {
            if (fromRow === 7 && fromCol === 0) newCastlingRights.w.queenSide = false;
            if (fromRow === 7 && fromCol === 7) newCastlingRights.w.kingSide = false;
        } else {
            if (fromRow === 0 && fromCol === 0) newCastlingRights.b.queenSide = false;
            if (fromRow === 0 && fromCol === 7) newCastlingRights.b.kingSide = false;
        }
    }

    // If a rook is captured, remove castling rights for that side
    if (capturedPiece && capturedPiece[1] === 'r') {
        if (capturedPiece[0] === 'w') {
            if (toRow === 7 && toCol === 0) newCastlingRights.w.queenSide = false;
            if (toRow === 7 && toCol === 7) newCastlingRights.w.kingSide = false;
        } else {
            if (toRow === 0 && toCol === 0) newCastlingRights.b.queenSide = false;
            if (toRow === 0 && toCol === 7) newCastlingRights.b.kingSide = false;
        }
    }

    return { newBoard, newCastlingRights, enPassantTarget, capturedPiece };
};

/**
 * Check if move is a capture
 */
export const isCaptureMove = (board, from, to) => {
    return board[to.row][to.col] !== '';
};

/**
 * Check if move is a pawn promotion
 */
export const isPromotionMove = (piece, toRow) => {
    if (piece[1] !== 'p') return false;
    return (piece[0] === 'w' && toRow === 0) || (piece[0] === 'b' && toRow === 7);
};

/**
 * Get move description in SAN (Standard Algebraic Notation)
 */
export const getMoveSAN = (board, move, piece, capturedPiece, isCheck, isCheckmate) => {
    const pieceType = piece[1].toUpperCase();
    const fromFile = String.fromCharCode(97 + move.from.col);
    const fromRank = 8 - move.from.row;
    const toFile = String.fromCharCode(97 + move.to.col);
    const toRank = 8 - move.to.row;

    let san = '';

    // Handle castling
    if (move.castle) {
        san = move.castle === 'kingSide' ? 'O-O' : 'O-O-O';
        return san;
    }

    // Add piece letter (except pawn)
    if (pieceType !== 'P') {
        san += pieceType;
    }

    // Add capture symbol
    if (capturedPiece) {
        if (pieceType === 'P') {
            san += fromFile; // Pawn captures include file
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