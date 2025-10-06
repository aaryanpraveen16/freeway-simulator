import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { BarChart3, Calendar, CheckSquare, Clock, Copy, Edit2, Eye, Gauge, Info, Repeat, Square, Trash2, Users } from "lucide-react";
import { indexedDBService, SavedSimulation } from "@/services/indexedDBService";
import { useToast } from "@/hooks/use-toast";
import { extractSimulationParams, formatParamsWithUnits } from "../utils/simulationUtils";
import { UnitSystem, getUnitConversions } from "@/utils/unitConversion";
import ChartDashboard from "@/components/ChartDashboard";
import EditSimulationNameDialog from "@/components/EditSimulationNameDialog";
import OverlayThroughputDensityChart from "@/components/OverlayThroughputDensityChart";
import OverlaySpeedChart from "@/components/OverlaySpeedChart";
import OverlayDensityChart from "@/components/OverlayDensityChart";
import OverlayLaneUsageChart from "@/components/OverlayLaneUsageChart";
import OverlayPackFormationChart from "@/components/OverlayPackFormationChart";

const SavedSimulations: React.FC = () => {
  const [savedSimulations, setSavedSimulations] = useState<SavedSimulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSimulation, setSelectedSimulation] = useState<SavedSimulation | null>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<Set<string>>(new Set());
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const { toast } = useToast();
  
  const unitConversions = getUnitConversions(unitSystem);

  useEffect(() => {
    loadSimulations();
  }, []);

  const copySimulationParams = async (simulation: SavedSimulation) => {
    try {
      const params = extractSimulationParams(simulation);
      const formattedString = formatParamsWithUnits(params, unitSystem);
      await navigator.clipboard.writeText(formattedString);
      
      toast({
        title: "Success",
        description: "Simulation parameters copied to clipboard",
        variant: "default",
      });
    } catch (error) {
      console.error('Error copying simulation parameters:', error);
      toast({
        title: "Error",
        description: "Failed to copy simulation parameters",
        variant: "destructive",
      });
    }
  };

  const loadSimulations = async () => {
    try {
      const simulations = await indexedDBService.getAllSimulations();
      console.log('Loaded simulations:', simulations);
      setSavedSimulations(simulations.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Error loading simulations:', error);
      toast({
        title: "Error",
        description: "Failed to load saved simulations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSimulation = async (id: string) => {
    try {
      await indexedDBService.deleteSimulation(id);
      setSavedSimulations(prev => prev.filter(sim => sim.id !== id));
      toast({
        title: "Success",
        description: "Simulation deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting simulation:', error);
      toast({
        title: "Error",
        description: "Failed to delete simulation",
        variant: "destructive",
      });
    }
  };

  const updateSimulationName = async (id: string, newName: string) => {
    try {
      const simulation = savedSimulations.find(sim => sim.id === id);
      if (!simulation) return;

      const updatedSimulation = { ...simulation, name: newName };
      await indexedDBService.updateSimulation(updatedSimulation);
      
      setSavedSimulations(prev => 
        prev.map(sim => sim.id === id ? updatedSimulation : sim)
      );
      
      toast({
        title: "Success",
        description: "Simulation name updated successfully",
      });
    } catch (error) {
      console.error('Error updating simulation name:', error);
      toast({
        title: "Error",
        description: "Failed to update simulation name",
        variant: "destructive",
      });
    }
  };

  const handleComparisonSelection = (simulationId: string, checked: boolean) => {
    setSelectedForComparison(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(simulationId);
      } else {
        newSet.delete(simulationId);
      }
      return newSet;
    });
  };

  const selectAllForComparison = () => {
    setSelectedForComparison(new Set(savedSimulations.map(sim => sim.id)));
  };

  const deselectAllForComparison = () => {
    setSelectedForComparison(new Set());
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const calculateNumCars = (simulation: SavedSimulation) => {
    // Calculate total cars based on traffic density and freeway length
    const numLanes = simulation.params.numLanes || 2;
    const freewayLength = simulation.params.freewayLength || 10;
    const trafficDensity = simulation.params.trafficDensity || 0.62;
    
    // Total cars = density (cars/km) * freeway length (km) * number of lanes
    const totalCars = Math.round(trafficDensity * freewayLength * numLanes);
    
    return totalCars;
  };

  const getSelectedSimulations = () => {
    return savedSimulations.filter(sim => selectedForComparison.has(sim.id));
  };





  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading saved simulations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Saved Simulations</h1>
          <p className="text-gray-600 mt-2">View and analyze your previously saved traffic simulations</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Metric</span>
            <Switch
              checked={unitSystem === 'imperial'}
              onCheckedChange={(checked) => setUnitSystem(checked ? 'imperial' : 'metric')}
            />
            <span className="text-sm text-gray-600">Imperial</span>
          </div>
          <Link to="/freeway-simulator">
            <Button variant="outline">Back to Simulator</Button>
          </Link>
        </div>
      </div>

      {savedSimulations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Simulations</h3>
              <p className="text-gray-500 mb-4">You haven't saved any simulations yet.</p>
              <Link to="/freeway-simulator">
                <Button>Start New Simulation</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="individual" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <Eye size={16} />
              Individual Simulations
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <BarChart3 size={16} />
              Simulation Comparison
            </TabsTrigger>
          </TabsList>

          <TabsContent value="individual">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedSimulations.map((simulation) => (
                <Card key={simulation.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span>{simulation.name}</span>
                          <Badge variant="secondary">#{simulation.simulationNumber}</Badge>
                          <EditSimulationNameDialog
                            currentName={simulation.name}
                            onSave={(newName) => updateSimulationName(simulation.id, newName)}
                          />
                        </CardTitle>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <Calendar size={14} />
                          {formatDate(simulation.timestamp)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
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
                        <Clock size={16} className="text-purple-500" />
                        <span>{formatDuration(simulation.duration)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Repeat size={16} className="text-amber-500" />
                        <span>{simulation.finalStats.laneChanges} lane changes</span>
                      </div>
                      {simulation.finalStats.perLaneThroughputs && simulation.finalStats.perLaneThroughputs.length > 0 && (
                        <div className="col-span-2 pt-2 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">Per-Lane Throughput (cars/hour)</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className="text-muted-foreground hover:text-foreground">
                                    <Info className="h-3.5 w-3.5" />
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
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {simulation.finalStats.perLaneThroughputs.map((throughput, idx) => {
                              const laneName = idx === 0 ? 'Left' : 
                                            idx === simulation.finalStats.perLaneThroughputs.length - 1 ? 'Right' : 
                                            `Lane ${idx + 1}`;
                              const numLanes = simulation.params.numLanes || 3;
                              const freewayLength = simulation.params.freewayLength || 1;
                              const laneCars = simulation.finalStats.totalCars * (1/numLanes); // Approximate cars per lane
                              const avgSpeed = throughput / (laneCars / freewayLength) || 0;
                              
                              return (
                                <div key={idx} className="space-y-1 border rounded-lg p-3 bg-muted/20">
                                  <div className="flex justify-between items-center">
                                    <p className="text-sm font-medium">{laneName}</p>
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
                                  <div className="text-xl font-bold">
                                    {throughput.toFixed(1)}
                                  </div>
                                  <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-primary rounded-r-full" 
                                      style={{ 
                                        width: `${Math.min(100, (throughput / Math.max(1, ...simulation.finalStats.perLaneThroughputs)) * 100)}%`,
                                        backgroundColor: throughput > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground)/0.5)'
                                      }} 
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t gap-2">
                      <Badge variant="outline" className="capitalize">
                        {simulation.trafficRule}
                      </Badge>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSimulation(simulation)}
                            >
                              <Eye size={16} />
                            </Button>
                          </DialogTrigger>
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            copySimulationParams(simulation);
                          }}
                          title="Copy simulation parameters"
                        >
                          <Copy size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSimulation(simulation.id);
                          }}
                          className="text-red-600 hover:text-red-700"
                          title="Delete simulation"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="comparison">
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Multi-Simulation Analysis</h2>
                <p className="text-gray-600">
                  Select simulations to compare their performance metrics
                </p>
              </div>

              {/* Selection Controls */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Select Simulations for Comparison</CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={selectAllForComparison}
                        disabled={savedSimulations.length === 0}
                      >
                        <CheckSquare size={16} className="mr-1" />
                        Select All
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={deselectAllForComparison}
                        disabled={selectedForComparison.size === 0}
                      >
                        <Square size={16} className="mr-1" />
                        Deselect All
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedForComparison.size} of {savedSimulations.length} simulations selected
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedSimulations.map((simulation) => (
                      <div key={simulation.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={`comparison-${simulation.id}`}
                          checked={selectedForComparison.has(simulation.id)}
                          onCheckedChange={(checked) => 
                            handleComparisonSelection(simulation.id, checked as boolean)
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <label 
                              htmlFor={`comparison-${simulation.id}`}
                              className="text-sm font-medium cursor-pointer truncate"
                            >
                              {simulation.name}
                            </label>
                            <Badge variant="secondary" className="text-xs">
                              #{simulation.simulationNumber}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {calculateNumCars(simulation)} cars, {simulation.params.numLanes} lanes
                            </span>
                            <div className="flex gap-1">
                              <EditSimulationNameDialog
                                currentName={simulation.name}
                                onSave={(newName) => updateSimulationName(simulation.id, newName)}
                                trigger={
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <Edit2 size={12} />
                                  </Button>
                                }
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                onClick={() => deleteSimulation(simulation.id)}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Comparison Charts */}
              {selectedForComparison.size > 0 ? (
                <div className="grid gap-6">
                  <OverlayThroughputDensityChart 
                    selectedSimulations={getSelectedSimulations()}
                  />
                  <OverlaySpeedChart
                    selectedSimulations={getSelectedSimulations()}
                  />
                  <OverlayDensityChart
                    selectedSimulations={getSelectedSimulations()}
                  />
                  <OverlayLaneUsageChart
                    selectedSimulations={getSelectedSimulations()}
                  />
                  <OverlayPackFormationChart
                    selectedSimulations={getSelectedSimulations()}
                  />
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-64">
                    <div className="text-center">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Simulations Selected</h3>
                      <p className="text-gray-500 mb-4">Select at least one simulation to view comparison charts.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default SavedSimulations;
