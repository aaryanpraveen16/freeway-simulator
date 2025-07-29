const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class SimulationRunner {
  constructor(config) {
    this.config = config;
    this.results = [];
    this.metrics = [];
  }

  /**
   * Run a single simulation with the given parameters
   * @param {Object} params - Simulation parameters
   * @returns {Promise<Object>} - Simulation results
   */
  async runSimulation(params) {
    try {
      // Merge base config with parameters
      const simConfig = {
        ...this.config.simulation,
        ...params,
        output: path.join(this.config.output.dataDir, `sim_${Date.now()}.json`)
      };

      // Prepare command line arguments
      const args = [];
      Object.entries(simConfig).forEach(([key, value]) => {
        if (value !== undefined) {
          args.push(`--${key}=${value}`);
        }
      });

      // Execute simulation
      console.log(`\n--- Running simulation with params: ${JSON.stringify(params)}`);
      const command = `node ${path.join(__dirname, '../../src/index.js')} ${args.join(' ')}`;
      execSync(command, { stdio: 'inherit' });

      // Read and process results
      if (fs.existsSync(simConfig.output)) {
        const result = JSON.parse(fs.readFileSync(simConfig.output, 'utf8'));
        this.results.push({ params, result });
        return result;
      }

      throw new Error('Simulation did not produce output file');
    } catch (error) {
      console.error('Simulation error:', error);
      throw error;
    }
  }

  /**
   * Run multiple replications of a simulation with the same parameters
   * @param {Object} params - Base simulation parameters
   * @param {number} replications - Number of replications to run
   * @returns {Promise<Object>} - Aggregated results
   */
  async runReplications(params, replications = 1) {
    const results = [];
    
    for (let i = 0; i < replications; i++) {
      // Ensure unique seed for each replication
      const runParams = {
        ...params,
        seed: (params.seed || 42) + i
      };
      
      const result = await this.runSimulation(runParams);
      results.push(result);
      
      // Save intermediate results after each replication
      this.saveIntermediateResults();
    }
    
    return this.aggregateResults(results);
  }

  /**
   * Aggregate results from multiple replications
   * @param {Array} results - Array of simulation results
   * @returns {Object} - Aggregated statistics
   */
  aggregateResults(results) {
    if (results.length === 0) return {};
    
    const metrics = {};
    const sample = results[0].metrics;
    
    // Initialize metrics structure
    Object.keys(sample).forEach(metric => {
      const values = results.map(r => r.metrics[metric]);
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      
      metrics[metric] = {
        mean,
        std: Math.sqrt(variance),
        min: Math.min(...values),
        max: Math.max(...values),
        values
      };
    });
    
    return {
      params: results[0].params,
      metrics,
      timestamp: new Date().toISOString(),
      numReplications: results.length
    };
  }

  /**
   * Save intermediate results to a file
   */
  saveIntermediateResults() {
    if (this.results.length === 0) return;
    
    const outputFile = path.join(this.config.output.dataDir, 'intermediate_results.json');
    fs.writeFileSync(outputFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      results: this.results
    }, null, 2));
    
    console.log(`Intermediate results saved to ${outputFile}`);
  }

  /**
   * Save final results to a CSV file
   * @param {string} outputPath - Path to save the CSV file
   */
  saveResultsToCSV(outputPath) {
    if (this.results.length === 0) return;
    
    // Get all unique metric names
    const metrics = new Set();
    this.results.forEach(r => {
      Object.keys(r.result.metrics).forEach(m => metrics.add(m));
    });
    
    // Create CSV header
    const header = ['run_id', 'timestamp', ...Object.keys(this.results[0].params), ...metrics];
    
    // Create CSV rows
    const rows = this.results.map((r, i) => {
      const row = [
        i + 1,
        new Date().toISOString(),
        ...Object.values(r.params),
        ...Array.from(metrics).map(m => r.result.metrics[m] || '')
      ];
      return row.join(',');
    });
    
    // Write to file
    const csvContent = [header.join(','), ...rows].join('\n');
    fs.writeFileSync(outputPath, csvContent);
    
    console.log(`Results saved to ${outputPath}`);
  }
}

module.exports = SimulationRunner;
