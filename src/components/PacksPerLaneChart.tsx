import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface PacksPerLaneHistoryItem {
    time: number;
    lane0?: number;
    lane1?: number;
    lane2?: number;
    lane3?: number;
    lane4?: number;
    lane5?: number;
    [key: string]: number | undefined;
}

interface PacksPerLaneChartProps {
    packsPerLaneHistory: PacksPerLaneHistoryItem[];
    numLanes: number;
}

const LANE_COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--car-red))',
    'hsl(var(--car-green))',
    'hsl(var(--car-yellow))',
    'hsl(var(--car-purple))',
    'hsl(var(--car-orange))'
];

const PacksPerLaneChart: React.FC<PacksPerLaneChartProps> = ({
    packsPerLaneHistory,
    numLanes
}) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const handleExportImage = () => {
        if (!chartRef.current) return;

        try {
            const svgElement = chartRef.current.querySelector("svg");
            if (!svgElement) {
                throw new Error("SVG element not found");
            }

            const clonedSvg = svgElement.cloneNode(true) as SVGElement;
            clonedSvg.setAttribute("background", "white");
            clonedSvg.setAttribute("style", "background-color: white;");

            const svgData = new XMLSerializer().serializeToString(clonedSvg);
            const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });

            const downloadLink = document.createElement("a");
            downloadLink.href = URL.createObjectURL(svgBlob);
            downloadLink.download = "packs-per-lane-chart.svg";
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            toast({
                title: "Chart exported",
                description: "Packs per lane chart has been exported successfully",
                duration: 3000,
            });
        } catch (error) {
            console.error("Error exporting chart:", error);
            toast({
                title: "Export failed",
                description: "Could not export the chart. Please try again.",
                variant: "destructive",
                duration: 3000,
            });
        }
    };

    // Debug: Log the data to console
    React.useEffect(() => {
        if (packsPerLaneHistory && packsPerLaneHistory.length > 0) {
            console.log("Packs Per Lane Data:", packsPerLaneHistory.slice(-3));
            console.log("Num Lanes:", numLanes);
        }
    }, [packsPerLaneHistory, numLanes]);

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Packs Per Lane Over Time</CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={handleExportImage}
                    >
                        <Download size={16} />
                        Export
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {!packsPerLaneHistory || packsPerLaneHistory.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                        <p>No data available yet. Start the simulation to see pack data.</p>
                    </div>
                ) : (
                    <div className="h-[300px]" ref={chartRef}>
                        <ChartContainer
                            className="h-full"
                            config={Object.fromEntries(
                                Array.from({ length: numLanes }, (_, i) => [
                                    `lane${i}`,
                                    {
                                        label: `Lane ${i + 1}`,
                                        color: LANE_COLORS[i % LANE_COLORS.length]
                                    }
                                ])
                            )}
                        >
                            <LineChart
                                data={packsPerLaneHistory}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="time"
                                    name="Time"
                                    label={{ value: "Time (seconds)", position: "insideBottomRight", offset: -10 }}
                                />
                                <YAxis
                                    label={{ value: "Number of Packs", angle: -90, position: "insideLeft" }}
                                />
                                <Tooltip formatter={(value) => [`${value}`, "Number of Packs"]} />
                                <Legend />
                                {Array.from({ length: numLanes }, (_, i) => (
                                    <Line
                                        key={`lane${i}`}
                                        type="monotone"
                                        dataKey={`lane${i}`}
                                        name={`Lane ${i + 1}`}
                                        stroke={LANE_COLORS[i % LANE_COLORS.length]}
                                        strokeWidth={2}
                                        dot={{ r: 4, strokeWidth: 2 }}
                                        activeDot={{ r: 8 }}
                                    />
                                ))}
                            </LineChart>
                        </ChartContainer>
                    </div>
                )}
            </CardContent>
        </Card >
    );
};

export default PacksPerLaneChart;
