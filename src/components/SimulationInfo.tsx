
import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const SimulationInfo: React.FC = () => {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="about">
        <AccordionTrigger>About This Simulation</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              This is a traffic flow simulation showing cars moving in a closed loop. 
              Each car follows a car-following model where it adjusts its speed based 
              on the distance to the car ahead.
            </p>
            <p>
              The simulation incorporates concepts such as:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>Safe following distance based on time headway</li>
              <li>Virtual car length (physical length + safe distance)</li>
              <li>Speed adjustment based on gap to car ahead</li>
              <li>Traffic density calculations</li>
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="model">
        <AccordionTrigger>Simulation Model</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              The traffic model uses the following key calculations:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>
                <strong>Safe Distance:</strong> tDist × speed × (5280/3600)
              </li>
              <li>
                <strong>Virtual Length:</strong> physical length + safe distance
              </li>
              <li>
                <strong>Deceleration:</strong> Based on the difference between current gap and safe gap
              </li>
              <li>
                <strong>Speed Adjustment:</strong> Gradual adjustment toward the speed of the car ahead
              </li>
            </ul>
            <p>
              When the leader car brakes, it creates a ripple effect through the traffic,
              demonstrating how traffic jams can form even without obstacles.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default SimulationInfo;
