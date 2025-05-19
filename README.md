# Freeway Traffic Simulation

A real-time traffic simulation that demonstrates how traffic jams can emerge from the dynamics of car following behavior in a closed-loop freeway system. This project implements the MOBIL (Minimizing Overall Braking Induced by Lane changes) framework for lane-changing behavior and uses a car-following model to simulate realistic traffic flow.

## Features

- **Real-time Traffic Simulation**: Watch as cars navigate a circular or straight freeway track
- **Multiple Lanes**: Simulate traffic flow across multiple lanes with lane-changing behavior
- **MOBIL Framework**: Implements the MOBIL model for intelligent lane-changing decisions
- **Dynamic Car Behavior**:
  - Different driver types (aggressive, normal, passive)
  - Variable lane change probabilities
  - Speed adjustments based on car following
  - Safe distance maintenance
- **Visual Analytics**:
  - Pack formation visualization
  - Average pack length tracking
  - Pack density analysis
  - Individual car statistics
- **Interactive Controls**:
  - Adjust number of cars and lanes
  - Modify freeway length
  - Change mean trip distances
  - Set speed limits and time headways
  - Apply predefined traffic presets

## Technical Details

### Car Following Model
- Physical car length: 15 feet
- Safe following distance calculated using time headway
- Speed adjustments based on car following behavior
- Virtual length includes physical length plus safe distance

### MOBIL Parameters
- Politeness factor for lane changes
- Acceleration threshold for lane change decisions
- Lane change cooldown period
- Right lane bias preference

### Driver Behavior
- Three driver types with different characteristics:
  - Aggressive: Higher lane change probability, lower lane stickiness
  - Normal: Balanced lane change behavior
  - Passive: Lower lane change probability, higher lane stickiness

## Installation

1. **Prerequisites**
   - Node.js (v16 or higher)
   - npm or yarn package manager

2. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/looping-lane-simulator.git
   cd looping-lane-simulator
   ```

3. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   # or
   yarn build
   ```

## Usage

1. **Starting the Simulation**
   - Click the "Start" button to begin the simulation
   - Use the "Pause" button to pause/resume the simulation
   - Click "Reset" to restart with current parameters

2. **Adjusting Parameters**
   - Use the control panel to modify simulation parameters
   - Apply predefined traffic presets for quick setup
   - Adjust freeway length and number of lanes
   - Modify car behavior parameters

3. **Viewing Analytics**
   - Monitor pack formation in real-time
   - Track average pack lengths
   - Analyze pack density
   - View individual car statistics

## Project Structure

```
src/
├── components/         # React components
├── utils/             # Simulation logic and utilities
├── pages/             # Page components
├── lib/               # Utility functions
├── hooks/             # Custom React hooks
└── App.tsx           # Main application component
```

## Dependencies

- React
- TypeScript
- Tailwind CSS
- Lucide Icons
- Radix UI Components

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- MOBIL framework for lane-changing behavior
- Car-following models for traffic simulation
- Traffic flow theory and research
