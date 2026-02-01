import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Car, Linkedin, ExternalLink } from "lucide-react";
import { contributors } from "@/types/contributor";

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="container mx-auto px-4 py-16 md:py-24">
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center mb-24">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-blue-100">
            <Car className="w-10 h-10 text-blue-600" />
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Freeway Traffic Simulator
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            A high-performance research tool developed to model complex traffic physics.
            Compare American and European traffic patterns using state-of-the-art mathematical models.
          </p>

          <div className="flex justify-center">
            <Button
              size="lg"
              className="px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={() => navigate('/freeway-simulator')}
            >
              Start Simulation
            </Button>
          </div>
        </div>

        {/* Getting Started Guide */}
        <div id="guide" className="mt-32 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Getting Started</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Follow these simple steps to begin your traffic simulation journey.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="relative p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg">1</div>
              <h3 className="font-bold mb-2">Configure</h3>
              <p className="text-sm text-gray-500">Adjust parameters like density, speed limits, and vehicle types in the settings panel.</p>
            </div>

            <div className="relative p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg">2</div>
              <h3 className="font-bold mb-2">Launch</h3>
              <p className="text-sm text-gray-500">Press the <strong>Start</strong> button in the sticky control bar to begin the real-time simulation.</p>
            </div>

            <div className="relative p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg">3</div>
              <h3 className="font-bold mb-2">Interact</h3>
              <p className="text-sm text-gray-500">Tap on any vehicle to force a stop and watch how the pack formation reacts to the obstacle.</p>
            </div>

            <div className="relative p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg">4</div>
              <h3 className="font-bold mb-2">Analyze</h3>
              <p className="text-sm text-gray-500">Monitor the live charts to observe throughput and density stabilization over time.</p>
            </div>
          </div>
        </div>

        {/* Technical Stack */}
        <div id="tech-stack" className="mt-32 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Under the Hood</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Built to handle hundreds of concurrent vehicles without sacrificing accuracy or UI responsiveness.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-50 shadow-sm">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">IDM & MOBIL Physics</h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    Powered by the <strong>Intelligent Driver Model (IDM)</strong> for deterministic longitudinal acceleration and
                    the <strong>MOBIL</strong> model for incentive-based lane-changing logic.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-50 shadow-sm">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.040L3 14.535a11.99 11.99 0 011.077 5.483l1.838 1.838a1.5 1.5 0 002.122 0l11.036-11.036a1.5 1.5 0 000-2.122l-1.838-1.838A11.991 11.991 0 0121 14.535l-.382-8.551z" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Web Worker Thread</h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    The physics engine runs on a dedicated <strong>background worker</strong>, preventing the calculation-heavy sim
                    loops from blocking the main UI thread.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-50 shadow-sm">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">GPU Acceleration</h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    By bypassing the DOM and rendering directly to <strong>HTML5 Canvas</strong>, the simulator leverages GPU
                    processing to draw hundreds of cars at 60 FPS.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden flex flex-col justify-center">
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4 italic">"Just about the math..."</h3>
                <p className="text-blue-100 leading-relaxed mb-6">
                  What started as a mathematical exercise with <strong>Professor Aityan</strong> evolved into a high-scale
                  visualization challenge. This project explores the limits of real-time web technologies for complex scientific modeling.
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-xl">🎓</div>
                  <div>
                    <p className="font-semibold">The Vision</p>
                    <p className="text-sm text-blue-300">Physics meets Web Performance</p>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-blue-800 rounded-full blur-3xl opacity-50"></div>
              <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-blue-700 rounded-full blur-3xl opacity-30"></div>
            </div>
          </div>
        </div>

        {/* Scientific Rigor */}
        <div id="analytics" className="mt-32 max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-sm font-semibold text-blue-900">Stabilization Status</span>
                  <span className="px-2 py-1 bg-green-500 text-white text-[10px] rounded-full animate-pulse uppercase tracking-wider font-bold">Fixed Point</span>
                </div>
                <div className="h-32 w-full bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                  <svg className="w-full h-full text-blue-500 opacity-30 px-4" viewBox="0 0 100 40">
                    <path d="M0 35 Q 10 5, 20 25 T 40 15 T 60 22 T 80 20 L 100 20" fill="none" stroke="currentColor" strokeWidth="2" />
                    <line x1="60" y1="0" x2="60" y2="40" stroke="currentColor" strokeWidth="1" strokeDasharray="4" />
                  </svg>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Confidence</p>
                    <p className="text-lg font-bold text-gray-900">98.4%</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Precision</p>
                    <p className="text-lg font-bold text-gray-900">σ &lt; 0.05</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold mb-6">Scientific Rigor</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Move beyond simple visual observation. The simulator includes a built-in <strong>Stabilization Calculator</strong>
                that monitors real-time variance in throughput and density.
              </p>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</div>
                  <p className="text-sm text-gray-700"><strong>Steady-State Detection</strong>: Automatically identify when traffic flow has reached equilibrium.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</div>
                  <p className="text-sm text-gray-700"><strong>Convergence Metrics</strong>: Get a mathematical confidence level for every data point collected.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</div>
                  <p className="text-sm text-gray-700"><strong>Reproducible Models</strong>: Toggle between stochastic and deterministic driver behaviors.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Research Workflow */}
        <div id="research-workflow" className="mt-32 max-w-5xl mx-auto bg-slate-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
          <div className="relative z-10 grid md:grid-cols-3 gap-12">
            <div className="md:col-span-1">
              <h2 className="text-3xl font-bold mb-4 text-white">Research Workflow</h2>
              <p className="text-slate-300 mb-8">
                Designed for teams who need to run heavy iterations and maintain strict data portability.
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center border border-white/10">☁️</div>
                  <span className="text-sm font-medium">Cloud Persistence (MongoDB)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center border border-white/10">📂</div>
                  <span className="text-sm font-medium">Batch Scenario Organization</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center border border-white/10">📥</div>
                  <span className="text-sm font-medium">Full JSON Data Portability</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 grid sm:grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                <h3 className="font-bold text-xl mb-3 text-white">Batch Sim Engine</h3>
                <p className="text-sm text-slate-300">
                  Launch multiple scenarios in parallel tabs. The engine automatically cycles through parameters and saves results to grouped folders.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                <h3 className="font-bold text-xl mb-3 text-white">Collaboration</h3>
                <p className="text-sm text-slate-300">
                  Secure Clerk authentication allows shared access to results across your research team with role-based access controls.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                <h3 className="font-bold text-xl mb-3 text-white">Data Export</h3>
                <p className="text-sm text-slate-300">
                  Export simulation runs as raw JSON packages, ready for analysis in Python, R, or MATLAB for secondary modeling.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-dashed border-white/20 text-center flex items-center justify-center">
                <p className="italic text-slate-400 text-sm">Expanding research capabilities...</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(59,130,246,0.1),transparent)] pointer-events-none"></div>
        </div>

        {/* Contributors Section */}
        <div id="contributors" className="mt-32 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Team</h2>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            {contributors.map((contributor) => (
              <div key={contributor.name} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-4 text-2xl font-bold text-blue-600">
                  {contributor.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="text-xl font-semibold mb-2">{contributor.name}</h3>

                <div className="flex gap-3 mt-3">
                  {contributor.linkedin && (
                    <a
                      href={contributor.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-colors"
                      aria-label={`${contributor.name}'s LinkedIn`}
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                  {contributor.portfolio && (
                    <a
                      href={contributor.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-colors"
                      aria-label={`${contributor.name}'s Portfolio`}
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
