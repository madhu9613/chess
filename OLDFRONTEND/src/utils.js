import { getValidMoves } from "./arbiter/getMoves";
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

export const Status = {
    'ongoing' : 'Ongoing',
    'promoting' : 'Promoting',
    'white' : 'White wins',
    'black' : 'Black wins',
    'stalemate' : 'Game draws due to stalemate',
    'insufficient' : 'Game draws due to insufficient material',
}

const pieces = import.meta.glob('./assets/pieces/*.png', {
  eager: true,
  import: 'default'
});

export const pieceImages = {};
for (const path in pieces) {
  const fileName = path.split('/').pop().replace('.png', '');
  pieceImages[fileName] = pieces[path];
}


export const getSAN = (piece, fromRow, fromCol, toRow, toCol, captured = false, promotion = null) => {
  const pieceType = piece[1].toUpperCase();
  const file = String.fromCharCode(97 + toCol);
  const rank = 8 - toRow;
  const captureSymbol = captured ? 'x' : '';
  const promoSuffix = promotion ? `=${promotion.toUpperCase()}` : '';
  return (pieceType === 'P' ? '' : pieceType) + captureSymbol + file + rank + promoSuffix;
};



export const isSquareAttacked = (square, board, byColor, lastMove, castlingRights) => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
     if (piece && piece[0] === byColor) {
  if (piece[1] === 'k') {
    // Manually check king's adjacent squares
    const deltas = [-1, 0, 1];
    for (let dr of deltas) {
      for (let dc of deltas) {
        if (dr === 0 && dc === 0) continue;
        const r = row + dr;
        const c = col + dc;
        if (r === square.row && c === square.col) return true;
      }
    }
    continue;
  }

  const moves = getValidMoves({ row, col }, board, byColor, lastMove, castlingRights);
  if (moves.some(m => m.row === square.row && m.col === square.col)) {
    return true;
  }
}

    }
  }
  return false;
};
