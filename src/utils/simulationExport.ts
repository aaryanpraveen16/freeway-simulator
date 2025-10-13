import { SavedSimulation } from "@/services/indexedDBService";

export const exportSimulation = (simulation: SavedSimulation) => {
  const dataStr = JSON.stringify(simulation, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportName = `simulation_${simulation.name || simulation.id}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportName);
  linkElement.click();
};

export const importSimulation = async (file: File): Promise<SavedSimulation> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    
    fileReader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const simulation = JSON.parse(content) as SavedSimulation;
        
        // Basic validation
        if (!simulation.id || !simulation.chartData) {
          throw new Error('Invalid simulation file format');
        }
        
        // Add timestamp if missing
        if (!simulation.timestamp) {
          simulation.timestamp = Date.now();
        }
        
        resolve(simulation);
      } catch (error) {
        reject(new Error('Failed to parse simulation file'));
      }
    };
    
    fileReader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    fileReader.readAsText(file);
  });
};

// Helper function to trigger file input click
export const triggerFileInput = (onFileSelected: (file: File) => void) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };
  
  input.click();
};
