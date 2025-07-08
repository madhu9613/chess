import React, { useState } from 'react'

// Load images
const pieces = import.meta.glob('../../assets/pieces/*.png', {
  eager: true,
  import: 'default'
})

const pieceImages = {}
for (const path in pieces) {
  const fileName = path.split('/').pop().replace('.png', '')
  pieceImages[fileName] = pieces[path]
}

// Initial board
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
  const [position, setPosition] = useState(initialPosition)
  const [lastMove, setLastMove] = useState({ from: null, to: null })
  const [draggingPiece, setDraggingPiece] = useState(null)
  const [hoveredSquare, setHoveredSquare] = useState(null)

  const handleDrop = (e, toRow, toCol) => {
    e.preventDefault()
    setHoveredSquare(null)

    const data = e.dataTransfer.getData('text/plain')
    const [fromRow, fromCol] = data.split(',').map(Number)

    if (fromRow === toRow && fromCol === toCol) return

    const piece = position[fromRow][fromCol]
    const newPosition = position.map(row => [...row])

    newPosition[fromRow][fromCol] = ''
    newPosition[toRow][toCol] = piece

    setPosition(newPosition)
    setLastMove({
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol }
    })
    setDraggingPiece(null)
  }

  return (
    <div className="absolute top-0 left-0 w-full h-full grid grid-cols-8 grid-rows-8">
      {position.map((row, rowIndex) =>
        row.map((piece, colIndex) => {
          const isFrom =
            lastMove.from?.row === rowIndex && lastMove.from?.col === colIndex
          const isTo =
            lastMove.to?.row === rowIndex && lastMove.to?.col === colIndex
          const isDragging = draggingPiece === `${rowIndex},${colIndex}`
          const isHovered = hoveredSquare?.row === rowIndex &&
            hoveredSquare?.col === colIndex

          const highlightColor = isFrom
            ? 'bg-green-300/50'
            : isTo
              ? 'bg-yellow-300/50'
              : ''

          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`tile-size flex items-center justify-center ${highlightColor} transition-colors duration-150 relative`}
              onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
              onDragOver={(e) => {
                e.preventDefault()
                setHoveredSquare({ row: rowIndex, col: colIndex })
              }}
              onDragEnter={() => setHoveredSquare({ row: rowIndex, col: colIndex })}
              onDragLeave={() => setHoveredSquare(null)}
            >
              {piece && (
                <img
                  src={pieceImages[piece]}
                  alt={piece}
                  className={`w-[85%] h-[85%] object-contain cursor-grab active:cursor-grabbing drop-shadow-lg transition-opacity duration-150 ${isDragging ? 'opacity-60' : 'opacity-100'
                    }`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', `${rowIndex},${colIndex}`)
                    setDraggingPiece(`${rowIndex},${colIndex}`)
                    setTimeout(() => {
                      e.target.style.display = 'none'
                    }, 0)
                    setHoveredSquare(null)
                  }}
                  onDragEnd={(e) => {
                           e.target.style.display = 'block'

                    setDraggingPiece(null)
                    setHoveredSquare(null)
                  }}
             
                  onDragOver={(e)=>
                    e.preventDefault()
                  }

                />
              )}

              {/* Hover indicator - subtle border on target square */}
              {isHovered && (
                <div className="absolute inset-0 border-2 border-blue-400 rounded z-10 pointer-events-none"></div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

export default Pieces