
import React, { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Linkedin, ExternalLink } from "lucide-react";

interface Contributor {
  name: string;
  linkedin?: string;
  portfolio?: string;
}

const contributors: Contributor[] = [
  {
    name: "Aaryan Praveen",
    linkedin: "https://www.linkedin.com/in/aaryanpraveen/",
    portfolio: "https://aaryan-praveen.vercel.app/"
  },
  {
    name: "Aayushi Choksi",
    linkedin: "https://www.linkedin.com/in/aayushi-choksi/"
  },
  {
    name: "Sergey Aityan",
    linkedin: "https://www.linkedin.com/in/sergey-aityan-2555b4200/"
  }
];

const Navbar = () => {
  const [showCredits, setShowCredits] = useState(false);

  return (
    <div className="bg-primary text-primary-foreground py-2 px-4 mb-6 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <h2 className="text-xl font-medium">Freeway Simulator</h2>
        <div className="flex items-center gap-4">
          <Alert variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300 p-2 text-sm">
            <span className="font-bold">⚠️ Work in Progress:</span> This simulation is still in development and may contain bugs.
          </Alert>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowCredits(true)}
            className="bg-white text-primary hover:bg-gray-100"
          >
            Credits
          </Button>
        </div>
      </div>

      <Dialog open={showCredits} onOpenChange={setShowCredits}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Credits</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {contributors.map((contributor) => (
              <div key={contributor.name} className="flex flex-col space-y-2 border-b pb-3 last:border-0">
                <h3 className="font-medium text-lg">{contributor.name}</h3>
                <div className="flex flex-wrap gap-3">
                  {contributor.linkedin && (
                    <a 
                      href={contributor.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      <Linkedin size={16} /> LinkedIn
                    </a>
                  )}
                  {contributor.portfolio && (
                    <a 
                      href={contributor.portfolio} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      <ExternalLink size={16} /> Portfolio
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Navbar;
