// api.ts
export async function fetchInitialData(): Promise<number> {
    const response = await fetch('https://testnet-api.voi.nodly.io/v2/status');
    const data = await response.json();
    return data['last-round'];
}

export async function fetchDataForLastRound(lastRound: number) {
    const response = await fetch(`https://testnet-api.voi.nodly.io/v2/status/wait-for-block-after/${lastRound}`);
    return await response.json();
}

export const transactionsInLastRound = async (lastRound: number) => {
    try {
      const response = await fetch(`https://testnet-idx.voi.nodly.io/v2/transactions?round=${lastRound}`);
      const data = await response.json();
      return data.transactions;
    } catch (error) {
      console.error("Error fetching transactions for last round:", error);
      throw error;
    }
  };
  

  