import { useState, useEffect } from 'react';
import {
    Card,
    LineChart,
    Title,
    Text,
    Metric,
    Table,
    TableHead,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
} from '@tremor/react';

interface StringJoiner {
    (...classes: string[]): string
}

const classNames: StringJoiner = (
    ...classes: string[]
): string => classes.filter(Boolean).join(' ');

export default function ChartComponent({ data }) {

    

    const formatChartData = (data) => {
        return data.map(item => {
            const date = new Date(item.timestamp);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed in JavaScript
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            // Format to include the year
            const formattedTime = `${day}-${month}-${year} ${hours}:${minutes}`;
    
            return {
                time: formattedTime, // This will be in DD-MM-YYYY HH:MM format
                Score: item.score,
                VotingScore: item.votingScore,
                NetworkScore: item.networkScore,
            };
        }).reverse(); // Reverse the order so the oldest data comes first
    };
    
    const formatTableData = (data) => {
        // This is a simplistic example. Adjust based on your requirements.
        return [
            {
                Showing: 'Score',
                TimePeriod: 'Today',
                Min: `${Math.min(...data.map(item => item.score))}`,
                Max: `${Math.max(...data.map(item => item.score))}`,
                Spread: parseFloat((Math.max(...data.map(item => item.score)) - Math.min(...data.map(item => item.score))).toFixed(5)),
            },
            {
                Showing: 'Voting Score',
                TimePeriod: 'Today',
                Min: `${Math.min(...data.map(item => item.votingScore))}`,
                Max: `${Math.max(...data.map(item => item.votingScore))}`,
                Spread: parseFloat((Math.max(...data.map(item => item.votingScore)) - Math.min(...data.map(item => item.votingScore))).toFixed(5)),
            },
            {
                Showing: 'Network Score',
                TimePeriod: 'Today',
                Min: `${Math.min(...data.map(item => item.networkScore))}`,
                Max: `${Math.max(...data.map(item => item.networkScore))}`,
                Spread: parseFloat((Math.max(...data.map(item => item.networkScore)) - Math.min(...data.map(item => item.networkScore))).toFixed(5)),
            }, 
        // ... add similar data for votingScore and networkScore if needed
        ];
    };

    const processedChartData = formatChartData(data);
    const tableData = formatTableData(data);

    const tabs = [
        { id: 1, name: 'Score', value: `${Math.max(...data.map(item => item.score))}` },
        { id: 2, name: 'Voting Score', value: `${Math.max(...data.map(item => item.votingScore))}` },
        { id: 3, name: 'Network Score', value: `${Math.max(...data.map(item => item.networkScore))}` },
    ];

    const [activeTab, setActiveTab] = useState(tabs[0].name);
    const filteredTableData = tableData.filter((item) => item.Showing === activeTab);

    const getCategoryKey = (categoryName) => {
        switch (categoryName) {
            case 'Score':
                return 'Score';
            case 'Voting Score':
                return 'VotingScore';
            case 'Network Score':
                return 'NetworkScore';
            default:
                return '';
        }
    };
    


    const activeCategoryKey = getCategoryKey(activeTab);
    
    
    const tabConfigs = {
        'Score': { minValue: 0, maxValue: 11 }, // You can adjust these values
        'Voting Score': { minValue: 0, maxValue: 1.1 }, // You can adjust these values
        'Network Score': { minValue: 0, maxValue: 1.1 }, // You can adjust these values
    };
    

    const valueFormatter = (number: number) => `${Intl.NumberFormat('us').format(number).toString()}`;

    return (
        <div className="mx-auto">
                <div className="">
                    <Title className="mt-2">24 Hour Node Data</Title>
                    <Text className="mt-1">Historic data of your node.</Text>
                    <LineChart
    className="h-72 mt-5"
    data={processedChartData}
    index="time"
    startEndOnly={true}
    categories={[activeCategoryKey]}
    colors={['indigo', 'cyan', 'purple']}
    valueFormatter={valueFormatter}
    showYAxis={false}
    showLegend={true}
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
<Text className="text-xs sm:text-base">
    {tab.name}
</Text>
<Metric className="text-xs sm:text-xl">
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
                        <TableHeaderCell className="text-right">Spread</TableHeaderCell>
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
                            <TableCell className="text-right">
                                <Text>{item.Spread}</Text>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
