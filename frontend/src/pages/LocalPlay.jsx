import MoveList from '../components/MoveList';
import BoardLocal from '../components/Board/BoardLocal.jsx';

const LocalPlay = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-stone-100 p-3 md:p-6">

     

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="md:col-span-3 lg:col-span-2 flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col gap-3 md:gap-4">
           
            
            <div className="w-full max-w-[600px] mx-auto">
                <BoardLocal/>
            </div>
        
          </div>
        </div>
        
        
          <div className="bg-stone-800/50 backdrop-blur-sm rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-4 border border-white/10">
            <h3 className="text-lg font-bold text-amber-300 mb-3">Move History</h3>
            <MoveList />
          </div>
          
        
       
      </div>
    </div>
  );
};

export default LocalPlay;