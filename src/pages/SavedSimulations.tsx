
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Eye, Calendar, Clock, Users, Gauge, BarChart3 } from "lucide-react";
import { indexedDBService, SavedSimulation } from "@/services/indexedDBService";
import { useToast } from "@/hooks/use-toast";
import ChartDashboard from "@/components/ChartDashboard";
import { Link } from "react-router-dom";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

const SavedSimulations: React.FC = () => {
  const [savedSimulations, setSavedSimulations] = useState<SavedSimulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSimulation, setSelectedSimulation] = useState<SavedSimulation | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSimulations();
  }, []);

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

  const generateComparisonData = (chartType: 'speed' | 'density' | 'percentage') => {
    if (savedSimulations.length === 0) return [];

    const allTimePoints = new Set<number>();
    savedSimulations.forEach(sim => {
      const history = chartType === 'speed' ? sim.chartData.speedByLaneHistory :
                    chartType === 'density' ? sim.chartData.densityOfCarPacksHistory :
                    sim.chartData.percentageByLaneHistory;
      history.forEach((point: any) => allTimePoints.add(point.time));
    });

    const sortedTimePoints = Array.from(allTimePoints).sort((a, b) => a - b);
    
    return sortedTimePoints.map(time => {
      const dataPoint: any = { time };
      
      savedSimulations.forEach(sim => {
        const history = chartType === 'speed' ? sim.chartData.speedByLaneHistory :
                       chartType === 'density' ? sim.chartData.densityOfCarPacksHistory :
                       sim.chartData.percentageByLaneHistory;
        
        const point = history.find((p: any) => p.time === time);
        if (point) {
          if (chartType === 'speed') {
            dataPoint[`sim${sim.simulationNumber}_overall`] = point.overallAvgSpeed;
          } else if (chartType === 'density') {
            dataPoint[`sim${sim.simulationNumber}_density`] = point.density;
          } else {
            // For percentage, we'll show lane 0 as an example
            dataPoint[`sim${sim.simulationNumber}_lane0`] = point.lane0;
          }
        }
      });
      
      return dataPoint;
    }).filter(point => Object.keys(point).length > 1); // Filter out points with only time
  };

  const getSimulationColors = () => {
    const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5a3c', '#6b7280'];
    return savedSimulations.reduce((acc, sim, index) => {
      acc[sim.simulationNumber] = colors[index % colors.length];
      return acc;
    }, {} as Record<number, string>);
  };

  const renderComparisonChart = (chartType: 'speed' | 'density' | 'percentage', title: string, yLabel: string) => {
    const data = generateComparisonData(chartType);
    const colors = getSimulationColors();

    if (data.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available for comparison
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Comparison across all {savedSimulations.length} saved simulations
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ChartContainer
              className="h-full"
              config={Object.fromEntries(
                savedSimulations.map(sim => [
                  chartType === 'speed' ? `sim${sim.simulationNumber}_overall` :
                  chartType === 'density' ? `sim${sim.simulationNumber}_density` :
                  `sim${sim.simulationNumber}_lane0`,
                  {
                    label: `Simulation #${sim.simulationNumber}`,
                    color: colors[sim.simulationNumber]
                  }
                ])
              )}
            >
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time"
                  label={{ value: "Time (seconds)", position: "insideBottom", offset: -5 }}
                />
                <YAxis
                  label={{ value: yLabel, angle: -90, position: "insideLeft" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                
                {savedSimulations.map(sim => (
                  <Line
                    key={sim.id}
                    dataKey={
                      chartType === 'speed' ? `sim${sim.simulationNumber}_overall` :
                      chartType === 'density' ? `sim${sim.simulationNumber}_density` :
                      `sim${sim.simulationNumber}_lane0`
                    }
                    stroke={colors[sim.simulationNumber]}
                    strokeWidth={2}
                    dot={false}
                    name={`Sim #${sim.simulationNumber}`}
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
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span>{simulation.name}</span>
                          <Badge variant="secondary">#{simulation.simulationNumber}</Badge>
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
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
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
                                speedByLaneHistory={simulation.chartData.speedByLaneHistory}
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
                          onClick={() => deleteSimulation(simulation.id)}
                          className="text-red-600 hover:text-red-700"
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
                  Compare performance metrics across all {savedSimulations.length} saved simulations
                </p>
              </div>
              
              <div className="grid gap-6">
                {renderComparisonChart('speed', 'Speed Comparison Across All Simulations', 'Speed (mph)')}
                {renderComparisonChart('density', 'Traffic Density Comparison', 'Density (cars/km)')}
                {renderComparisonChart('percentage', 'Lane 1 Usage Comparison', 'Percentage (%)')}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default SavedSimulations;
