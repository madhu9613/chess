import React from 'react'

const Sidebar = () => {
  return (
     <div className="w-16 md:w-20 bg-[#111111] border-r border-gray-800 flex flex-col items-center py-6">
        {/* Icons or nav items */}
        <div className="mb-6 text-xs">LOGO</div>
        <div className="flex flex-col gap-6 text-gray-400 text-xl">
          <span>🏠</span>
          <span>⚙️</span>
          <span>❓</span>
        </div>
      </div>
  )
}

export default Sidebar