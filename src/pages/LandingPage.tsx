import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Car, Linkedin, ExternalLink } from "lucide-react";
import { contributors } from "@/types/contributor";

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-blue-100">
            <Car className="w-10 h-10 text-blue-600" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Freeway Traffic Simulator
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Experience realistic traffic simulation with different driving rules.
            Compare American and European traffic patterns in a dynamic, interactive environment.
          </p>
          
          <div className="flex justify-center">
            <Button 
              size="lg" 
              className="px-8 py-6 text-lg font-semibold"
              onClick={() => navigate('/freeway-simulator')}
            >
              Start Simulation
            </Button>
          </div>
        </div>
        
        <div id="features" className="mt-32 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <Car className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Realistic Simulation</h3>
              <p className="text-gray-600">
                Experience accurate traffic flow modeling with realistic vehicle behaviors.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Multiple Rulesets</h3>
              <p className="text-gray-600">
                Compare American and European traffic rules in the same environment.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.29 7 12 12 20.71 7"></polyline>
                  <line x1="12" y1="22" x2="12" y2="12"></line>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Data Visualization</h3>
              <p className="text-gray-600">
                View real-time analytics and traffic patterns with interactive charts.
              </p>
            </div>
          </div>
          
          {/* Contributors Section */}
          <div id="contributors" className="mt-32 max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Our Team</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {contributors.map((contributor) => (
                <div key={contributor.name} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
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
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
