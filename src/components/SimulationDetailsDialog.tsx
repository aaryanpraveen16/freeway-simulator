import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Gauge, Repeat, Info } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import ChartDashboard from "./ChartDashboard";
import { UnitSystem } from "@/utils/unitConversion";
import { SavedSimulation } from "@/services/indexedDBService";

interface SimulationDetailsDialogProps {
  simulation: SavedSimulation | null;
  onOpenChange: (open: boolean) => void;
  unitSystem: UnitSystem;
  calculateNumCars: (simulation: SavedSimulation) => number;
}

const SimulationDetailsDialog: React.FC<SimulationDetailsDialogProps> = ({
  simulation,
  onOpenChange,
  unitSystem,
  calculateNumCars,
}) => {
  if (!simulation) return null;

  const unitConversions = {
    speed: {
      toDisplay: (value: number) => unitSystem === 'metric' ? value * 3.6 : value * 2.23694,
      unit: unitSystem === 'metric' ? 'km/h' : 'mph'
    }
  };

  return (
    <Dialog open={!!simulation} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6 space-y-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {simulation.name} - Simulation #{simulation.simulationNumber}
              <Badge variant="outline" className="capitalize">
                {simulation.trafficRule}
              </Badge>
            </DialogTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-sm">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-blue-500" />
                <span>{calculateNumCars(simulation)} cars</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <span>{simulation.params.numLanes} lanes</span>
              </div>
              <div className="flex items-center gap-2">
                <Gauge size={16} className="text-green-500" />
                <span>{unitConversions.speed.toDisplay(simulation.finalStats.averageSpeed).toFixed(1)} {unitConversions.speed.unit} avg</span>
              </div>
              <div className="flex items-center gap-2">
                <Repeat size={16} className="text-amber-500" />
                <span>{simulation.finalStats.laneChanges} lane changes</span>
              </div>
            </div>
          </DialogHeader>
          
          {/* Per-Lane Throughput Section */}
          {simulation.finalStats.perLaneThroughputs?.length > 0 && (
            <div className="p-4 border rounded-lg bg-muted/10">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                Per-Lane Throughput (cars/hour)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">How is this calculated?</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px] p-4">
                      <p className="font-medium mb-2">How throughput is calculated:</p>
                      <p className="text-sm mb-1">For each lane:</p>
                      <ul className="text-xs space-y-1 list-disc pl-4">
                        <li>Average speed = Sum of all car speeds / number of cars</li>
                        <li>Density = Number of cars / lane length (in km)</li>
                        <li>Throughput = Average speed × Density (cars/hour)</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {simulation.finalStats.perLaneThroughputs.map((throughput, idx) => {
                  const laneName = idx === 0 ? 'Left' : 
                                idx === simulation.finalStats.perLaneThroughputs.length - 1 ? 'Right' : 
                                `Lane ${idx + 1}`;
                  const numLanes = simulation.params.numLanes || 3;
                  const freewayLength = simulation.params.freewayLength || 1;
                  const laneCars = simulation.finalStats.totalCars * (1/numLanes);
                  const avgSpeed = throughput / (laneCars / freewayLength) || 0;
                  
                  return (
                    <div key={idx} className="space-y-2 p-3 border rounded-lg bg-background">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">{laneName}</p>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="text-muted-foreground hover:text-foreground">
                                <Info className="h-3.5 w-3.5" />
                                <span className="sr-only">Calculation details</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[300px] p-3 text-sm whitespace-pre-line" side="top" sideOffset={5}>
                              <p className="font-medium mb-1">{laneName} Calculation:</p>
                              <p className="text-sm">
                                {laneCars.toFixed(0)} cars • {avgSpeed.toFixed(1)} {unitConversions.speed.unit}
                              </p>
                              <p className="mt-2 text-muted-foreground text-xs">
                                Throughput = ({avgSpeed.toFixed(1)} {unitConversions.speed.unit} × {laneCars.toFixed(1)} cars / {freewayLength} km) = {throughput.toFixed(1)} cars/hour
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold min-w-[80px]">
                          {throughput.toFixed(1)}
                        </div>
                        <div className="flex-1 h-3 bg-primary/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-r-full" 
                            style={{ 
                              width: `${Math.min(100, (throughput / Math.max(1, ...simulation.finalStats.perLaneThroughputs)) * 100)}%`,
                              backgroundColor: throughput > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground)/0.5)'
                            }} 
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t">
          <ChartDashboard
            cars={[]}
            elapsedTime={simulation.duration}
            laneLength={1000}
            params={simulation.params}
            trafficRule={simulation.trafficRule}
            unitSystem={unitSystem}
            speedDensityHistory={simulation.chartData.speedByLaneHistory}
            densityOfCarPacksHistory={simulation.chartData.densityOfCarPacksHistory}
            percentageByLaneHistory={simulation.chartData.percentageByLaneHistory}
            densityThroughputHistory={simulation.chartData.densityThroughputHistory}
            laneUtilizationHistory={[]}
            packHistory={simulation.chartData.packHistory}
            packLengthHistory={simulation.chartData.packLengthHistory}
            showPackFormation={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimulationDetailsDialog;
