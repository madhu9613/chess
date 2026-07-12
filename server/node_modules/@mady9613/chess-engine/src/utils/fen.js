
export const boardToFEN = (board, turn, castlingRights, enPassantTarget = null, halfMoves = 0, fullMoves = 1) => {
    // 1. Piece placement
    const rows = [];
    for (let row = 0; row < 8; row++) {
        let emptyCount = 0;
        let rowString = '';

        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];

            if (piece === '') {
                emptyCount++;
            } else {
                if (emptyCount > 0) {
                    rowString += emptyCount;
                    emptyCount = 0;
                }
                // Convert piece to FEN format (lowercase for black, uppercase for white)
                const fenPiece = piece[0] === 'w' ? piece[1].toUpperCase() : piece[1].toLowerCase();
                rowString += fenPiece;
            }
        }

        if (emptyCount > 0) {
            rowString += emptyCount;
        }
        rows.push(rowString);
    }

    const piecePlacement = rows.join('/');

    const activeColor = turn === 'w' ? 'w' : 'b';


    let castling = '';
    if (castlingRights.w.kingSide) castling += 'K';
    if (castlingRights.w.queenSide) castling += 'Q';
    if (castlingRights.b.kingSide) castling += 'k';
    if (castlingRights.b.queenSide) castling += 'q';
    if (castling === '') castling = '-';

    // 4. En passant target square
    let enPassant = '-';
    if (enPassantTarget) {
        const file = String.fromCharCode(97 + enPassantTarget.col);
        const rank = 8 - enPassantTarget.row;
        enPassant = file + rank;
    }

    return `${piecePlacement} ${activeColor} ${castling} ${enPassant} ${halfMoves} ${fullMoves}`;
};

export const FENToBoard = (fen) => {
    const parts = fen.split(' ');
    const piecePlacement = parts[0];
    const turn = parts[1] === 'w' ? 'w' : 'b';
    const castlingString = parts[2];
    const enPassantString = parts[3];
    const halfMoves = parseInt(parts[4]) || 0;
    const fullMoves = parseInt(parts[5]) || 1;

    // Parse piece placement
    const rows = piecePlacement.split('/');
    const board = Array(8).fill().map(() => Array(8).fill(''));

    const pieceMap = {
        'p': 'p', 'n': 'n', 'b': 'b', 'r': 'r', 'q': 'q', 'k': 'k',
        'P': 'P', 'N': 'N', 'B': 'B', 'R': 'R', 'Q': 'Q', 'K': 'K'
    };

    for (let row = 0; row < 8; row++) {
        let col = 0;
        const rowString = rows[row];

        for (let i = 0; i < rowString.length; i++) {
            const char = rowString[i];

            if (isNaN(parseInt(char))) {
                // It's a piece
                const color = char === char.toUpperCase() ? 'w' : 'b';
                const pieceType = char.toLowerCase();
                board[row][col] = color + pieceType;
                col++;
            } else {
                // It's a number - empty squares
                const emptyCount = parseInt(char);
                for (let e = 0; e < emptyCount; e++) {
                    board[row][col] = '';
                    col++;
                }
            }
        }
    }

    // Parse castling rights
    const castlingRights = {
        w: { kingSide: false, queenSide: false },
        b: { kingSide: false, queenSide: false }
    };

    if (castlingString !== '-') {
        if (castlingString.includes('K')) castlingRights.w.kingSide = true;
        if (castlingString.includes('Q')) castlingRights.w.queenSide = true;
        if (castlingString.includes('k')) castlingRights.b.kingSide = true;
        if (castlingString.includes('q')) castlingRights.b.queenSide = true;
    }

    // Parse en passant target
    let enPassantTarget = null;
    if (enPassantString !== '-') {
        const file = enPassantString.charCodeAt(0) - 97;
        const rank = 8 - parseInt(enPassantString[1]);
        enPassantTarget = { row: rank, col: file };
    }

    return {
        board,
        turn,
        castlingRights,
        enPassantTarget,
        halfMoves,
        fullMoves
    };
};


export const getStartingFEN = () => {
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
};


export const isValidFEN = (fen) => {
    try {
        const { board } = FENToBoard(fen);
        return board && board.length === 8;
    } catch (error) {
        return false;
    }
};