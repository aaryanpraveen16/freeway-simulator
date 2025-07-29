const fs = require('fs');
const path = require('path');
const SimulationRunner = require('./simulationRunner');

class ExperimentRunner {
  constructor(experimentConfig) {
    this.config = experimentConfig;
    this.runner = new SimulationRunner(experimentConfig);
    this.results = [];
    
    // Ensure output directories exist
    this.ensureDirectoryExists(this.config.output.dataDir);
    this.ensureDirectoryExists(this.config.output.resultsDir);
  }

  /**
   * Ensure a directory exists, create it if it doesn't
   * @param {string} dirPath - Directory path
   */
  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Generate parameter combinations for the experiment
   * @returns {Array} - Array of parameter combinations
   */
  generateParameterCombinations() {
    const combinations = [];
    const { parameters } = this.config.experiment;
    
    // Simple cartesian product of all parameter values
    const keys = Object.keys(parameters);
    const values = keys.map(key => parameters[key]);
    
    function* cartesian(head, ...tail) {
      const remainder = tail.length > 0 ? cartesian(...tail) : [[]];
      for (const r of remainder) {
        for (const h of head) {
          yield [h, ...r];
        }
      }
    }
    
    for (const combination of cartesian(...values)) {
      const params = {};
      combination.forEach((value, index) => {
        params[keys[index]] = value;
      });
      combinations.push(params);
    }
    
    return combinations;
  }

  /**
   * Run the experiment with all parameter combinations
   * @returns {Promise<Array>} - Array of results for each parameter combination
   */
  async run() {
    const parameterCombinations = this.generateParameterCombinations();
    const results = [];
    
    console.log(`\n=== Starting Experiment: ${this.config.experiment.name} ===`);
    console.log(`Total parameter combinations: ${parameterCombinations.length}`);
    console.log(`Replications per combination: ${this.config.experiment.replications}`);
    
    for (let i = 0; i < parameterCombinations.length; i++) {
      const params = parameterCombinations[i];
      console.log(`\n--- Running parameter set ${i + 1}/${parameterCombinations.length} ---`);
      console.log('Parameters:', JSON.stringify(params, null, 2));
      
      const result = await this.runner.runReplications(
        params,
        this.config.experiment.replications
      );
      
      results.push(result);
      
      // Save intermediate results
      this.saveResults(results, 'intermediate_results.json');
    }
    
    // Save final results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(
      this.config.output.resultsDir,
      `${this.config.experiment.name}_${timestamp}.json`
    );
    
    this.saveResults(results, outputFile);
    this.runner.saveResultsToCSV(outputFile.replace('.json', '.csv'));
    
    console.log(`\n=== Experiment completed ===`);
    console.log(`Results saved to: ${outputFile}`);
    
    return results;
  }

  /**
   * Save results to a JSON file
   * @param {Array} results - Results to save
   * @param {string} filename - Output filename
   */
  saveResults(results, filename) {
    const outputPath = path.join(this.config.output.resultsDir, filename);
    fs.writeFileSync(
      outputPath,
      JSON.stringify({
        experiment: this.config.experiment,
        timestamp: new Date().toISOString(),
        results
      }, null, 2)
    );
  }
}

module.exports = ExperimentRunner;
