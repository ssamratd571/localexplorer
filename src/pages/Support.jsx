export default function Support() {
  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-gradient-to-b from-black to-green-900 p-6">
      
      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl">

        <h1 className="text-white text-3xl font-bold text-center mb-6">
          Support Team
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* 1: Surajit */}
          <div className="bg-white/20 p-4 rounded-xl text-center">
            <img
              src="/Surajit.jpg"
              alt="Surajit"
              className="h-24 w-24 rounded-full mx-auto object-cover border-2 border-white"
            />
            <h2 className="text-white font-bold text-lg mt-3">Dr. Surajit Kundu</h2>
            <p className="text-green-200 text-sm">Project PI</p>
          </div>

          {/* 2: Samrat */}
          <div className="bg-white/20 p-4 rounded-xl text-center">
            <img
              src="/Samrat.jpg"
              alt="Samrat"
              className="h-24 w-24 rounded-full mx-auto object-cover border-2 border-white"
            />
            <h2 className="text-white font-bold text-lg mt-3">Samrat Das</h2>
            <p className="text-green-200 text-sm">Project Associate</p>
          </div>

           {/* 2: Rajkumar */}
          <div className="bg-white/20 p-4 rounded-xl text-center">
            <img
              src="/Rajkumar.jpg"
              alt="Rajkumar"
              className="h-24 w-24 rounded-full mx-auto object-cover border-2 border-white"
            />
            <h2 className="text-white font-bold text-lg mt-3">Rajkumar Mandal</h2>
            <p className="text-green-200 text-sm">Project Assistant</p>
          </div>
          
          {/* 2: Somesh */}
          <div className="bg-white/20 p-4 rounded-xl text-center">
            <img
              src="/Somesh.jpg"
              alt="Somesh"
              className="h-24 w-24 rounded-full mx-auto object-cover border-2 border-white"
            />
            <h2 className="text-white font-bold text-lg mt-3">Somesh Ghosh</h2>
            <p className="text-green-200 text-sm">Technical Supporter</p>
          </div>

          {/* 2: Harshit */}
          <div className="bg-white/20 p-4 rounded-xl text-center">
            <img
              src="/Harshit.jpg"
              alt="Harshit"
              className="h-24 w-24 rounded-full mx-auto object-cover border-2 border-white"
            />
            <h2 className="text-white font-bold text-lg mt-3">Harshit Raj</h2>
            <p className="text-green-200 text-sm">Technical Supporter</p>
          </div>


        </div>

      </div>

    </div>
  );
}
