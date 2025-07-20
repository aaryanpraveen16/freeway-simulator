import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { SimulationParams } from "@/utils/trafficSimulation";

interface JsonImportExportProps {
  onImport: (params: Partial<SimulationParams>) => void;
  currentParams: SimulationParams;
}

export const JsonImportExport: React.FC<JsonImportExportProps> = ({ onImport, currentParams }) => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleImport = () => {
    console.log('Starting import with input:', jsonInput);
    
    // Check if input is empty
    if (!jsonInput.trim()) {
      toast({
        title: "Error",
        description: "No JSON data provided",
        variant: "destructive",
      });
      return;
    }

    // Check if input is a URL (starts with http)
    if (jsonInput.trim().toLowerCase().startsWith('http')) {
      toast({
        title: "Error",
        description: "Please paste the actual JSON content, not a URL",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsImporting(true);
      
      // Try to parse the JSON
      let parsedParams;
      try {
        parsedParams = JSON.parse(jsonInput);
        // If the parsed JSON has a 'params' property, use that instead
        if (parsedParams.params && typeof parsedParams.params === 'object') {
          parsedParams = parsedParams.params;
        }
      } catch (parseError) {
        throw new Error('Invalid JSON format. Please check your input.');
      }
      
      console.log('Parsed JSON:', parsedParams);
      
      // Basic validation
      if (typeof parsedParams !== 'object' || parsedParams === null) {
        throw new Error('Invalid JSON format: Expected an object');
      }
      
      // Create a new object with only the valid parameters from the imported JSON
      const validParams: Partial<SimulationParams> = {};
      
      // List of valid parameter names from SimulationParams
      const validParamNames = [
        'numLanes', 'trafficDensity', 'meanSpeed', 'speedLimit', 'freewayLength',
        'tDist', 'meanDistTripPlanned', 'vehicleTypeDensity', 'laneChangeProbability',
        'laneChangeCooldown', 'laneChangeThreshold', 'laneChangeMinImprovement',
        'randomSlowdownProbability', 'randomSlowdownAmount', 'randomSlowdownDuration',
        'timeStep', 'simulationSpeed', 'maxSpeed', 'minGap', 'carLength',
        'truckLength', 'motorcycleLength', 'truckPercentage', 'motorcyclePercentage',
        'carPercentage', 'dt', 'aMax', 'k', 'lengthCar', 'initialGap',
        'brakeTime', 'brakeCarIndex', 'minSpeed', 'stdSpeed', 'sigmaDistTripPlanned',
        'politenessFactor', 'rightLaneBias', 'accelerationThreshold'
      ];
      
      console.log('Current params before import:', currentParams);
      
      // Only copy over valid parameters
      Object.entries(parsedParams).forEach(([key, value]) => {
        // Check if the key is in our valid parameters list
        if (validParamNames.includes(key)) {
          console.log(`Importing ${key}:`, value);
          // @ts-ignore - We know the key is valid
          validParams[key] = value;
        }
      });
      
      // Special handling for nested objects like vehicleTypeDensity
      if (parsedParams.vehicleTypeDensity && typeof parsedParams.vehicleTypeDensity === 'object') {
        console.log('Processing vehicleTypeDensity:', parsedParams.vehicleTypeDensity);
        validParams.vehicleTypeDensity = { ...currentParams.vehicleTypeDensity };
        
        Object.entries(parsedParams.vehicleTypeDensity).forEach(([type, value]) => {
          if (['car', 'truck', 'motorcycle'].includes(type) && typeof value === 'number') {
            console.log(`Setting vehicle type ${type} density to:`, value);
            // @ts-ignore - We know the type is valid
            validParams.vehicleTypeDensity[type] = value;
          }
        });
      }
      
      console.log('Final params to import:', validParams);
      onImport(validParams);
      console.log('Import complete, showing success toast');
      
      toast({
        title: "Success",
        description: "Settings imported successfully!",
        variant: "default",
      });
      setJsonInput('');
    } catch (error) {
      console.error('Error importing settings:', error);
      toast({
        title: "Error",
        description: `Failed to import settings: ${error instanceof Error ? error.message : 'Invalid JSON'}`,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = () => {
    try {
      setIsExporting(true);
      // Create a clean copy of current params without functions or circular references
      const { onUpdate, ...exportableParams } = currentParams as any;
      const jsonString = JSON.stringify(exportableParams, null, 2);
      
      // Copy to clipboard
      navigator.clipboard.writeText(jsonString);
      
      toast({
        title: "Success",
        description: "Settings copied to clipboard!",
        variant: "default",
      });
    } catch (error) {
      console.error('Error exporting settings:', error);
      toast({
        title: "Error",
        description: "Failed to export settings",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-medium">Import/Export Settings</h3>
      
      <div className="space-y-2">
        <Label htmlFor="json-input">Paste JSON Configuration</Label>
        <Textarea
          id="json-input"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Paste your JSON configuration here..."
          className="min-h-[100px] font-mono text-sm"
        />
      </div>

      <div className="flex gap-2">
        <Button 
          onClick={handleImport} 
          disabled={!jsonInput.trim() || isImporting}
          variant="outline"
        >
          {isImporting ? 'Importing...' : 'Import Settings'}
        </Button>
        
        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          variant="outline"
        >
          {isExporting ? 'Copying...' : 'Export to Clipboard'}
        </Button>
      </div>
    </div>
  );
};
