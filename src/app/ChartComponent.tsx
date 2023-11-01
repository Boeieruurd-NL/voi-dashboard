import {
    AreaChart,
    Button,
    Metric,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeaderCell,
    TableRow,
    Text,
    Title,
} from '@tremor/react';
import { useEffect, useState } from 'react';
interface StringJoiner {
    (...classes: string[]): string
}

interface ChartComponentProps {
    data: any[];
    data7d?: any[];
    dataMonth?: any[]; 
    }


const classNames: StringJoiner = (
    ...classes: string[]
): string => classes.filter(Boolean).join(' ');

export default function ChartComponent({ data, data7d, dataMonth }: ChartComponentProps) {
    const [timeFrame, setTimeFrame] = useState<'24h' | '7d' | 'month'>('24h');

    const formatChartData = (data: any[]) => {
                return data.map(item => {
            const date = new Date(item.timestamp);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
    
            const formattedTime = `${day}-${month}-${year} ${hours}:${minutes}`;
    
            return {
                time: formattedTime,
                Score: item.score === null ? 0 : item.score,
                VotingScore: item.votingScore === null ? 0 : item.votingScore,
                NetworkScore: item.networkScore === null ? 0 : item.networkScore,
            };
        }).reverse();
    };
    

    const [isMobileView, setIsMobileView] = useState(false); 

    useEffect(() => {
        setIsMobileView(window.innerWidth <= 768);

        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        // Override console.warn when the component mounts
        const originalWarn = console.warn;
        console.warn = (...args) => {
            if (
                args[0] &&
                typeof args[0] === 'string' &&
                args[0].includes('The width(0) and height(0) of chart should be greater than 0')
            ) {
                return;
            }
            originalWarn(...args);
        };

        
        return () => {
            console.warn = originalWarn;
        };
    }, []);



    const formatTableData = (data: any[]) => {
        let timePeriod;
        switch (timeFrame) {
            case '24h':
                timePeriod = "Today";
                break;
            case '7d':
                timePeriod = "Last 7 Days";
                break;
            case 'month':
                timePeriod = "This Month";
                break;
            default:
                timePeriod = "Today";
        }

        const sanitizeData = (val: number | null): number => (val === null ? 0 : val);

        
        const sanitizedScores = data.map(item => sanitizeData(item.score));
        const sanitizedVotingScores = data.map(item => sanitizeData(item.votingScore));
        const sanitizedNetworkScores = data.map(item => sanitizeData(item.networkScore));

        return [
            {
                Showing: 'Latest Total Score',  
                TimePeriod: timePeriod,
                Min: `${Math.min(...sanitizedScores)}`,
                Max: `${Math.max(...sanitizedScores)}`,
                Spread: parseFloat((Math.max(...sanitizedScores) - Math.min(...sanitizedScores)).toFixed(5)),
            },
            {
                Showing: 'Latest Voting Score',  
                TimePeriod: timePeriod,
                Min: `${Math.min(...sanitizedVotingScores)}`,
                Max: `${Math.max(...sanitizedVotingScores)}`,
                Spread: parseFloat((Math.max(...sanitizedVotingScores) - Math.min(...sanitizedVotingScores)).toFixed(5)),
            },
            {
                Showing: 'Latest Network Score',  
                TimePeriod: timePeriod,
                Min: `${Math.min(...sanitizedNetworkScores)}`,
                Max: `${Math.max(...sanitizedNetworkScores)}`,
                Spread: parseFloat((Math.max(...sanitizedNetworkScores) - Math.min(...sanitizedNetworkScores)).toFixed(5)),
            }
        ];
    };


    let currentData;
        switch (timeFrame) {
        case '24h':
            currentData = data;
                        break;
        case '7d':
            currentData = data7d;
                        break;
        case 'month':
            currentData = dataMonth;
                        break;
        default:
            currentData = data;
                }


    const processedChartData = formatChartData(currentData);
        const tableData = formatTableData(currentData);

   // Extract the latest scores
   const latestScore = currentData.length ? currentData[0].score : 0;
   const latestVotingScore = currentData.length ? currentData[0].votingScore : 0;
   const latestNetworkScore = currentData.length ? currentData[0].networkScore : 0;

// Update the tabs to reflect the latest scores
const tabs = [
    { id: 1, name: 'Latest Total Score', value: `${latestScore.toFixed(3)}` },
    { id: 2, name: 'Latest Voting Score', value: `${latestVotingScore.toFixed(3)}` },
    { id: 3, name: 'Latest Network Score', value: `${latestNetworkScore.toFixed(3)}` },
];


    const [activeTab, setActiveTab] = useState(tabs[0].name);
    const filteredTableData = tableData.filter((item) => item.Showing === activeTab);
    
     
     const getCategoryKey = (categoryName: string) => {
        switch (categoryName) {
            case 'Latest Total Score':
                return 'Score';
            case 'Latest Voting Score':
                return 'VotingScore';
            case 'Latest Network Score':
                return 'NetworkScore';
            default:
                return '';
        }
    };



    const activeCategoryKey = getCategoryKey(activeTab);


     
     const tabConfigs = {
        'Latest Total Score': { minValue: 0, maxValue: 11 },
        'Latest Voting Score': { minValue: 0, maxValue: 1.1 },
        'Latest Network Score': { minValue: 0, maxValue: 1.1 },
    };


    const valueFormatter = (number: number) => `${Intl.NumberFormat('us').format(number).toString()}`;

    const toggleTimeFrame = () => {
        if (timeFrame === '24h') {
            setTimeFrame('7d');
        } else if (timeFrame === '7d') {
            setTimeFrame('month');
        } else {
            setTimeFrame('24h');
        }
    };

    return (
        <div className="mx-auto">
            <div className="flex justify-between items-center">
                <Title>
                    {timeFrame === '7d' ? "7 Days Node Data" : timeFrame === 'month' ? "Monthly Node Data" : "24 Hour Node Data"}
                </Title>
                <div className="flex space-x-4">
                    {isMobileView ? (
                        <Button
                            size="xs"
                            color='indigo'
                            className="border border-indigo-500 text-white"
                            onClick={toggleTimeFrame}
                        >
                            {timeFrame === '24h' ? "24h" : timeFrame === '7d' ? "7d" : "Month"}
                        </Button>
                    ) : (
                        <>
                           <Button
        size="xs"
        color='indigo'
        className={classNames(timeFrame === '24h' ? 'bg-indigo-500' : '', 'border border-indigo-500 text-white')}
        onClick={() => setTimeFrame('24h')}
    >
        24 Hours
    </Button>
    <Button
        size="xs"
        color='indigo'
        className={classNames(timeFrame === '7d' ? 'bg-indigo-500' : '', 'border border-indigo-500 text-white')}
        onClick={() => setTimeFrame('7d')}
    >
        7 Days
    </Button>
    <Button
        size="xs"
        color='indigo'
        className={classNames(timeFrame === 'month' ? 'bg-indigo-500' : '', 'border border-indigo-500 text-white')}
        onClick={() => setTimeFrame('month')}
    >
        Month
    </Button>
                        </>
                    )}
                </div>

            </div>
                        <Text className="mt-1">Historic data of your node.</Text>
            <div className="chart-container">
            <AreaChart
    className="h-72 mt-5"
    data={processedChartData}
    index="time"
    startEndOnly={true}
    categories={[activeCategoryKey]}
    colors={['indigo', 'cyan', 'purple']}
    valueFormatter={valueFormatter}
    showYAxis={false}
    showLegend={true}
    showAnimation={true}
    animationDuration={1500}
    minValue={tabConfigs[activeTab].minValue}
    maxValue={tabConfigs[activeTab].maxValue}
/>
            </div>

            <div className="grid grid-cols-3 place-items-stretch divide-x divide-gray-200 border-t border-gray-200 rounded-b-lg overflow-hidden">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        role="tab"
                        type="button"
                        onClick={() => { setActiveTab(tab.name); }}
                        className={classNames(activeTab === tab.name ? 'bg-indigo-500' : '', 'cursor-pointer text-left w-full px-6 py-4 transition-colors')}
                    >
                        <Text className="text-xs sm:text-base text-sm-mobile mb-2">
                            {tab.name}
                        </Text>
                        <Metric className="text-xs sm:text-xl metric-sm-mobile">
                            {tab.value}
                        </Metric>
                    </button>
                ))}

            </div>

            <Table className="mt-5">
                <TableHead>
                    <TableRow>
                        <TableHeaderCell>Time period</TableHeaderCell>
                        <TableHeaderCell className="text-right">Min</TableHeaderCell>
                        <TableHeaderCell className="text-right">Max</TableHeaderCell>
                        <TableHeaderCell className="text-right hide-on-mobile">Spread</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {filteredTableData.map((item, i) => (
                        <TableRow key={i}>
                            <TableCell>
                                {item.TimePeriod}
                            </TableCell>
                            <TableCell className="text-right">
                                <Text>{item.Min}</Text>
                            </TableCell>
                            <TableCell className="text-right">
                                <Text>{item.Max}</Text>
                            </TableCell>
                            <TableCell className="text-right hide-on-mobile">
                                <Text>{item.Spread}</Text>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}               
