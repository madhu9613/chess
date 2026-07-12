const DEFAULT_START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const formatMoveText = (sanMoves) => {
    const lines = [];

    for (let i = 0; i < sanMoves.length; i += 2) {
        const moveNumber = Math.floor(i / 2) + 1;
        const whiteMove = sanMoves[i];
        const blackMove = sanMoves[i + 1];
        lines.push(blackMove ? `${moveNumber}.${whiteMove} ${blackMove}` : `${moveNumber}.${whiteMove}`);
    }

    return lines.join(' ');
};

export const buildFFN = (moveHistory = [], startFen = DEFAULT_START_FEN) => {
    const sanMoves = moveHistory.map((move) => move.san).filter(Boolean);
    const moveText = formatMoveText(sanMoves);
    return `FEN:${startFen}|MOVES:${moveText}`;
};

export const START_FEN = DEFAULT_START_FEN;
