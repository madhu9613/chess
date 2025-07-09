export const getQueemMoves = (from, board, turn) => {
    const moves = [];
    const directions = [

        { dr: -1, dc: 0 },
        { dr: 1, dc: 0 },
        { dr: 0, dc: -1 },
        { dr: 0, dc: 1 }  ,
        { dr: 1, dc: 1 },
        { dr: 1, dc: -1 },
        { dr: -1, dc: 1 },
        { dr: -1, dc: -1 }
    ];

    for (const { dr, dc } of directions) {
        let r = from.row + dr;
        let c = from.col + dc;

        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const target = board[r][c];

            if (target === '') {
                moves.push({ row: r, col: c, capture: false });
            } else {
                if (target[0] !== turn) {
                    moves.push({ row: r, col: c, capture: true });
                }
                break; // cannot go beyond any piece
            }

            r += dr;
            c += dc;
        }
    }

    return moves;
};
