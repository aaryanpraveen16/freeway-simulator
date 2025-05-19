
import React from "react";
import { Alert } from "@/components/ui/alert";

const Navbar = () => {
  return (
    <div className="bg-primary text-primary-foreground py-2 px-4 mb-6 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <h2 className="text-xl font-medium">Freeway Simulator</h2>
        <Alert variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300 p-2 text-sm">
          <span className="font-bold">⚠️ Work in Progress:</span> This simulation is still in development and may contain bugs.
        </Alert>
      </div>
    </div>
  );
};

export default Navbar;
