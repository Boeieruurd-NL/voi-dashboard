import React, { useEffect, useState } from 'react';
import { ArrowDownIcon, InformationCircleIcon } from "@heroicons/react/solid";
import { Card, Flex, Icon, MultiSelect, MultiSelectItem, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Title, Tab, TabGroup, TabList } from "@tremor/react";
import { Metric, Text, CategoryBar, Legend, Grid } from "@tremor/react";

type LeaderboardAccount = {
    address: string;
    score: number;
};

const truncateString = (str: string, maxLength: number): string => {
    if (str.length <= maxLength) {
        return str;
    }
    return `${str.substring(0, maxLength - 3)}...`;
}



const LeaderboardTable: React.FC = () => {
    const [data, setData] = useState<LeaderboardAccount[]>([]);
    const [nfdMappings, setNfdMappings] = useState<{ [address: string]: string }>({});
    const [selectedAddresses, setSelectedAddresses] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(3);

    const [blacklist, setBlacklist] = useState<string[]>([
        "SDLCDDT7GAREOI5TJAZGIMXKPYYCPQVY4DXY75GHWHLKU7SZYVXVL5VIDY",
        "OO2VQ53ELOU2QRKFF6NMTEOOXVHPABSBRN3QVKSTEJOJHTU2DNSHCAOJIY",
        "7KA2VKJHXN3XS6CC4HICONHMGTZORJKBQOV5JIYQAAFKQRZMPMCCXBVRBI",
        "FEES3ZW52HQ7U7LB3OGLUFQX2DCCWPJ2LIMXAH75KYROBZBQRN3Q5OR3GI"
    ]);

    useEffect(() => {
        fetch("https://testnet-idx.voi.nodly.io/v2/accounts?limit=20000&currency-greater-than=1")
            .then(response => response.json())
            .then(data => {
                const formattedData = data.accounts
                    .filter(entry => !blacklist.includes(entry.address)) 
                    .map((entry: any) => ({
                        address: entry.address,
                        originalScore: entry.amount / 1000000, // Store the original score
                        score: parseFloat((entry.amount / 1000000).toFixed(2))  
                    }))
                    .sort((a, b) => b.originalScore - a.originalScore); // Sort based on the original score
                setData(formattedData);
                
                for (let i = 0; i < formattedData.length; i += 20) {
                    const batch = formattedData.slice(i, i + 20).map(entry => entry.address);
                    fetchNFDsForAddresses(batch);
                }
            });              
    }, [blacklist]);
    

    
    useEffect(() => {
        fetch("https://analytics.testnet.voi.nodly.io/v0/consensus/ballast")
            .then(response => response.json())
            .then(data => {
                const newBlacklistAddresses = [
                    ...Object.keys(data.bparts),
                    ...Object.keys(data.bots)
                ];
                setBlacklist(prevBlacklist => [...new Set([...prevBlacklist, ...newBlacklistAddresses])]); 
            })
            .catch(error => {
                console.error(error);
            });
    }, []); 
    

    const fetchNFDsForAddresses = (addresses: string[]) => {
        const url = `https://api.nf.domains/nfd/lookup?${addresses.map(address => `address=${address}`).join('&')}&view=tiny&allowUnverified=true`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const mappings: { [address: string]: string } = {};
                for (const address in data) {
                    mappings[address] = data[address].name;
                }
                setNfdMappings(prevMappings => ({ ...prevMappings, ...mappings }));
            })
            .catch(error => {
                console.error(error);
            });
    };

    const getFilteredData = () => {
        switch (selectedIndex) {
            case 0:
                return data.slice(0, 10);
            case 1:
                return data.slice(0, 50);
            case 2:
                return data.slice(0, 100);
            case 3:
                return data;
            default:
                return data;
        }
    };

    const filteredData = selectedAddresses.length === 0 ? getFilteredData() : getFilteredData().filter(entry => selectedAddresses.includes(entry.address));

   

    return (
    <>


        <Card className="p-7 bg-tremor-ring rounded-tremor-default mt-6">
            <Card className="bg-tremor-background dark:bg-dark-tremor-background rounded-tremor-default">
                <div className="md:flex justify-between mb-3.5">
                    <div>
                        <Flex className="space-x-1" justifyContent="start" alignItems="center">
                            <Title className="ml-1">Leaderboard:</Title>
                            <Icon
                                icon={InformationCircleIcon}
                                variant="simple"
                                tooltip="Ranked by voi holdings"
                            />
                        </Flex>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                    <div className="flex-grow max-w-xs">
                        <MultiSelect
                            onValueChange={setSelectedAddresses}
                            placeholder="Select Addresses..."
                            value={selectedAddresses}
                        >
                            {data.map((entry) => {
                                const displayName = nfdMappings[entry.address] || entry.address;
                                return (
                                    <MultiSelectItem key={entry.address} value={entry.address}>
                                        {truncateString(displayName, 17)}
                                    </MultiSelectItem>
                                );
                            })}
                        </MultiSelect>
                    </div>

                    <div className="mb-0.5 hidden sm:block ml-4">
                        <TabGroup index={selectedIndex} onIndexChange={setSelectedIndex}>
                            <TabList color="gray" variant="solid">
                                <Tab>Top 10</Tab>
                                <Tab>Top 50</Tab>
                                <Tab>Top 100</Tab>
                                <Tab>All</Tab>
                            </TabList>
                        </TabGroup>
                    </div>
                </div>

                <div className="table-container mt-6">
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableHeaderCell>Rank</TableHeaderCell>
                                <TableHeaderCell>Address</TableHeaderCell>
                                <TableHeaderCell>Score</TableHeaderCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredData.map((entry, idx) => (
                                <TableRow key={idx}>
                                    <TableCell>{data.findIndex(item => item.address === entry.address) + 1}</TableCell>
                                    <TableCell>{nfdMappings[entry.address] || truncateString(entry.address, 16)}</TableCell>
                                    <TableCell>{entry.score.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </Card>
    </>
);

    
}

export default LeaderboardTable;