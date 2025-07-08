// src/components/Board/Pieces.jsx
import React, { useContext, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import actionTypes from '../../reducer/actionTypes'

const pieces = import.meta.glob('../../assets/pieces/*.png', {
  eager: true,
  import: 'default'
})

const pieceImages = {}
for (const path in pieces) {
  const fileName = path.split('/').pop().replace('.png', '')
  pieceImages[fileName] = pieces[path]
}

const Pieces = () => {
  const { appstate, dispatch } = useContext(AppContext)
  const position = appstate.position[appstate.position.length - 1]

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

    dispatch({
      type: actionTypes.NEW_MOVE,
      payload: {
        newPosition,
        newMove: {
          from: { row: fromRow, col: fromCol },
          to: { row: toRow, col: toCol },
          piece
        }
      }
    })

    setDraggingPiece(null)
  }

  return (
    <div className="absolute top-0 left-0 w-full h-full grid grid-cols-8 grid-rows-8">
      {position.map((row, rowIndex) =>
        row.map((piece, colIndex) => {
          const isDragging = draggingPiece === `${rowIndex},${colIndex}`
          const isHovered = hoveredSquare?.row === rowIndex && hoveredSquare?.col === colIndex

          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="tile-size flex items-center justify-center relative"
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
                  className={`w-[85%] h-[85%] object-contain cursor-grab ${isDragging ? 'opacity-60' : 'opacity-100'}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', `${rowIndex},${colIndex}`)
                    setDraggingPiece(`${rowIndex},${colIndex}`)
                    setTimeout(() => {
                      e.target.style.display = 'none'
                    }, 0)
                  }}
                  onDragEnd={(e) => {
                    e.target.style.display = 'block'
                    setDraggingPiece(null)
                    setHoveredSquare(null)
                  }}
                />
              )}
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
