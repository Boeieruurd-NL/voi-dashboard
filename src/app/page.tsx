"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, Grid, Title, Text, Tab, TabList, TabGroup, TabPanel, TabPanels, Flex, Metric } from "@tremor/react";
import MyTable, { NodeData } from "./table";
import ConsensusTable from './proposertable';
import Coloredstats from "./colorstats";
import { fetchDataForLastRound, fetchInitialData, transactionsInLastRound } from './api'; 
import MyNode from './MyNode';
import HoldersTab from './Holders';


type Kpi = {
    title: string;
    metric: string;
};

export default function DashboardExample() {
    const [data, setData] = useState<Kpi[]>([
        { title: "Latest Round:", metric: "Loading..." },
        { title: "Time of last Round:", metric: "Loading..." },
        { title: "Transactions in last round:", metric: "Loading..." },
    ]);
    const [consensusAccounts, setConsensusAccounts] = useState<any[]>([]);

    
    const [allNodes, setAllNodes] = useState<NodeData[][]>([[], [], [], []]);
    const lastFetchTime = useRef<number | null>(null);
    const latestFetchedRound = useRef<number | null>(null);

    useEffect(() => {
        let isMounted = true;
    
        const fetchSubsequentData = async (lastRound: number) => {
            const currentTime = new Date().getTime();
    
            try {
                await fetchDataForLastRound(lastRound + 1);
                const endTime = new Date().getTime();
                const timeDifferenceInSeconds = ((endTime - currentTime) / 1000).toFixed(2);
    
                const transactions = await transactionsInLastRound(lastRound + 1);
                const numTransactions = transactions.length;
                const SOME_THRESHOLD = 5 * 5000;  // 5000 milliseconds or 5 seconds
                const ROUND_DIFF_THRESHOLD = 4; // a threshold for the difference in rounds
    
                if (isMounted) {
                    setData([
                        { title: "Latest Round:", metric: String(lastRound + 1) },
                        { title: "Round Speed:", metric: `${timeDifferenceInSeconds} s` },
                        { title: "Transactions in last round:", metric: String(numTransactions) },
                    ]);
    
                    if ((lastFetchTime.current && (currentTime - lastFetchTime.current > SOME_THRESHOLD)) 
                        || (latestFetchedRound.current && (latestFetchedRound.current - lastRound > ROUND_DIFF_THRESHOLD))) {
                        // Reset fetching process
                        fetchInitialData()
                            .then(initialLastRound => {
                                if (isMounted) {
                                    fetchSubsequentData(initialLastRound);
                                }
                            })
                            .catch(error => console.error("Error fetching initial data:", error));
                    } else {
                        fetchSubsequentData(lastRound + 1);
                    }

                    latestFetchedRound.current = lastRound + 1;
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                if (isMounted) {
                    setTimeout(() => fetchSubsequentData(lastRound), 5000);
                }
            }

            lastFetchTime.current = currentTime;
        };

        // Fetch consensus accounts data
  fetch("https://voi-node-info.boeieruurd.com/api/daily-proposal-stats")
  .then(response => response.json())
  .then(data => setConsensusAccounts(data.data))
  .catch(error => console.error("Error fetching consensus accounts:", error));

        fetchInitialData()
            .then(initialLastRound => {
                if (isMounted) {
                    fetchSubsequentData(initialLastRound);
                }
            })
            .catch(error => console.error("Error fetching initial data:", error));
    
        return () => {
            isMounted = false;
        };

        
    }, []);

    
    

    return (
        <main className="px-5 py-12 sm:px-12">
            <Title>Welcome at Voi-Node Metrics</Title>
            
                            <TabGroup className="mt-6">

                <TabList>
    <Tab>Overview</Tab>
        <Tab>My Node</Tab>
        <Tab>Holders</Tab>
</TabList>
                    
                <TabPanels>
                        <TabPanel>
                                <Flex className="mt-4">
                                    <div style={{ width: '100%' }}>
                                        <Coloredstats dayData={allNodes[1]} />
                                    </div>
                                </Flex>

                                <Grid numItemsLg={3} className="mt-6 gap-6 text-center sm:text-left">
                                    {data.map((item: Kpi) => (
                                        <Card key={item.title} className="mx-auto sm:mx-0">
                                            <Flex alignItems="start">
                                                <div className="truncate mx-auto sm:mx-0">
                                                    <Text>{item.title}</Text>
                                                    <Metric className="truncate mx-auto text-center sm:text-left w-full">{item.metric}</Metric>
                                                </div>
                                            </Flex>
                                        </Card>
                                    ))}
                                </Grid>

                                <div className="mt-6">
                                    <Card>
                                        <MyTable allNodes={allNodes} setAllNodes={setAllNodes} />
                                    </Card>
                                </div>
                                <div className="mt-6">
                                    <Card>
                                        <ConsensusTable consensusAccounts={consensusAccounts} />
                                    </Card>
                                </div>
                            </TabPanel>
                    <TabPanel>
                                {/* My Node content */}
                                <MyNode consensusAccounts={consensusAccounts}/>
                            </TabPanel>
        <TabPanel>
                                <HoldersTab/>
                            </TabPanel>
                    </TabPanels>
                
                </TabGroup>
            </main>
            );
}
