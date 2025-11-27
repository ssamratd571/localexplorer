export default function Tourist() {
  return (
    <div className="min-h-screen text-white p-10">
      
      <h1 className="text-4xl font-bold text-center mb-10">
        Darjeeling Tourist Places
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Tiger Hill */}
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-lg">
          <img 
            src="/TH.jpg" 
            alt="Tiger Hill" 
            className="rounded-xl mb-4 w-full h-40 object-cover"
          />
          <h2 className="text-2xl font-bold mb-3 text-yellow-300">Tiger Hill</h2>
          <p className="text-sm leading-relaxed">
            World famous sunrise point. You can see beautiful sunrise over Mt. Kanchenjunga.
            Very popular for early morning views and photography.
          </p>
        </div>

        {/* Batasia Loop */}
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/30 shadow-lg">
          <img 
            src="/BL.jpg" 
            alt="Batasia Loop" 
            className="rounded-xl mb-4 w-full h-40 object-cover"
          />
          <h2 className="text-2xl font-bold mb-3 text-green-300">Batasia Loop</h2>
          <p className="text-sm leading-relaxed">
            A unique spiral railway track where toy train makes a complete loop.
            Beautiful gardens, war memorial and stunning Himalayan views.
          </p>
        </div>

        {/* Darjeeling Himalayan Railway */}
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-lg">
          <img 
            src="/TT.jpg" 
            alt="Toy Train" 
            className="rounded-xl mb-4 w-full h-40 object-cover"
          />
          <h2 className="text-2xl font-bold mb-3 text-blue-300">Darjeeling Himalayan Railway</h2>
          <p className="text-sm leading-relaxed">
            UNESCO World Heritage narrow gauge railway. Popularly known as the Toy Train.
            Must visit experience with historic charm and scenic journey.
          </p>
        </div>

      </div>
    </div>
  );
}

