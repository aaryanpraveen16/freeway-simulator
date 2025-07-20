import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart3, Calendar, CheckSquare, Clock, Copy, Edit2, Eye, Gauge, Repeat, Square, Trash2, Users } from "lucide-react";
import { indexedDBService, SavedSimulation } from "@/services/indexedDBService";
import { useToast } from "@/hooks/use-toast";
import { extractSimulationParams, formatParamsAsJson } from "../utils/simulationUtils";
import ChartDashboard from "@/components/ChartDashboard";
import EditSimulationNameDialog from "@/components/EditSimulationNameDialog";
import { Link } from "react-router-dom";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

const SavedSimulations: React.FC = () => {
  const [savedSimulations, setSavedSimulations] = useState<SavedSimulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSimulation, setSelectedSimulation] = useState<SavedSimulation | null>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadSimulations();
  }, []);

  const copySimulationParams = async (simulation: SavedSimulation) => {
    try {
      const params = extractSimulationParams(simulation);
      const jsonString = formatParamsAsJson(params);
      await navigator.clipboard.writeText(jsonString);
      
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
    let totalCars = 0;
    
    for (let lane = 0; lane < numLanes; lane++) {
      const densityForLane = simulation.params.trafficDensity[lane] || simulation.params.trafficDensity[0] || 3;
      totalCars += Math.round(densityForLane * freewayLength);
    }
    
    return totalCars;
  };

  const generateOverlappedComparisonData = () => {
    if (savedSimulations.length === 0 || selectedForComparison.size === 0) return { speed: [], density: [], percentage: [] };

    // Filter simulations based on selection
    const selectedSimulations = savedSimulations.filter(sim => selectedForComparison.has(sim.id));

    // Get all unique time points across selected simulations
    const allTimePoints = new Set<number>();
    selectedSimulations.forEach(sim => {
      sim.chartData.speedByLaneHistory.forEach(point => allTimePoints.add(point.time));
      sim.chartData.densityOfCarPacksHistory.forEach(point => allTimePoints.add(point.time));
      sim.chartData.percentageByLaneHistory.forEach(point => allTimePoints.add(point.time));
    });

    const sortedTimePoints = Array.from(allTimePoints).sort((a, b) => a - b);
    
    // Generate speed comparison data
    const speedData = sortedTimePoints.map(time => {
      const dataPoint: any = { time };
      
      selectedSimulations.forEach(sim => {
        const speedPoint = sim.chartData.speedByLaneHistory.find(p => p.time === time);
        if (speedPoint) {
          dataPoint[`sim${sim.simulationNumber}_overall`] = speedPoint.overallAvgSpeed;
          
          // Add individual lane data for more detailed comparison
          for (let i = 0; i < (sim.params.numLanes || 2); i++) {
            if (speedPoint[`lane${i}`] !== undefined) {
              dataPoint[`sim${sim.simulationNumber}_lane${i}`] = speedPoint[`lane${i}`];
            }
          }
        }
      });
      
      return dataPoint;
    }).filter(point => Object.keys(point).length > 1);

      // Generate density comparison data
    const densityData = sortedTimePoints.map(time => {
      const dataPoint: any = { time };
      
      selectedSimulations.forEach(sim => {
        const densityPoint = sim.chartData.densityOfCarPacksHistory.find(p => p.time === time);
        if (densityPoint) {
          dataPoint[`sim${sim.simulationNumber}_density`] = densityPoint.density;
        }
      });
      
      return dataPoint;
    }).filter(point => Object.keys(point).length > 1);

    // Generate percentage comparison data
    const percentageData = sortedTimePoints.map(time => {
      const dataPoint: any = { time };
      
      selectedSimulations.forEach(sim => {
        const percentagePoint = sim.chartData.percentageByLaneHistory.find(p => p.time === time);
        if (percentagePoint) {
          // Add all lanes for each simulation
          for (let i = 0; i < (sim.params.numLanes || 2); i++) {
            if (percentagePoint[`lane${i}`] !== undefined) {
              dataPoint[`sim${sim.simulationNumber}_lane${i}`] = percentagePoint[`lane${i}`];
            }
          }
        }
      });
      
      return dataPoint;
    }).filter(point => Object.keys(point).length > 1);

    return { speed: speedData, density: densityData, percentage: percentageData };
  };

  const getSimulationColors = () => {
    const colors = [
      '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', 
      '#8b5a3c', '#6b7280', '#14b8a6', '#f97316', '#a855f7', '#84cc16'
    ];
    const selectedSimulations = savedSimulations.filter(sim => selectedForComparison.has(sim.id));
    return selectedSimulations.reduce((acc, sim, index) => {
      acc[sim.simulationNumber] = colors[index % colors.length];
      return acc;
    }, {} as Record<number, string>);
  };

  const renderOverlappedSpeedChart = () => {
    const { speed: data } = generateOverlappedComparisonData();
    const colors = getSimulationColors();

    if (data.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Speed Comparison - All Simulations Overlapped</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available for comparison
            </div>
          </CardContent>
        </Card>
      );
    }

    // Create chart config properly
    const chartConfig: Record<string, any> = {};
    const selectedSimulations = savedSimulations.filter(sim => selectedForComparison.has(sim.id));
    selectedSimulations.forEach(sim => {
      const key = `sim${sim.simulationNumber}_overall`;
      chartConfig[key] = {
        label: `Simulation #${sim.simulationNumber}`,
        color: colors[sim.simulationNumber]
      };
    });

    return (
      <Card>
        <CardHeader>
          <CardTitle>Speed Comparison - All Simulations Overlapped</CardTitle>
          <p className="text-sm text-muted-foreground">
            Overall average speed across {selectedForComparison.size} selected simulations
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[500px]">
            <ChartContainer
              className="h-full"
              config={chartConfig}
            >
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="time"
                  label={{ value: "Time (seconds)", position: "insideBottom", offset: -5 }}
                />
                <YAxis
                  label={{ value: "Speed (mph)", angle: -90, position: "insideLeft" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                
                {selectedSimulations.map(sim => (
                  <Line
                    key={`sim${sim.simulationNumber}_overall`}
                    dataKey={`sim${sim.simulationNumber}_overall`}
                    stroke={colors[sim.simulationNumber]}
                    strokeWidth={3}
                    dot={false}
                    name={`Sim #${sim.simulationNumber} (${sim.name})`}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderOverlappedDensityChart = () => {
    const { density: data } = generateOverlappedComparisonData();
    const colors = getSimulationColors();

    if (data.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Traffic Density Comparison - All Simulations Overlapped</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available for comparison
            </div>
          </CardContent>
        </Card>
      );
    }

    // Create chart config properly
    const chartConfig: Record<string, any> = {};
    const selectedSimulations = savedSimulations.filter(sim => selectedForComparison.has(sim.id));
    selectedSimulations.forEach(sim => {
      const key = `sim${sim.simulationNumber}_density`;
      chartConfig[key] = {
        label: `Simulation #${sim.simulationNumber}`,
        color: colors[sim.simulationNumber]
      };
    });

    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Density Comparison - All Simulations Overlapped</CardTitle>
          <p className="text-sm text-muted-foreground">
            Car pack density across {selectedForComparison.size} selected simulations
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[500px]">
            <ChartContainer
              className="h-full"
              config={chartConfig}
            >
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="time"
                  label={{ value: "Time (seconds)", position: "insideBottom", offset: -5 }}
                />
                <YAxis
                  label={{ value: "Density (cars/km)", angle: -90, position: "insideLeft" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                
                {selectedSimulations.map(sim => (
                  <Line
                    key={`sim${sim.simulationNumber}_density`}
                    dataKey={`sim${sim.simulationNumber}_density`}
                    stroke={colors[sim.simulationNumber]}
                    strokeWidth={3}
                    dot={false}
                    name={`Sim #${sim.simulationNumber} (${sim.name})`}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderOverlappedPercentageChart = () => {
    const { percentage: data } = generateOverlappedComparisonData();
    const colors = getSimulationColors();

    if (data.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Lane Usage Comparison - All Simulations Overlapped</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available for comparison
            </div>
          </CardContent>
        </Card>
      );
    }

    // Create chart config properly
    const chartConfig: Record<string, any> = {};
    const selectedSimulations = savedSimulations.filter(sim => selectedForComparison.has(sim.id));
    selectedSimulations.forEach(sim => {
      for (let i = 0; i < (sim.params.numLanes || 2); i++) {
        const key = `sim${sim.simulationNumber}_lane${i}`;
        chartConfig[key] = {
          label: `Sim #${sim.simulationNumber} Lane ${i + 1}`,
          color: colors[sim.simulationNumber]
        };
      }
    });

    return (
      <Card>
        <CardHeader>
          <CardTitle>Lane Usage Comparison - All Simulations Overlapped</CardTitle>
          <p className="text-sm text-muted-foreground">
            Lane 1 usage percentage across {selectedForComparison.size} selected simulations
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[500px]">
            <ChartContainer
              className="h-full"
              config={chartConfig}
            >
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="time"
                  label={{ value: "Time (seconds)", position: "insideBottom", offset: -5 }}
                />
                <YAxis
                  label={{ value: "Percentage (%)", angle: -90, position: "insideLeft" }}
                  domain={[0, 100]}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                
                {selectedSimulations.map(sim => (
                  <Line
                    key={`sim${sim.simulationNumber}_lane0`}
                    dataKey={`sim${sim.simulationNumber}_lane0`}
                    stroke={colors[sim.simulationNumber]}
                    strokeWidth={3}
                    dot={false}
                    name={`Sim #${sim.simulationNumber} Lane 1 (${sim.name})`}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    );
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
        <Link to="/freeway-simulator">
          <Button variant="outline">Back to Simulator</Button>
        </Link>
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
                        <span>{simulation.finalStats.averageSpeed.toFixed(1)} mph avg</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-purple-500" />
                        <span>{formatDuration(simulation.duration)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Repeat size={16} className="text-amber-500" />
                        <span>{simulation.finalStats.laneChanges} lane changes</span>
                      </div>
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
                          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                {simulation.name} - Simulation #{simulation.simulationNumber}
                              </DialogTitle>
                            </DialogHeader>
                            {selectedSimulation && (
                              <ChartDashboard
                                cars={[]}
                                elapsedTime={simulation.duration}
                                laneLength={1000}
                                params={simulation.params}
                                trafficRule={simulation.trafficRule}
                                speedDensityHistory={simulation.chartData.speedByLaneHistory}
                                densityOfCarPacksHistory={simulation.chartData.densityOfCarPacksHistory}
                                percentageByLaneHistory={simulation.chartData.percentageByLaneHistory}
                                densityThroughputHistory={simulation.chartData.densityThroughputHistory}
                                laneUtilizationHistory={[]}
                                packHistory={simulation.chartData.packHistory}
                                packLengthHistory={simulation.chartData.packLengthHistory}
                                showPackFormation={true}
                              />
                            )}
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
                  {renderOverlappedSpeedChart()}
                  {renderOverlappedDensityChart()}
                  {renderOverlappedPercentageChart()}
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
