# Timing Diagnostic Guide

## How to Check if Reaction Time is Accurate

### Step 1: Open Console
Press F12 and go to Console tab

### Step 2: Set Up Test
1. Set **Simulation Speed** to **1x**
2. Set **Reaction Time** to **0.5 seconds**
3. Set up 2 cars in 1 lane
4. Stop the lead car, wait for following car to stop
5. Release the lead car

### Step 3: Read the Console Logs

You should see messages like this:

```
[REACTION START] Car 0 at t=10.234s: Leader speed 0.0 -> 5.4 km/h. 
                 Delay: 0.500s (0.500s real-world at 1x). 
                 Will end at t=10.734s

[REACTION END] Car 0 at t=10.735s: Delay complete! 
               Actual delay: 0.501s simulation (0.501s real-world at 1x). 
               Now accelerating: 0.0 -> 90.0 km/h
```

### Step 4: Calculate Actual Delay

**From the logs above:**
- Start time: `t=10.234s`
- End time: `t=10.735s`
- **Actual delay: 10.735 - 10.234 = 0.501 seconds**

The logs also show "Actual delay: 0.501s" directly.

### Expected Results

| Setting | At 1x Speed | Tolerance |
|---------|-------------|-----------|
| 0.5s    | ~0.50s      | ±0.02s    |
| 1.0s    | ~1.00s      | ±0.02s    |
| 2.0s    | ~2.00s      | ±0.02s    |
| 5.0s    | ~5.00s      | ±0.02s    |

**Note**: There may be a small error (±0.02s) due to frame timing. This is normal and expected.

### Why Small Errors Occur

The simulation runs at your browser's refresh rate (usually 60 FPS = 16.67ms per frame).

**Example:**
- You set 0.5s delay
- Delay should end at t=10.734s
- But the next frame happens at t=10.751s (17ms later)
- So the car starts accelerating at t=10.751s
- **Actual delay: 0.517s** (17ms error)

This is **normal** and unavoidable with frame-based timing.

### If Delay is Way Off

If you see something like:
- Setting: 0.5s
- Actual: 1.5s or 0.1s

Then there's a bug. Please share:
1. The exact console logs
2. Your simulation speed setting
3. Your reaction time setting
4. Any other relevant parameters

### Common Issues

**Issue**: "I measured 1.0s with stopwatch but setting is 0.5s"
- **Check**: Is simulation speed at 2x? (0.5s ÷ 2 = 0.25s real-world, not 1.0s)
- **Solution**: Verify simulation speed is 1x

**Issue**: "Delay seems random"
- **Check**: Are multiple cars changing lanes or interacting?
- **Solution**: Test with just 2 cars in 1 lane for clearest results

**Issue**: "No console logs appear"
- **Check**: Logs only show for Car 0 (first car)
- **Solution**: Make sure Car 0 is the one following another car

### Frame Timing Math

At 60 FPS:
- Frame interval: 16.67ms
- Maximum timing error: ±16.67ms (±0.017s)

At 30 FPS:
- Frame interval: 33.33ms  
- Maximum timing error: ±33.33ms (±0.033s)

This is why you might see:
- 0.5s setting → 0.483s to 0.517s actual (±17ms)
- 2.0s setting → 1.983s to 2.017s actual (±17ms)

**This is normal and acceptable!**
