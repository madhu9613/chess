import React from 'react'

// Import all images dynamically using Vite's import.meta.glob
const pieces = import.meta.glob('../../assets/pieces/*.png', {
  eager: true,
  import: 'default'
})

const pieceImages = {}
for (const path in pieces) {
  const fileName = path.split('/').pop().replace('.png', '')
  pieceImages[fileName] = pieces[path]
}



// 8x8 position matrix
const initialPosition = [
  ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'],
  ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
  ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr']
]

const Pieces = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-full grid grid-cols-8 grid-rows-8 pointer-events-none">
      {initialPosition.map((row, rowIndex) =>
        row.map((piece, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className="tile-size flex items-center justify-center"
          >
            {piece && (
              <img
                src={pieceImages[piece]}
                alt={piece}
                className="w-[100%] h-[100%] object-contain"
              />
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default Pieces
