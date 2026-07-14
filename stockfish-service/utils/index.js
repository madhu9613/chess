 export const toAlgebraic = (row, col) => `${String.fromCharCode(97 + col)}${8 - row}`;

export const LEVELS = {
    easy: { skillLevel: 4, movetime: 140, depth: 8 },
    medium: { skillLevel: 10, movetime: 350, depth: 12 },
    hard: { skillLevel: 18, movetime: 900, depth: 16 },
};

 export const fromUciMove = (uciMove) => {
    if (!uciMove || uciMove.length < 4) return null;
    const from = uciMove.slice(0, 2);
    const to = uciMove.slice(2, 4);
    const promotion = uciMove.length > 4 ? uciMove.slice(4, 5) : undefined;
    return { from, to, promotion };
};

export const moveToSan = (fen, uciMove) => {
    const parsedMove = fromUciMove(uciMove);
    if (!parsedMove) return uciMove;

    const game = new ChessGame();
    game.loadFEN(fen);
    const result = game.move(parsedMove);
    return result.success ? result.san : uciMove;
};
