// External and Third-Party Imports
import { Card, Metric, Text, Icon, Flex, Color } from "@tremor/react";
import { CashIcon, TicketIcon, UserGroupIcon } from "@heroicons/react/solid";

// Local and Relative Imports
import { NodeData } from './table';

type Props = {
    dayData: NodeData[];
};

export default function Coloredstats({ dayData }: Props) {
    // Calculations
    const totalHosts = dayData.length;
    const totalScore = dayData.reduce((acc, node) => {
        if (typeof node.score !== 'number' || isNaN(node.score)) {
            return acc;  // Return accumulator if the score is not a valid number
        }
        return acc + node.score;
    }, 0);
    
    const averageScore = totalHosts === 0 ? 0 : totalScore / totalHosts;

    // Define categories
    const categories: {
        title: string;
        metric: string;
        icon: any;
        color: Color;
    }[] = [
        {
            title: "Daily Telemetry Node Count:",
            metric: totalHosts.toString(),
            icon: UserGroupIcon,
            color: "indigo",
        },
        {
            title: "Daily Average Score",
            metric: averageScore.toFixed(2),
            icon: TicketIcon,
            color: "indigo",
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-6">
            {categories.map((item) => (
                <Card key={item.title} decoration="top" decorationColor={item.color}>
                    <Flex justifyContent="start" className="space-x-4">
                        {/* Hide icons on small screens (mobile) */}
                        <Icon 
                            icon={item.icon} 
                            variant="light" 
                            size="xl" 
                            color={item.color} 
                            className="hidden sm:block" 
                        />
                        <div className="truncate text-center sm:text-left">
                        <Text className="sm:mt-1">
    {item.title === "Daily Telemetry Node Count:" ? (
        <>
            <span className="sm:hidden">Node Count</span>
            <span className="hidden sm:block">Daily Telemetry Node Count:</span>
        </>
    ) : item.title === "Daily Average Score" ? (
        <>
            <span className="sm:hidden">Avg Score</span>
            <span className="hidden sm:block">Daily Average Score</span>
        </>
    ) : (
        item.title
    )}
</Text>
                            <Metric className="mt-1">{item.metric}</Metric>
                        </div>
                    </Flex>
                </Card>
            ))}
        </div>
    );      
}
