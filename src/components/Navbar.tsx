
import React, { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Linkedin, ExternalLink } from "lucide-react";
import { contributors } from "@/types/contributor";

const Navbar = () => {
  const [showCredits, setShowCredits] = useState(false);

  return (
    <div className="bg-primary text-primary-foreground py-2 px-4 mb-6 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <h2 className="text-xl font-medium">Freeway Simulator</h2>
        <div className="flex items-center gap-4">
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
