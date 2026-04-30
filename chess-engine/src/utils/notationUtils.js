// src/utils/notationUtils.js

import { coordToAlgebraic } from './boardUtils.js';

export const getSAN = (piece, fromRow, fromCol, toRow, toCol, captured = false, promotion = null) => {
    const pieceType = piece[1].toUpperCase();
    const toFile = String.fromCharCode(97 + toCol);
    const toRank = 8 - toRow;
    const captureSymbol = captured ? 'x' : '';
    const promoSuffix = promotion ? `=${promotion.toUpperCase()}` : '';

    // Pawn moves don't show piece letter
    if (pieceType === 'P') {
        if (captured) {
            const fromFile = String.fromCharCode(97 + fromCol);
            return `${fromFile}${captureSymbol}${toFile}${toRank}${promoSuffix}`;
        }
        return `${toFile}${toRank}${promoSuffix}`;
    }

    return `${pieceType}${captureSymbol}${toFile}${toRank}${promoSuffix}`;
};


export const getDetailedSAN = (piece, from, to, captured, promotion, isCheck, isCheckmate) => {
    let san = getSAN(piece, from.row, from.col, to.row, to.col, captured, promotion);

    if (isCheckmate) {
        san += '#';
    } else if (isCheck) {
        san += '+';
    }

    return san;
};

export const parseSAN = (san, board, turn) => {
    const cleanSan = san.replace(/[+#]/g, '');

    if (cleanSan === 'O-O') return { castle: 'kingSide' };
    if (cleanSan === 'O-O-O') return { castle: 'queenSide' };

    const match = cleanSan.match(/([NBRQK])?([a-h])?x?([a-h][1-8])(?:=([NBRQ]))?/);
    if (!match) return null;

    const pieceType = match[1] || 'P';
    const toFile = match[3][0];
    const toRank = match[3][1];

    return {
        piece: pieceType,
        to: { row: 8 - parseInt(toRank), col: toFile.charCodeAt(0) - 97 }
    };
};