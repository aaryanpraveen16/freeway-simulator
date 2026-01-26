import json
import numpy as np
import matplotlib.pyplot as plt
import mplcursors
from collections import defaultdict

# ============================================================
# CONFIG
# ============================================================
JSON_FILE = "traffic-simulator.simulations.json"

# ============================================================
# LOAD JSON
# ============================================================
with open(JSON_FILE, "r") as f:
    data = json.load(f)

# ============================================================
# HELPERS
# ============================================================
def mean_std(arr):
    arr = np.array(arr, dtype=float)
    if len(arr) == 0:
        return np.nan, np.nan, np.nan
    mean = arr.mean()
    std = arr.std()
    return mean, mean - std, mean + std

# ============================================================
# PARAMETER TEXT
# ============================================================
PARAMETER_MAP = [
    ("numLanes", "No. of lanes", ""),
    ("meanSpeed", "Desired speed", "km/hr"),
    ("minSpeed", "Min speed", "km/hr"),
    ("maxSpeed", "Max speed", "km/hr"),
    ("freewayLength", "Freeway length", "km"),
    ("aMax", "Max Deceleration", "m/s²"),
    ("tDist", "Time Headway", "s"),
    ("stdSpeed", "Desired Speed Std Deviation", "km/hr"),
    ("speedLimit", "Speed Limit", "km/hr"),
    ("meanDistTripPlanned", "Mean Trip Distance", "km"),
]

def build_parameter_text(params):
    lines = ["Parameters:"]
    for key, label, unit in PARAMETER_MAP:
        value = params.get(key, "N/A")
        lines.append(f"{label} - {value} {unit}".rstrip())
    return "\n".join(lines)

# ============================================================
# COLLECT PARAMETERS BY LANE COUNT
# ============================================================
params_by_lanes = {}

for entry in data:
    lanes = entry["params"]["numLanes"]
    if lanes not in params_by_lanes:
        params_by_lanes[lanes] = build_parameter_text(entry["params"])

# ============================================================
# DATA COLLECTION
# ============================================================
speed_data = defaultdict(list)
throughput_data = defaultdict(list)
lane_change_data = defaultdict(list)
per_lane_tp = defaultdict(lambda: defaultdict(list))

for entry in data:
    params = entry["params"]
    final = entry.get("finalStats", {})

    d = params["trafficDensity"]
    rule = entry["trafficRule"]
    lanes = params["numLanes"]

    if final.get("stabilizedAverageSpeed") is not None:
        speed_data[(d, rule, lanes)].append(final["stabilizedAverageSpeed"])

    if final.get("stabilizedThroughput") is not None:
        throughput_data[(d, rule, lanes)].append(final["stabilizedThroughput"])

    if lanes == 2:
        if final.get("laneChanges") is not None:
            lane_change_data[(d, rule)].append(final["laneChanges"])

        if isinstance(final.get("perLaneThroughputs"), list):
            per_lane_tp[(d, rule)][0].append(final["perLaneThroughputs"][0])
            per_lane_tp[(d, rule)][1].append(final["perLaneThroughputs"][1])

# ============================================================
# GENERIC PLOT FUNCTION
# ============================================================
def plot_mean_std(
    x, a_data, e_data, title, ylabel, window_title, param_text
):
    a_stats = [mean_std(a_data[d]) for d in x]
    e_stats = [mean_std(e_data[d]) for d in x]

    a_avg, a_low, a_up = zip(*a_stats)
    e_avg, e_low, e_up = zip(*e_stats)

    plt.figure(figsize=(15, 12))
    plt.gcf().canvas.manager.set_window_title(window_title)

    plt.fill_between(
        x, a_low, a_up, alpha=0.35,
        label="American Std Deviation Band"
    )
    plt.plot(x, a_avg, marker="o", linewidth=2, label="American Avg")

    plt.fill_between(
        x, e_low, e_up, alpha=0.35,
        label="European Std Deviation Band"
    )
    plt.plot(x, e_avg, marker="s", linewidth=2, label="European Avg")

    plt.xlabel("Traffic Density (cars/km)")
    plt.ylabel(ylabel)
    plt.title(title)
    plt.xticks(x)
    plt.grid(True)
    plt.legend()

    plt.text(
        0.02, -0.28, param_text,
        transform=plt.gca().transAxes,
        fontsize=10,
        va="top",
        bbox=dict(facecolor="white", alpha=0.85)
    )

    plt.subplots_adjust(bottom=0.32)
    mplcursors.cursor(hover=True)

# ============================================================
# AXES
# ============================================================
dens_1 = sorted({d for d, _, l in speed_data if l == 1})
dens_2 = sorted({d for d, _, l in speed_data if l == 2})

# ============================================================
# 1 LANE PLOTS
# ============================================================
plot_mean_std(
    dens_1,
    {d: speed_data[(d, "american", 1)] for d in dens_1},
    {d: speed_data[(d, "european", 1)] for d in dens_1},
    "Average Speed vs Traffic Density (1 Lane)",
    "Average Speed (km/h)",
    "1 Lane – Average Speed",
    params_by_lanes[1]
)

plot_mean_std(
    dens_1,
    {d: throughput_data[(d, "american", 1)] for d in dens_1},
    {d: throughput_data[(d, "european", 1)] for d in dens_1},
    "Throughput vs Traffic Density (1 Lane)",
    "Throughput (cars/hr)",
    "1 Lane – Throughput",
    params_by_lanes[1]
)

# ============================================================
# 2 LANE PLOTS
# ============================================================
plot_mean_std(
    dens_2,
    {d: speed_data[(d, "american", 2)] for d in dens_2},
    {d: speed_data[(d, "european", 2)] for d in dens_2},
    "Average Speed vs Traffic Density (2 Lanes)",
    "Average Speed (km/h)",
    "2 Lanes – Average Speed",
    params_by_lanes[2]
)

plot_mean_std(
    dens_2,
    {d: throughput_data[(d, "american", 2)] for d in dens_2},
    {d: throughput_data[(d, "european", 2)] for d in dens_2},
    "Throughput vs Traffic Density (2 Lanes)",
    "Throughput (cars/hr)",
    "2 Lanes – Throughput",
    params_by_lanes[2]
)

# ============================================================
# 2 LANE — LANE CHANGES
# ============================================================
plot_mean_std(
    dens_2,
    {d: lane_change_data[(d, "american")] for d in dens_2},
    {d: lane_change_data[(d, "european")] for d in dens_2},
    "Lane Changes vs Traffic Density (2 Lanes)",
    "Number of Lane Changes",
    "2 Lanes – Lane Changes",
    params_by_lanes[2]
)

# ============================================================
# 2 LANE — PER LANE THROUGHPUT
# ============================================================
plt.figure(figsize=(15, 12))
plt.gcf().canvas.manager.set_window_title("2 Lanes – Per Lane Throughput")

for rule, marker in [("american", "o"), ("european", "s")]:
    left = [np.mean(per_lane_tp[(d, rule)][0]) for d in dens_2]
    right = [np.mean(per_lane_tp[(d, rule)][1]) for d in dens_2]

    plt.plot(dens_2, left, marker=marker, label=f"{rule.capitalize()} Left Lane")
    plt.plot(dens_2, right, marker=marker, linestyle="--",
             label=f"{rule.capitalize()} Right Lane")

plt.xlabel("Traffic Density (cars/km)")
plt.ylabel("Throughput (cars/hr)")
plt.title("Per-Lane Throughput vs Traffic Density (2 Lanes)")
plt.xticks(dens_2)
plt.grid(True)
plt.legend()

plt.text(
    0.02, -0.28, params_by_lanes[2],
    transform=plt.gca().transAxes,
    fontsize=10,
    va="top",
    bbox=dict(facecolor="white", alpha=0.85)
)

plt.subplots_adjust(bottom=0.32)
mplcursors.cursor(hover=True)

plt.show()
