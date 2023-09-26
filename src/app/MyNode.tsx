import React, { useEffect, useState } from 'react';
import { Card, Metric, Text, Grid, Col, SearchSelect, SearchSelectItem } from "@tremor/react";
import ChartComponent from './ChartComponent';

interface MyNodeProps {
  consensusAccounts: any[];
}

const formatDate = (dateStr: string): string => {
  // Append 'Z' to indicate that the timestamp is in UTC
  const date = new Date(`${dateStr}Z`);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(); // Only last 2 digits
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}




export default function MyNode({ consensusAccounts }: MyNodeProps) {
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') { 
      // We're in the browser environment
      return localStorage.getItem("selected-mynode") || "Boeieruurd-Cloud-Node";
    }
    return "Boeieruurd-Cloud-Node"; // Default value for server-side
  });
  
  const [nodeData, setNodeData] = useState([]);
  const [nodeAddress, setNodeAddress] = useState(null);

  const [accountStatus, setAccountStatus] = useState(null);
  const [accountStake, setAccountStake] = useState(0);
  const [keyValidUntil, setKeyValidUntil] = useState(0);

  useEffect(() => {
    if (selectedNode) {
      // Fetch the node's address based on the selected node name
      fetch(`https://voi-node-info.boeieruurd.com/api/node/getadress/${selectedNode}`)
        .then(response => response.json())
        .then(data => {
          setNodeAddress(data[0]);
        })
        .catch(error => console.error("Error fetching node address:", error));
    }
  }, [selectedNode]);

  // Extract relevant data for the current node
  const currentNodeData = consensusAccounts.find(account => account[0] === nodeAddress) || [];
  const [totalProposals, setTotalProposals] = useState<number | null>(null);


  const proposals = currentNodeData[6];
  const lastProposal = currentNodeData[9];
  const percentageontime = currentNodeData[10];


  useEffect(() => {
    // Fetch the list of nodes
    fetch("https://voi-node-info.boeieruurd.com/api/nodes")
      .then(response => response.json())
      .then(data => setNodes(data))
      .catch(error => console.error("Error fetching nodes:", error));
  }, []);

  useEffect(() => {
    if (selectedNode) {
      // Fetch the 24-hour data for the selected node. Adjust the URL as needed.
      fetch(`https://voi-node-info.boeieruurd.com/api/getNodeData/${selectedNode}`)
        .then(response => response.json())
        .then(data => setNodeData(data))
        .catch(error => console.error("Error fetching node data:", error));
    }
  }, [selectedNode]);

  useEffect(() => {
    if (nodeAddress) {
      fetch("https://voi-node-info.boeieruurd.com/api/total-proposal-stats")
        .then(response => response.json())
        .then(data => {
          const matchingNode = data.data.find((item: any) => item[0] === nodeAddress);
          if (matchingNode) {
            setTotalProposals(matchingNode[6]);
          } else {
            setTotalProposals(null);
          }
        })
        .catch(error => console.error("Error fetching total proposals:", error));
    }
  }, [nodeAddress]);
  

  useEffect(() => {
    // Store the selectedNode to localStorage whenever it changes
    if (selectedNode) {
      localStorage.setItem("selected-mynode", selectedNode);
    }
  }, [selectedNode]);

  useEffect(() => {
    if (nodeAddress) {
      // Fetch the account details for the current node's address
      fetch(`https://testnet-api.voi.nodly.io/v2/accounts/${nodeAddress}?exclude=none`)
        .then(response => response.json())
        .then(data => {
          setAccountStatus(data.status);
          setAccountStake(data.amount);
          setKeyValidUntil(data.participation["vote-last-valid"]);
        })
        .catch(error => console.error("Error fetching account details:", error));
    }
  }, [nodeAddress]);

  

  // Compute the average score
  const totalScore = nodeData.reduce((acc, dataPoint) => acc + dataPoint.score, 0);
  const averageScore = nodeData.length ? totalScore / nodeData.length : null;

  let nodeHealth;
  if (averageScore >= 5 && averageScore <= 10) {
    nodeHealth = "Good";
  } else if (averageScore >= 3 && averageScore < 5) {
    nodeHealth = "Medium";
  } else if (averageScore < 3) {
    nodeHealth = "Bad";
  }

  const lastProposalDate = lastProposal ? formatDate(lastProposal) : "Loading..";
  
  return (
    <main>
      <Text className="my-6">Welcome to your personal Dashboard! Please select your node:</Text>
  
      <SearchSelect
        placeholder="Select your node..."
        value={selectedNode}
        onValueChange={setSelectedNode}
      >
        {nodes.map(node => (
          <SearchSelectItem key={node.node_id} value={node.name}>
            {node.name}
          </SearchSelectItem>
        ))}
      </SearchSelect>
  
      <Grid numItemsLg={6} className="gap-6 mt-6">
        {/* Main section */}
        <Col numColSpanLg={4}>
          <Card className="h-full">
            <ChartComponent data={nodeData}/>
          </Card>
        </Col>
  
       {/* KPI sidebar */}
<Col numColSpanLg={2}>
    <div className="space-y-4">
        <div className="flex space-x-4">
            <Card decoration="top" decorationColor="indigo" style={{ flexGrow: 1, flexShrink: 1 }}>
                <Text className="my-1 sm:text-left text-center">Daily Average Score:</Text>
                <Metric className="sm:text-left text-center">{averageScore ? averageScore.toFixed(4) : "Loading.."}</Metric>
            </Card>

            <Card decoration="top" decorationColor="indigo" style={{ flexGrow: 1, flexShrink: 1 }}>
                <Text className="my-1 sm:text-left text-center">Node Health:</Text>
                <Metric className="sm:text-left text-center">{nodeHealth || "Loading.."}</Metric>
            </Card>
        </div>

        <div className="flex space-x-4">
            <Card style={{ flexGrow: 1, flexShrink: 1 }}>
                <Text className="my-1 sm:text-left text-center">24H Proposals:</Text>
                <Metric className="sm:text-left text-center">{proposals || "Loading.."}</Metric>
            </Card>
            <Card style={{ flexGrow: 1, flexShrink: 1 }}>
                <Text className="my-1 sm:text-left text-center">Votes on time:</Text>
                <Metric className="sm:text-left text-center">{percentageontime}%</Metric>
            </Card>
        </div>

        <div className="flex space-x-4">
            <Card style={{ flexGrow: 1, flexShrink: 1 }}>
                <Text className="my-1 sm:text-left text-center">Keys valid untill round:</Text>
                <Metric className="sm:text-left text-center">{keyValidUntil}</Metric>
            </Card>
            <Card style={{ flexGrow: 1, flexShrink: 1 }}>
                <Text className="my-1 sm:text-left text-center">Your stake</Text>
                <Metric className="sm:text-left text-center">{accountStake ? ((accountStake) / 1000000) : "Loading.."} VOI</Metric>
            </Card>
        </div>

        <Card>
            <Text className="my-1 sm:text-left text-center">Last Proposal:</Text>
            <Metric className="sm:text-left text-center">{lastProposalDate}</Metric>
        </Card>

        <div className="flex space-x-4">
            <Card style={{ flexGrow: 1, flexShrink: 1 }}>
                <Text className="my-1 sm:text-left text-center">All Proposals:</Text>
                <Metric className="sm:text-left text-center">{totalProposals !== null ? totalProposals : "Loading.."}</Metric>
            </Card>
        </div>
    </div>
</Col>




      </Grid> {/* This is the closing tag for Grid */}
    </main>
  );
        }  