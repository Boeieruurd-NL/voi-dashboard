import { Card, Col, Grid, Metric, SearchSelect, SearchSelectItem, Text } from "@tremor/react";
import { useEffect, useState } from 'react';
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

const formatDate2 = (dateStr: string): string => {
  const date = new Date(`${dateStr}Z`);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
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
  const [nodeData7d, setNodeData7d] = useState([]);
  const [nodeDataMonth, setNodeDataMonth] = useState([]);
  const [nodeAddress, setNodeAddress] = useState(null);

  const [, setAccountStatus] = useState(null);
  const [accountStake, setAccountStake] = useState(0);
  const [keyValidUntil, setKeyValidUntil] = useState(0);

  const [currentRound, setCurrentRound] = useState<number | null>(null);
  const keyValidUntilDate = keyValidUntil && currentRound ? 
  new Date(Date.now() + (keyValidUntil - currentRound) * 3400) : null;


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
    // Fetch the current round number from the network
    fetch("https://testnet-api.voi.nodly.io/v2/status")
      .then(response => response.json())
      .then(data => setCurrentRound(data['last-round']))
      .catch(error => console.error("Error fetching current round:", error));
  }, []);
  


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
    if (selectedNode) {
      fetch(`https://voi-node-info.boeieruurd.com/api/getNodeData/7d/${selectedNode}`)
        .then(response => response.json())
        .then(data => setNodeData7d(data))
        .catch(error => console.error("Error fetching 7-day node data:", error));
    }
  }, [selectedNode]);

  useEffect(() => {
    if (selectedNode) {
      fetch(`https://voi-node-info.boeieruurd.com/api/getNodeData/month/${selectedNode}`)
        .then(response => response.json())
        .then(data => setNodeDataMonth(data))
        .catch(error => console.error("Error fetching monthly node data:", error));
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



// Get the most recent score
const mostRecentScore = nodeData.length ? nodeData[0].score : null;

let nodeHealth: string;
if (mostRecentScore >= 5 && mostRecentScore <= 10) {
  nodeHealth = "Good";
} else if (mostRecentScore >= 3 && mostRecentScore < 5) {
  nodeHealth = "Medium";
} else if (mostRecentScore < 3) {
  nodeHealth = "Bad";
}



  const lastProposalDate = lastProposal ? formatDate(lastProposal) : "...";

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
          <ChartComponent data={nodeData} data7d={nodeData7d} dataMonth={nodeDataMonth} />


          </Card>
        </Col>

        {/* KPI sidebar */}
        <Col numColSpanLg={2}>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Card decoration="top" decorationColor="indigo" style={{ flexGrow: 1, flexShrink: 1 }}>
                <Text className="my-1 sm:text-left text-center small-text-on-mobile">
                  <span>Latest Score:</span>
                </Text>
                <Metric className="sm:text-left text-center small-metric-on-mobile">
                  {mostRecentScore ? mostRecentScore.toFixed(4) : "..."}
                </Metric>
              </Card>

              <Card decoration="top" decorationColor="indigo" style={{ flexGrow: 1, flexShrink: 1 }}>
                <Text className="my-1 sm:text-left text-center small-text-on-mobile">Node Health:</Text>
                <Metric className="sm:text-left text-center small-metric-on-mobile">{nodeHealth || "..."}</Metric>
              </Card>
            </div>

            <div className="flex space-x-4">
              <Card style={{ flexGrow: 1, flexShrink: 1 }}>
                <Text className="my-1 sm:text-left text-center small-text-on-mobile">24H Proposals:</Text>
                <Metric className="sm:text-left text-center small-metric-on-mobile">{proposals || "..."}</Metric>
              </Card>
              <Card style={{ flexGrow: 1, flexShrink: 1 }}>
                <Text className="my-1 sm:text-left text-center small-text-on-mobile">Votes on time:</Text>
                <Metric className="sm:text-left text-center small-metric-on-mobile">{percentageontime || "..."}%</Metric>
              </Card>
            </div>

            <div className="flex space-x-4">
              <Card style={{ flexGrow: 1, flexShrink: 1 }}>
                <Text className="my-1 sm:text-left text-center small-text-on-mobile">Key valid untill:</Text>
                <Metric className="sm:text-left text-center small-metric-on-mobile">
                {keyValidUntilDate ? formatDate2(keyValidUntilDate.toISOString().slice(0, 10)) : "..."}


  </Metric>
              </Card>
              <Card style={{ flexGrow: 1, flexShrink: 1 }}>
                <Text className="my-1 sm:text-left text-center small-text-on-mobile">Your Stake:</Text>
                <Metric className="sm:text-left text-center small-metric-on-mobile">
  {accountStake ? (accountStake / 1000000).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}) : "..."}
</Metric>

              </Card>
            </div>

            <Card>
              <Text className="my-1 sm:text-left text-center small-text-on-mobile">Last Proposal:</Text>
              <Metric className="sm:text-left text-center small-metric-on-mobile">{lastProposalDate}</Metric>
            </Card>

            <div className="flex space-x-4">
              <Card style={{ flexGrow: 1, flexShrink: 1 }}>
                <Text className="my-1 sm:text-left text-center small-text-on-mobile">All Proposals:</Text>
                <Metric className="sm:text-left text-center small-metric-on-mobile">{totalProposals !== null ? totalProposals : "..."}</Metric>
              </Card>
            </div>
          </div>
        </Col>
      </Grid> {/* This is the closing tag for Grid */}
    </main>
  );
}  