// src/utils/boardUtils.js

export const getInitialBoardPosition = () => [
    ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'],
    ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
    ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr']
];


export const getEmptyBoard = () => {
    return Array(8).fill().map(() => Array(8).fill(''));
};


export const copyBoard = (board) => {
    return board.map(row => [...row]);
};

export const algebraicToCoord = (square) => {
    const file = square.charCodeAt(0) - 97;
    const rank = 8 - parseInt(square[1]);
    return { row: rank, col: file };
};

export const coordToAlgebraic = (row, col) => {
    const file = String.fromCharCode(97 + col);
    const rank = 8 - row;
    return `${file}${rank}`;
};


export const isValidCoord = (row, col) => {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
};

export const getPieceAt = (board, square) => {
    const { row, col } = algebraicToCoord(square);
    return board[row][col];
};