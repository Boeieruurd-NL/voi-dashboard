import {
  Card,
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableBody,
  MultiSelect,
  MultiSelectItem,
  Flex,
  Title,
  Icon,
  TabGroup,
  TabList,
  Tab,
} from "@tremor/react";
import { useState, useEffect } from "react";
import React from 'react';
import { InformationCircleIcon, ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/solid";
import { Select, SelectItem } from "@tremor/react";

type Props = {
  allNodes: NodeData[][];
  setAllNodes: React.Dispatch<React.SetStateAction<NodeData[][]>>;
  };

function truncateString(str: string, num: number): string {
  return str.length <= num ? str : `${str.slice(0, num)}...`;
}

export type NodeData = {
  host: string;
  name: string;
  score: number;
  livenessScore: number;
  votingScore: number;
  networkScore: number;
  addrCnt: number;
  softVotes: number;
  certVotes: number;
  proposals: number;
  missedBlocks: number;
  };

export default function MyTable({ allNodes, setAllNodes }: Props) {
  const headerTextColor = "white";
  const rowTextColor = "white";
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sortField, setSortField] = useState<keyof NodeData | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRowExpansion = (nodeName: string) => {
    setExpandedRow(prev => (prev === nodeName ? null : nodeName));
};
 
  const apiEndpoints = [
    "/v0/network/nodes/hour",
    "/v0/network/nodes/day",
    "/v0/network/nodes/week",
    "/v0/network/nodes/month"
  ];

  const nodes = allNodes[selectedIndex];
  const highestScoreNode = nodes.length > 0
    ? nodes.reduce((prev, curr) => curr.score > prev.score ? curr : prev)
    : null;

    const sortedNodes = [...nodes].sort((a, b) => {
      if (!sortField) return 0;
    
      const field = sortField as keyof NodeData;
      const valueA = a[field];
      const valueB = b[field];
    
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }
    
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        // String comparison
        return sortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      }
    
      // Handle other cases or fallback
      return 0;
    });
    

  const handleSort = (field: keyof NodeData) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  function getCircleColor(nodeScore: number) {
    if (nodeScore >= 0 && nodeScore < 2) return "red";
    else if (nodeScore >= 2 && nodeScore < 5) return "yellow";
    else if (nodeScore >= 5 && nodeScore <= 10) return "green";
    else return "gray";  // default/fallback color for scores outside the provided range
  }

  const handleSelectedNamesChange = (names: string[]) => {
    setSelectedNames(names);
    localStorage.setItem('selectedNames', JSON.stringify(names));
  }
  
  useEffect(() => {
    const fetchData = async (endpoint: string, index: number) => {
      const response = await fetch(`https://analytics.testnet.voi.nodly.io${endpoint}`);
      const data = await response.json();

      const nodesData = data.data.map((node: any) => ({
        host: node[0],
        name: node[1],
        score: parseFloat(node[2]),
        livenessScore: parseFloat(node[3]),
        votingScore: parseFloat(node[4]),
        networkScore: parseFloat(node[5]),
        addrCnt: parseInt(node[6], 10), // assuming address count is an integer
        softVotes: parseInt(node[7], 10), 
        certVotes: parseInt(node[8], 10),
        proposals: parseInt(node[9], 10),
        missedBlocks: parseInt(node[10], 10),
    }));
    

      setAllNodes(prev => {
        const newNodes = [...prev];
        newNodes[index] = nodesData;
        return newNodes;
      });
    };

    apiEndpoints.forEach((endpoint, index) => fetchData(endpoint, index));
    const interval = setInterval(() => {
      apiEndpoints.forEach((endpoint, index) => fetchData(endpoint, index));
    }, 3600000);

  // Read selected names from local storage when component mounts
  const savedSelectedNames = localStorage.getItem('selectedNames');
  if (savedSelectedNames) {
    setSelectedNames(JSON.parse(savedSelectedNames));
  }

  return () => clearInterval(interval);
}, []);

  const isNodeSelected = (node: NodeData) => selectedNames.includes(node.name) || !selectedNames.length;

  return (
      <div className="mt-6">
      <Card>
      <div className="md:flex justify-between mb-2">
    <div>
        <Flex className="space-x-1" justifyContent="start" alignItems="center">
            <Title className="ml-1">Node Health List</Title>
            <Icon
                icon={InformationCircleIcon}
                variant="simple"
                tooltip={selectedIndex === 0 ? "Only nodes with Telemetry on are shown." : "Only nodes with Telemetry on are shown."}
            />
        </Flex>
    </div>
</div>
          <div className="md:flex mb-6 md:items-center md:justify-between">
  
          <div className="md:flex md:items-center md:justify-between">
  
  <div className="flex flex-col sm:flex-row sm:space-x-0 w-full md:w-auto md:items-start">
      <div className="sm:hidden mb-4 md:mb-0">
          <div className="max-w-sm space-y-6">
          <Select 
    value={selectedIndex.toString()} 
    onValueChange={(value) => setSelectedIndex(Number(value))}
    placeholder="Sort by..">
                  <SelectItem value="0">Hour</SelectItem>
                  <SelectItem value="1">Day</SelectItem>
                  <SelectItem value="2">Week</SelectItem>
                  <SelectItem value="3">Month</SelectItem>
              </Select>
          </div>
      </div>

      <div className="max-w-xs mt-1 sm:mt-0 md:w-80">
      <MultiSelect
    key={selectedNames.join(',')}
    onValueChange={handleSelectedNamesChange}
    placeholder="Select Nodes..."
    value={selectedNames}
>
    {nodes.map((node) => (
        <MultiSelectItem key={node.host} value={node.name}>
            <span className={rowTextColor}>{truncateString(node.name, 17)}</span>
        </MultiSelectItem>
    ))}
</MultiSelect>

      </div>
  </div>
</div>
            <div className="mb-0.5 hidden sm:block" style={{ marginTop: '3.5px' }}>
            <TabGroup index={selectedIndex} onIndexChange={setSelectedIndex}>
        <TabList color="gray" variant="solid">
            <Tab>Hour</Tab>
            <Tab>Day</Tab>
            <Tab>Week</Tab>
            <Tab>Month</Tab>
        </TabList>
    </TabGroup>
</div>
        </div>
        <div className="table-container">
    <Table className="mt-0 p-0">
        <TableHead>
    <TableRow>
      <TableHeaderCell className={headerTextColor} onClick={() => handleSort('name')}>
        Name {sortField === 'name' && (sortDirection === "asc" ? <ArrowUpIcon className="inline w-4 h-4" /> : <ArrowDownIcon className="inline w-4 h-4" />)}
      </TableHeaderCell>
      <TableHeaderCell className={`${headerTextColor} text-right`} onClick={() => handleSort('score')}>
        Score {sortField === 'score' && (sortDirection === "asc" ? <ArrowUpIcon className="inline w-4 h-4" /> : <ArrowDownIcon className="inline w-4 h-4" />)}
      </TableHeaderCell>
      <TableHeaderCell className="text-right" onClick={() => handleSort('livenessScore')}>
        Liveness Score {sortField === 'livenessScore' && (sortDirection === "asc" ? <ArrowUpIcon className="inline w-4 h-4" /> : <ArrowDownIcon className="inline w-4 h-4" />)}
      </TableHeaderCell>
      <TableHeaderCell className="text-right" onClick={() => handleSort('votingScore')}>
        Voting Score {sortField === 'votingScore' && (sortDirection === "asc" ? <ArrowUpIcon className="inline w-4 h-4" /> : <ArrowDownIcon className="inline w-4 h-4" />)}
      </TableHeaderCell>
      <TableHeaderCell className="text-right" onClick={() => handleSort('networkScore')}>
        Network Score {sortField === 'networkScore' && (sortDirection === "asc" ? <ArrowUpIcon className="inline w-4 h-4" /> : <ArrowDownIcon className="inline w-4 h-4" />)}
      </TableHeaderCell>
      <TableHeaderCell className="text-right" onClick={() => handleSort('addrCnt')}>
        Address Count {sortField === 'addrCnt' && (sortDirection === "asc" ? <ArrowUpIcon className="inline w-4 h-4" /> : <ArrowDownIcon className="inline w-4 h-4" />)}
      </TableHeaderCell>
      <TableHeaderCell className="text-right" onClick={() => handleSort('softVotes')}>
        Soft Votes {sortField === 'softVotes' && (sortDirection === "asc" ? <ArrowUpIcon className="inline w-4 h-4" /> : <ArrowDownIcon className="inline w-4 h-4" />)}
      </TableHeaderCell>
      <TableHeaderCell className="text-right" onClick={() => handleSort('certVotes')}>
        Cert Votes {sortField === 'certVotes' && (sortDirection === "asc" ? <ArrowUpIcon className="inline w-4 h-4" /> : <ArrowDownIcon className="inline w-4 h-4" />)}
      </TableHeaderCell>
      <TableHeaderCell className="text-right" onClick={() => handleSort('proposals')}>
        Proposals {sortField === 'proposals' && (sortDirection === "asc" ? <ArrowUpIcon className="inline w-4 h-4" /> : <ArrowDownIcon className="inline w-4 h-4" />)}
      </TableHeaderCell>
    </TableRow>
  </TableHead>
        <TableBody>
            {sortedNodes.filter((node) => isNodeSelected(node)).map((node) => (
            <React.Fragment key={node.host}>
                <TableRow>
                    <TableCell>
                        <span style={{ color: getCircleColor(node.score), marginRight: '3px' }}>●</span> 
                        <span className={rowTextColor}>
                            {node.score === highestScoreNode.score ? '👑 ' : ''}
                            {truncateString(node.name, 17)}
                        </span>
                        {/* Add dropdown icon for mobile */}
                        <span className="sm:hidden float-right" onClick={() => toggleRowExpansion(node.name)}>
                            {expandedRow === node.name ? 
                                <ArrowUpIcon className="inline w-4 h-4" /> : 
                                <ArrowDownIcon className="inline w-4 h-4" />
                            }
                        </span>
                    </TableCell>
                    <TableCell className="text-right">{node.score}</TableCell>
                    <TableCell className="text-right">{node.livenessScore}</TableCell>
                    <TableCell className="text-right">{node.votingScore}</TableCell>
                    <TableCell className="text-right">{node.networkScore}</TableCell>
                    <TableCell className="text-right">{node.addrCnt}</TableCell>
                    <TableCell className="text-right">{node.softVotes}</TableCell>
                    <TableCell className="text-right">{node.certVotes}</TableCell>
                    <TableCell className="text-right">{node.proposals}</TableCell>
                </TableRow>
                {expandedRow === node.name && 
                <TableRow className="sm:hidden">
                    <TableCell colSpan={10} className="p-2">
    <div>
        <p className="my-2.5 ml-3"><strong>Score:</strong> {node.score}</p>
        <p className="my-2.5 ml-3"><strong>Liveness Score:</strong> {node.livenessScore}</p>
        <p className="my-2.5 ml-3"><strong>Voting Score:</strong> {node.votingScore}</p>
        <p className="my-2.5 ml-3"><strong>Network Score:</strong> {node.networkScore}</p>
        <p className="my-2.5 ml-3"><strong>Address Count:</strong> {node.addrCnt}</p>
        <p className="my-2.5 ml-3"><strong>Soft Votes:</strong> {node.softVotes}</p>
        <p className="my-2.5 ml-3"><strong>Cert Votes:</strong> {node.certVotes}</p>
        <p className="my-2.5 ml-3"><strong>Proposals:</strong> {node.proposals}</p>
    </div>
</TableCell>
                </TableRow>
                }
            </React.Fragment>
            ))}
        </TableBody>
    </Table>
</div>
</Card>
</div>
);
              }
