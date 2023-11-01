"use client";

import {
  Card,
  Flex,
  Grid,
  Metric,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Text,
  Title
} from "@tremor/react";
import { Select, SelectItem } from "@tremor/react";
import { useEffect, useRef, useState } from 'react';
import MapComponent from './MapComponent';
import MyNode from './MyNode';
import { fetchDataForLastRound, fetchInitialData, transactionsInLastRound } from './api';
import Coloredstats from "./colorstats";
import ConsensusTable from './proposertable';
import MyTable, { NodeData } from "./table";
import LeaderboardTable from "./Leaderboard";

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
  const [lastRoundData, setLastRoundData] = useState<any>(null);  // New state variable for fetchDataForLastRound
  const [transactionsData, setTransactionsData] = useState<any[]>([]);  // New state variable for transactionsInLastRound
  const [allNodes, setAllNodes] = useState<NodeData[][]>([[], [], [], []]);
  const lastFetchTime = useRef<number | null>(null);
  const latestFetchedRound = useRef<number | null>(null);
  const SOME_THRESHOLD = 5 * 5000; // 5 seconds in milliseconds
  const ROUND_DIFF_THRESHOLD = 4;

  useEffect(() => {
    let isMounted = true;

    const fetchConsensusAccounts = async () => {
      try {
        const response = await fetch("https://voi-node-info.boeieruurd.com/api/daily-proposal-stats");
        const data = await response.json();
        setConsensusAccounts(data.data);
      } catch (error) {
        console.error("Error fetching consensus accounts:", error);
      }
    }

    const fetchSubsequentData = async (lastRound: number) => {
      const currentTime = new Date().getTime();

      try {
        const fetchedData = await fetchDataForLastRound(lastRound + 1);  // Store fetched data
        setLastRoundData(fetchedData);  // Update state variable with fetched data

        const endTime = new Date().getTime();
        const timeDifferenceInSeconds = ((endTime - currentTime) / 1000).toFixed(2);

        const transactions = await transactionsInLastRound(lastRound + 1);
        setTransactionsData(transactions);  // Update state variable with fetched data
        const numTransactions = transactions.length;

        if (isMounted) {
          setData([
            { title: "Latest Round:", metric: String(lastRound + 1) },
            { title: "Round Speed:", metric: `${timeDifferenceInSeconds} s` },
            { title: "Transactions in last round:", metric: String(numTransactions) },
          ]);

          if ((lastFetchTime.current && (currentTime - lastFetchTime.current > SOME_THRESHOLD))
            || (latestFetchedRound.current && (latestFetchedRound.current - lastRound > ROUND_DIFF_THRESHOLD))) {
            const initialLastRound = await fetchInitialData();
            fetchSubsequentData(initialLastRound);
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

    fetchConsensusAccounts();

    fetchInitialData().then(fetchSubsequentData)
      .catch(error => console.error("Error fetching initial data:", error));

    return () => {
      isMounted = false;
    };

  }, []);

  const [activeTab, setActiveTab] = useState(0); // 0 for "Overview", 1 for "My Node", 2 for "Relay Map"


  return (
    <main className="px-5 py-12 sm:px-12">
      <Title>Welcome to Voi-Node Metrics</Title>

      {/* Mobile Dropdown */}
      <div className="sm:hidden mt-6">
      <Select 
  value={String(activeTab)} 
  onValueChange={(value) => setActiveTab(Number(value))}
>
  <SelectItem value="0">Overview</SelectItem>
  <SelectItem value="1">My Node</SelectItem>
  <SelectItem value="2">Relay Map</SelectItem>
  <SelectItem value="3">Leaderboard</SelectItem>
</Select>

      </div>

      {/* Desktop Tabs */}
      <TabGroup className="hidden sm:block mt-6">
        <TabList>
          <Tab onClick={() => setActiveTab(0)}>Overview</Tab>
          <Tab onClick={() => setActiveTab(1)}>My Node</Tab>
          <Tab onClick={() => setActiveTab(2)}>Relay Map</Tab>
          <Tab onClick={() => setActiveTab(3)}>Leaderboard</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Flex className="mt-6">
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
            <MyNode consensusAccounts={consensusAccounts} />
          </TabPanel>
          <TabPanel>
            <MapComponent activeTab={activeTab} />
          </TabPanel>
          <TabPanel>
            <LeaderboardTable/>
          </TabPanel>
        </TabPanels>
      </TabGroup>

     {/* Content based on activeTab for mobile */}
<div className="sm:hidden mt-6">
    {activeTab === 0 && (
        <>
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
        </>
    )}
    {activeTab === 1 && (
        <>
            {/* My Node content */}
            <MyNode consensusAccounts={consensusAccounts} />
        </>
    )}
    {activeTab === 2 && (
        <>
            {/* Relay Map content */}
            <MapComponent activeTab={activeTab} />
        </>
    )}
    {activeTab === 3 && (
        <>
            {/* Leaderboard content */}
            <LeaderboardTable/>
        </>
    )}
</div>

    </main>
  );
}