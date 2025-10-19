
import React, { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Linkedin, ExternalLink, Save, Archive } from "lucide-react";
import { Link } from "react-router-dom";
import { contributors } from "@/types/contributor";
import SaveSimulationDialog from "./SaveSimulationDialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UnitSystem } from "@/utils/unitConversion";

interface NavbarProps {
  canSave?: boolean;
  unitSystem?: UnitSystem;
  onUnitSystemChange?: (system: UnitSystem) => void;
  showNotifications?: boolean;
  onNotificationsToggle?: (enabled: boolean) => void;
  simulationParams?: any;
  simulationResults?: any;
}

const Navbar: React.FC<NavbarProps> = ({ 
  canSave = false, 
  unitSystem = 'metric', 
  onUnitSystemChange, 
  showNotifications = true, 
  onNotificationsToggle,
  simulationParams = {},
  simulationResults = {}
}) => {
  const [showCredits, setShowCredits] = useState(false);

  return (
    <div className="bg-primary text-primary-foreground py-2 px-4 mb-6 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SaveSimulationDialog
            canSave={canSave}
            simulationParams={simulationParams}
            simulationResults={simulationResults}
          />
          
          <div className="flex items-center gap-2">
            <Link to="/saved-simulations">
              <Button variant="secondary" size="sm" className="flex items-center gap-2">
                <Archive size={16} />
                View Saved
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-2 bg-secondary/30 px-3 py-2 rounded-lg border border-secondary/50">
            <div className="flex items-center gap-2">
              <Switch
                id="notifications-toggle"
                checked={showNotifications}
                onCheckedChange={onNotificationsToggle}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-400"
              />
              <Label htmlFor="notifications-toggle" className="text-sm font-medium cursor-pointer">
                {showNotifications ? (
                  <span className="text-green-400">🔔 Toasts On</span>
                ) : (
                  <span className="text-gray-400">🔕 Toasts Off</span>
                )}
              </Label>
            </div>
          </div>
          
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setShowCredits(true)}
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
