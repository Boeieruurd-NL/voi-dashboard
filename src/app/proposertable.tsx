import { ArrowDownIcon, ArrowUpIcon, InformationCircleIcon } from "@heroicons/react/solid";
import { Card, Flex, Icon, MultiSelect, MultiSelectItem, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Title } from "@tremor/react";
import React, { useEffect, useState } from 'react';

type consensusAccounts = {
    Sender: string;
    softVotes: number;
    softTokens: number;
    certVotes: number;
    certTokens: number;
    proposals: number;
    q05Latency: number | null;
    lastSoftVote: string | null;
    lastCertVote: string | null;
    lastProposal: string | null;
    avgPctOnTime: number | null;
};

const formatDate = (dateStr: string): string => {
    // Append 'Z' to indicate that the timestamp is in UTC
    const date = new Date(`${dateStr}Z`);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
}

const truncateString = (str: string, maxLength: number): string => {
    if (str.length <= maxLength) {
        return str;
    }
    return `${str.substring(0, maxLength - 3)}...`; // Subtract 3 for the "..." ellipsis at the end
}

const fancyNamesMapping: { [key in keyof consensusAccounts]?: string } = {
    Sender: "Sender Name",
    softVotes: "Soft Votes",
    softTokens: "Soft Tokens",
    certVotes: "Cert Votes",
    certTokens: "Cert Tokens",
    proposals: "Accepted Proposals",
    q05Latency: "Latency (Q05)",
    lastSoftVote: "Last Soft Vote",
    lastCertVote: "Last Cert Vote",
    lastProposal: "Last Proposal",
    avgPctOnTime: "Avg % On Time",
};

// Returns the fancy name for the column, or the original name if no fancy name is defined.
const getFancyName = (name: keyof consensusAccounts) => fancyNamesMapping[name] || name;

interface ConsensusTableProps {
    consensusAccounts: any[];
}

const ConsensusTable: React.FC<ConsensusTableProps> = ({ consensusAccounts: consensusAccountsProp }) => {
    const [data, setData] = useState<consensusAccounts[]>([]);
    const [selectedNames, setSelectedNames] = useState<string[]>([]);
    const [sortField, setSortField] = useState<keyof consensusAccounts | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const excludedFields: Array<keyof consensusAccounts> = ['softVotes', 'softTokens', 'lastSoftVote', 'lastCertVote', 'certVotes', 'certTokens'];
    const headerOrder: (keyof consensusAccounts)[] = ["Sender", "proposals", "q05Latency", "avgPctOnTime", "lastProposal"];
    const centeredColumns: (keyof consensusAccounts)[] = ["proposals", "q05Latency", "avgPctOnTime"];
    const [nfdMappings, setNfdMappings] = useState<{ [address: string]: string }>({});
    const [balances, setBalances] = useState<{ [address: string]: number }>({});

    const fetchBalancesForAddresses = (addresses: string[]) => {
        addresses.forEach(address => {
            fetch(`https://testnet-api.voi.nodly.io/v2/accounts/${address}`)
                .then(response => response.json())
                .then(data => {
                    
                    const adjustedAmount = data.amount / 1000000;
                    setBalances(prevBalances => ({ ...prevBalances, [address]: adjustedAmount }));
                })
                .catch(error => {
                    console.error(error);
                });
        });
    };
    
    


    // State to manage which dropdown is active
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

    const fetchNFDsForAddresses = (addresses: string[]) => {
        const url = `https://api.nf.domains/nfd/lookup?${addresses.map(address => `address=${address}`).join('&')}&view=tiny&allowUnverified=true`;

        fetch(url)
            .then(response => {
                if (response.status === 404) {
                    throw new Error('No NFDs found.');
                }
                return response.json();
            })
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

    useEffect(() => {
        const formatDataFromProp = (data: any[]): consensusAccounts[] => {
            return data.map((entry: any) => ({
                Sender: entry[0],
                softVotes: entry[1],
                softTokens: entry[2],
                certVotes: entry[3],
                certTokens: entry[4],
                proposals: entry[6],
                q05Latency: entry[5],
                lastSoftVote: entry[7],
                lastCertVote: entry[8],
                lastProposal: entry[9],
                avgPctOnTime: entry[10],
            }));
        };
    
        const formattedData = formatDataFromProp(consensusAccountsProp);
        setData(formattedData);
    
        // Fetch NFDs in batches
        for (let i = 0; i < formattedData.length; i += 20) {
            const batch = formattedData.slice(i, i + 20).map(entry => entry.Sender);
            fetchNFDsForAddresses(batch);
        }
    
        // Fetch balances for each address
        const allAddresses = formattedData.map(entry => entry.Sender);
        fetchBalancesForAddresses(allAddresses);
    
    

        // Read selected names from local storage when component mounts
        const savedSelectedNames = localStorage.getItem('consensusSelectedNames');
        if (savedSelectedNames) {
            setSelectedNames(JSON.parse(savedSelectedNames));
        }

        // Clean up on component unmount
        return () => {
           
        };
    }, [consensusAccountsProp]);

    // Handle changes to the multi-select dropdown
    const handleSelectedNamesChange = (names: string[]) => {
        setSelectedNames(names);
        localStorage.setItem('consensusSelectedNames', JSON.stringify(names));

    };

    const computeProposerScore = (address: string, proposals: number) => {
        const balance = balances[address] || 1; 
        return (proposals / balance) * 100000;
    };

    const sortedData = [...data].sort((a, b) => {
        if (!sortField) {
            return 0;
        }

        let valueA = a[sortField];
        let valueB = b[sortField];

        // Convert to numbers if they're numeric strings
        if (typeof valueA === 'string' && !isNaN(Number(valueA))) {
            valueA = Number(valueA);
        }
        if (typeof valueB === 'string' && !isNaN(Number(valueB))) {
            valueB = Number(valueB);
        }

        if (typeof valueA === 'number' && typeof valueB === 'number') {
            return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        }

        if (typeof valueA === 'string' && typeof valueB === 'string') {
            return sortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        }

        return 0;
    });

    const sortedAndFilteredData = sortedData.filter(entry => {
        if (selectedNames.length === 0) {
            return true; // If no names are selected, show all
        }
        return selectedNames.includes(entry.Sender); // Otherwise, only show rows for the selected names
    });

    const handleSort = (field: keyof consensusAccounts) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Toggle dropdown for mobile view
    const toggleDropdown = (idx: number) => {
        if (activeDropdown === idx) {
            setActiveDropdown(null);
        } else {
            setActiveDropdown(idx);
        }
    };

    return (

        <Card>

            <div className="md:flex justify-between mb-3.5">
                <div>
                    <Flex className="space-x-1" justifyContent="start" alignItems="center">
                        <Title className="ml-1">Actual Daily Proposals:</Title>
                        <Icon
                            icon={InformationCircleIcon}
                            variant="simple"
                            tooltip="24H Proposal Data"
                        />
                    </Flex>
                </div>
            </div>
            {/* Multi-select dropdown */}
            <div className="max-w-xs mt-1">
                <MultiSelect
                    key={selectedNames.join(',')}
                    onValueChange={handleSelectedNamesChange}
                    placeholder="Select Senders..."
                    value={selectedNames}
                >
                    {data.map((entry) => {
                        const displayName = nfdMappings[entry.Sender] || entry.Sender;
                        return (
                            <MultiSelectItem key={entry.Sender} value={entry.Sender}>
                                {truncateString(displayName, 17)}
                            </MultiSelectItem>
                        );
                    })}
                </MultiSelect>
            </div>
            <div className="table-container mt-6">
                <Table className="hide-columns">
                    <TableHead>
                        <TableRow>
                            {headerOrder.map(key => {
                                if (!excludedFields.includes(key)) {
                                    const isCentered = centeredColumns.includes(key);
                                    return (
                                        <TableHeaderCell
                                            key={key}
                                            onClick={() => handleSort(key)}
                                            className={isCentered ? "text-center" : ""}
                                        >
                                            {getFancyName(key)}
                                            {sortField === key && (sortDirection === "asc" ?
                                                <ArrowUpIcon className="inline w-4 h-4 ml-1" /> :
                                                <ArrowDownIcon className="inline w-4 h-4 ml-1" />)}

                                        </TableHeaderCell>
                                    );
                                }
                                return null;
                            })}
                            <TableHeaderCell>
                                Proposer Score
                            </TableHeaderCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedAndFilteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={headerOrder.length}>
                                    No api data available. Try again later.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedAndFilteredData.map((entry, idx) => (
                                <React.Fragment key={idx}>
                                    <TableRow onClick={() => toggleDropdown(idx)}>
                                        {headerOrder.map(key => {
                                            let displayValue = entry[key];
                                            const isCentered = centeredColumns.includes(key);
                                            if (typeof displayValue === 'string' && displayValue.includes('-') && displayValue.includes(':')) {
                                                displayValue = formatDate(displayValue);
                                            }
                                            let finalDisplayValue = displayValue;

                                            if (key === "Sender" && typeof displayValue === 'string') {
                                                const nfdDisplay = nfdMappings[displayValue] || displayValue;
                                                finalDisplayValue = truncateString(nfdDisplay, 20);
                                            }
                                            return (
                                                <TableCell key={key} className={isCentered ? "text-center" : ""}>
                                                    {key === "Sender" ? (
                                                        <div className="flex justify-between items-center">
                                                            {finalDisplayValue}
                                                            <span className="md:hidden">
                                                                {activeDropdown === idx ?
                                                                    <ArrowUpIcon className="inline w-4 h-4" /> :
                                                                    <ArrowDownIcon className="inline w-4 h-4" />
                                                                }
                                                            </span>
                                                        </div>
                                                    ) : finalDisplayValue}
                                                </TableCell>
                                            );
                                        })}
                                         <TableCell>
                                            {computeProposerScore(entry.Sender, entry.proposals).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                    {activeDropdown === idx && (
                                        <div className="md:hidden my-2 ml-3">
                                            {headerOrder.filter(key => key !== "Sender").map(key => {
                                                let displayValue = entry[key];
                                                if (typeof displayValue === 'string' && displayValue.includes('-') && displayValue.includes(':')) {
                                                    displayValue = formatDate(displayValue);
                                                }
                                                return (
                                                    <div key={key} className="my-3 ml-2">
                                                        <p>
                                                            <strong>{getFancyName(key)}:</strong> {displayValue}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                            <div className="my-3 ml-2">
                                            <p className="my-3">
                                            <strong>Proposer Score:</strong> {computeProposerScore(entry.Sender, entry.proposals).toFixed(2)}
                                            </p>
                                            </div>
                                        </div>
                                    

                                                   
                                         
                                    )}
                                </React.Fragment>
                            )))}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}

export default ConsensusTable;