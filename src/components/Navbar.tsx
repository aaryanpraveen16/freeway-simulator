import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Linkedin, ExternalLink, Archive, Home, Activity, Bell, BellOff, Info } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { contributors } from "@/types/contributor";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UnitSystem } from "@/utils/unitConversion";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";

interface NavbarProps {
  onSaveSimulation?: (name: string, folder?: string) => void;
  canSave?: boolean;
  unitSystem?: UnitSystem;
  onUnitSystemChange?: (system: UnitSystem) => void;
  showNotifications?: boolean;
  onNotificationsToggle?: (enabled: boolean) => void;
  userId?: string | null;
}

const Navbar: React.FC<NavbarProps> = ({
  unitSystem = 'metric',
  onUnitSystemChange,
  showNotifications = true,
  onNotificationsToggle,
}) => {
  const [showCredits, setShowCredits] = useState(false);
  const location = useLocation();

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-slate-100 py-2.5 px-4 sticky top-0 z-40 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-3 md:gap-5">
          <div className="flex items-center gap-2 font-bold tracking-tight text-white text-base md:text-lg">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/40">
              <Activity className="w-4 h-4" />
            </div>
            <span>Freeway<span className="text-blue-400">Sim</span></span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 border-l border-slate-700/80 pl-4">
            {location.pathname !== "/" && location.pathname !== "/freeway-simulator" && (
              <Link to="/freeway-simulator">
                <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-300 hover:text-white hover:bg-slate-800">
                  <Home size={14} className="mr-1.5" />
                  Simulator
                </Button>
              </Link>
            )}

            <Link to="/saved-simulations">
              <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-300 hover:text-white hover:bg-slate-800">
                <Archive size={14} className="mr-1.5" />
                Saved Runs
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCredits(true)}
              className="h-8 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <Info size={14} className="mr-1.5" />
              Credits
            </Button>
          </div>
        </div>

        {/* Right: Quick toggles & Profile */}
        <div className="flex items-center gap-3">
          {/* Unit Toggle Pill */}
          {onUnitSystemChange && (
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => onUnitSystemChange("metric")}
                className={`px-2 py-1 rounded transition-all font-medium ${
                  unitSystem === "metric"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Metric (km/h)
              </button>
              <button
                type="button"
                onClick={() => onUnitSystemChange("imperial")}
                className={`px-2 py-1 rounded transition-all font-medium ${
                  unitSystem === "imperial"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Imperial (mph)
              </button>
            </div>
          )}

          {/* Notifications switch */}
          {onNotificationsToggle && (
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/80">
              <Switch
                id="notifications-toggle"
                checked={showNotifications}
                onCheckedChange={onNotificationsToggle}
                className="scale-75 data-[state=checked]:bg-blue-600"
              />
              <Label htmlFor="notifications-toggle" className="text-xs cursor-pointer text-slate-300 flex items-center">
                {showNotifications ? (
                  <Bell size={13} className="text-blue-400" />
                ) : (
                  <BellOff size={13} className="text-slate-500" />
                )}
              </Label>
            </div>
          )}

          {/* User Clerk Login */}
          <div className="flex items-center pl-1 border-l border-slate-800">
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="sm" className="h-8 text-xs bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700">
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </div>

      {/* Credits Dialog */}
      <Dialog open={showCredits} onOpenChange={setShowCredits}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">Contributors & Credits</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            {contributors.map((contributor) => (
              <div key={contributor.name} className="flex flex-col space-y-1.5 border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0">
                <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">{contributor.name}</h3>
                <div className="flex flex-wrap gap-3">
                  {contributor.linkedin && (
                    <a
                      href={contributor.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <Linkedin size={14} /> LinkedIn
                    </a>
                  )}
                  {contributor.portfolio && (
                    <a
                      href={contributor.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <ExternalLink size={14} /> Portfolio
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  );
};

export default Navbar;
