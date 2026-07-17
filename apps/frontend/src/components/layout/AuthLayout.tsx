import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // 1. Removed bg-slate-700 from this div so it doesn't swallow the background
    <div className="antialiased min-h-screen relative text-slate-700">
      
      {/* 2. Changed -z-10 to z-0 so it sits on the base layer correctly */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden flex flex-col justify-between">
        
        {/* Top Wave */}
        <svg className="w-full h-auto min-h-[30vh] object-cover" preserveAspectRatio="none" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
            <path fill="#fdeacc" fillOpacity="0.8" d="M0,96L60,90.7C120,85,240,75,360,96C480,117,600,171,720,181.3C840,192,960,160,1080,133.3C1200,107,1320,85,1380,74.7L1440,64L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"></path>
            <path fill="#fad399" fillOpacity="0.5" d="M0,192L48,176C96,160,192,128,288,138.7C384,149,480,203,576,213.3C672,224,768,192,864,165.3C960,139,1056,117,1152,112C1248,107,1344,117,1392,122.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
            <path fill="#475569" fillOpacity="0.4" d="M0,256L80,234.7C160,213,320,171,480,170.7C640,171,800,213,960,213.3C1120,213,1280,171,1360,149.3L1440,128L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"></path>
        </svg>
        
        {/* Bottom Wave */}
        <svg className="w-full h-auto min-h-[40vh] object-cover -mb-1" preserveAspectRatio="none" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
            <path fill="#e49b0f" fillOpacity="0.15" d="M0,224L60,213.3C120,203,240,181,360,186.7C480,192,600,224,720,229.3C840,235,960,213,1080,186.7C1200,160,1320,128,1380,112L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
            <path fill="#fdeacc" fillOpacity="0.7" d="M0,96L48,112C96,128,192,160,288,181.3C384,203,480,213,576,213.3C672,213,768,203,864,186.7C960,171,1056,149,1152,149.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            <path fill="#475569" fillOpacity="0.5" d="M0,160L80,176C160,192,320,224,480,218.7C640,213,800,171,960,160C1120,149,1280,171,1360,181.3L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
        </svg>
      </div>

      <div className="min-h-screen flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-[768px] embossed-card relative z-10 p-2">
          <div className="px-8 pb-10 pt-4 relative z-10">
            <div className="text-center relative flex flex-col items-center mb-8">
                <div className="w-20 h-20 embossed-badge rounded-full flex items-center justify-center mb-5 -mt-12 bg-lightgray relative z-20">
                    <ShieldCheck className="w-10 h-10 text-gamboge-500 drop-shadow-sm" />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">DRISHTEE</h1>
                <div className="h-1.5 w-16 bg-gamboge-500 rounded-full mt-3 opacity-90 shadow-sm"></div>
            </div>
            
            {children}
            
          </div>
        </div>
      </div>
    </div>
  );
}