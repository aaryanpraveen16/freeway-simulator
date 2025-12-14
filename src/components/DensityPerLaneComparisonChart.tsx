import React, { useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UnitSystem, getUnitConversions } from "@/utils/unitConversion";
import { calculateStabilizedValue } from "@/utils/stabilizedValueCalculator";

interface DensityPerLaneComparisonChartProps {
    dataHistory: any[];
    numLanes: number;
    unitSystem?: UnitSystem;
}

const DensityPerLaneComparisonChart: React.FC<DensityPerLaneComparisonChartProps> = ({
    dataHistory,
    numLanes,
    unitSystem = 'metric'
}) => {
    const conversions = getUnitConversions(unitSystem);
    const chartRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Match colors from other per-lane charts for consistency
    const laneColors = [
        "hsl(217, 91%, 60%)",    // Blue for Lane 1
        "hsl(142, 71%, 45%)",    // Green for Lane 2
        "hsl(262, 83%, 58%)",    // Purple for Lane 3
        "hsl(38, 92%, 50%)",     // Amber for Lane 4
        "hsl(190, 90%, 50%)",    // Cyan for Lane 5
        "hsl(340, 80%, 60%)",    // Pink for Lane 6
    ];

    const chartData = useMemo(() => {
        return dataHistory.map(record => {
            const point: any = {
                time: parseFloat(record.time.toFixed(2))
            };

            if (record.laneDensities) {
                record.laneDensities.forEach((density: number, i: number) => {
                    if (i < numLanes) {
                        point[`lane${i}`] = parseFloat(conversions.density.toDisplay(density).toFixed(2));
                    }
                });
            }
            return point;
        });
    }, [dataHistory, numLanes, conversions]);

    // Calculate stabilized values for each lane
    const stabilizedValues = useMemo(() => {
        const results: { [key: string]: any } = {};

        for (let i = 0; i < numLanes; i++) {
            const laneDensityData = dataHistory
                .filter(record => record.laneDensities && record.laneDensities[i] !== undefined)
                .map(record => conversions.density.toDisplay(record.laneDensities[i]));

            results[`lane${i}`] = calculateStabilizedValue(laneDensityData);
        }

        return results;
    }, [dataHistory, numLanes, conversions]);

    const handleExportImage = () => {
        if (!chartRef.current) return;

        try {
            const svgElement = chartRef.current.querySelector("svg");
            if (!svgElement) throw new Error("SVG element not found");

            const clonedSvg = svgElement.cloneNode(true) as SVGElement;
            clonedSvg.setAttribute("style", "background-color: white;");

            const allPaths = clonedSvg.querySelectorAll("path");
            allPaths.forEach(path => {
                const currentWidth = path.getAttribute("stroke-width") || "1";
                if (parseFloat(currentWidth) <= 1) {
                    path.setAttribute("stroke-width", "2");
                }
            });

            const svgData = new XMLSerializer().serializeToString(clonedSvg);
            const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });

            const downloadLink = document.createElement("a");
            downloadLink.href = URL.createObjectURL(svgBlob);
            downloadLink.download = "density-per-lane-chart.svg";
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            toast({
                title: "Chart exported",
                description: "Chart exported successfully",
                duration: 3000,
            });
        } catch (error) {
            console.error("Error exporting chart:", error);
            toast({
                title: "Export failed",
                variant: "destructive",
                duration: 3000,
            });
        }
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-lg">Density per Lane Over Time</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Analyze how traffic density distributes across lanes over time
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExportImage} className="flex items-center gap-1">
                        <Download size={16} /> Export
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[400px]" ref={chartRef}>
                    <ChartContainer
                        className="h-full"
                        config={Object.fromEntries(
                            Array.from({ length: numLanes }, (_, i) => [
                                `lane${i}`,
                                { label: `Lane ${i + 1}`, color: laneColors[i % laneColors.length] }
                            ])
                        )}
                    >
                        <LineChart
                            data={chartData}
                            margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="time"
                                name="Time"
                                label={{ value: "Time (seconds)", position: "insideBottom", offset: -40, style: { fontWeight: 500 } }}
                                tickFormatter={(value) => value.toFixed(0)}
                            />
                            <YAxis
                                name="Density"
                                label={{ value: `Density (${conversions.density.unit})`, angle: -90, position: "insideLeft", style: { fontWeight: 500 } }}
                                domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]}
                            />
                            <Tooltip
                                formatter={(value: number, name: string) => {
                                    const laneMatch = String(name).match(/lane(\d+)/);
                                    if (laneMatch) {
                                        return [
                                            `${value.toFixed(2)} ${conversions.density.unit}`,
                                            `Lane ${parseInt(laneMatch[1]) + 1}`
                                        ];
                                    }
                                    return [value, name];
                                }}
                                labelFormatter={(label) => `Time: ${Number(label).toFixed(2)} seconds`}
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.5rem',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    padding: '8px 12px',
                                    fontSize: '14px'
                                }}
                            />
                            <Legend
                                verticalAlign="top"
                                height={36}
                                formatter={(value) => {
                                    const laneMatch = String(value).match(/lane(\d+)/);
                                    if (laneMatch) {
                                        return `Lane ${parseInt(laneMatch[1]) + 1}`;
                                    }
                                    return value;
                                }}
                            />
                            {Array.from({ length: numLanes }, (_, i) => (
                                <Line
                                    key={i}
                                    type="monotone"
                                    dataKey={`lane${i}`}
                                    stroke={laneColors[i % laneColors.length]}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />
                            ))}
                        </LineChart>
                    </ChartContainer>
                </div>

                {/* Stabilized Values Display */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2">Stabilized Density by Lane:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        {Array.from({ length: numLanes }, (_, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: laneColors[i % laneColors.length] }}
                                    />
                                    <span>Lane {i + 1}:</span>
                                </div>
                                <span className={`font-mono ${stabilizedValues[`lane${i}`]?.isStabilized ? 'text-green-600' : 'text-orange-600'}`}>
                                    {stabilizedValues[`lane${i}`]?.value ?
                                        `${stabilizedValues[`lane${i}`].value.toFixed(2)} ${conversions.density.unit}` :
                                        'N/A'}
                                    {stabilizedValues[`lane${i}`]?.isStabilized && ' ✓'}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        ✓ indicates stabilized values.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default DensityPerLaneComparisonChart;
