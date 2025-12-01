# Driver Reaction Time - Quick Reference

## Why doesn't my stopwatch match the UI setting?

**Answer**: The reaction time is in **simulation time**, not real-world time!

## Quick Formula

```
Real-World Time = Reaction Time Setting / Simulation Speed
```

## Common Scenarios

| Reaction Time | Sim Speed | Real-World Time |
|---------------|-----------|-----------------|
| 2.0 seconds   | 1x        | 2.0 seconds ✓   |
| 2.0 seconds   | 2x        | 1.0 seconds     |
| 2.0 seconds   | 3x        | 0.67 seconds    |
| 2.0 seconds   | 0.5x      | 4.0 seconds     |
| 5.0 seconds   | 1x        | 5.0 seconds ✓   |
| 5.0 seconds   | 2x        | 2.5 seconds     |

## How to Test Accurately

### Method 1: Use Simulation Time (Best)
1. Look at the simulation time display in the UI
2. Note the time when lead car starts moving
3. Note the time when following car starts moving
4. Difference = Your reaction time setting ✓

### Method 2: Use Stopwatch at 1x Speed
1. Set simulation speed to **1x** (normal speed)
2. Use stopwatch to measure real-world time
3. Should match your reaction time setting ✓

### Method 3: Use Console Logs
1. Open browser console (F12)
2. Look for `[REACTION START]` message
3. It shows both simulation time AND real-world time
4. Example: `starting 2.0s simulation delay (1.00s real-world at 2.0x speed)`

## Where is Simulation Speed?

Look for the simulation speed control in your UI - it's usually a slider or dropdown that says:
- "1x" (normal speed)
- "2x" (double speed)
- "0.5x" (half speed)
- etc.

## Why is it designed this way?

The reaction time is part of the **simulation physics**, so it needs to be in simulation time to work correctly with all the other physics calculations (acceleration, braking, distances, etc.). 

If we used real-world time, the behavior would change depending on simulation speed, which would make the simulation inconsistent and unpredictable.

## Bottom Line

✅ **Correct**: Measure using simulation time display
✅ **Correct**: Measure with stopwatch at 1x speed
❌ **Incorrect**: Measure with stopwatch at 2x speed and expect 2 seconds
