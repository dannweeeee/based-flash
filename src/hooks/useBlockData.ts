"use client";

import { useQuery } from "@tanstack/react-query";
import { createPublicClient, http, formatEther } from "viem";
import { baseSepolia } from "wagmi/chains";
import { useFlashblockWebSocket } from "./useFlashblockWebSocket";

// Create a custom chain for Base Sepolia Flashblocks with multiple fallback RPC URLs
const baseSepoliaFlashblocks = {
  ...baseSepolia,
  id: 84532, // Using the same chain ID as Base Sepolia
  name: "Base Sepolia Flashblocks",
  rpcUrls: {
    default: {
      http: [
        "https://sepolia-preconf.base.org",
        // Add alternative endpoints if available in the future
      ],
      webSocket: ["wss://sepolia.flashblocks.base.org/ws"],
    },
    public: {
      http: [
        "https://sepolia-preconf.base.org",
        // Add alternative endpoints if available in the future
      ],
      webSocket: ["wss://sepolia.flashblocks.base.org/ws"],
    },
  },
};

// Create a more resilient transport with retries and timeout
const createResilientTransport = (url: string) => {
  return http(url, {
    timeout: 10000, // 10 seconds
    retryCount: 5, // Increase retry count
    retryDelay: 1000, // 1 second between retries
    fetchOptions: {
      cache: "no-cache", // Avoid caching issues
    },
  });
};

// Create clients lazily to avoid SSR issues
let regularClient: any = null;
let flashblockClient: any = null;

// Initialize clients only on the client side
const getRegularClient = () => {
  if (typeof window === "undefined") return null;

  if (!regularClient) {
    regularClient = createPublicClient({
      chain: baseSepolia,
      transport: createResilientTransport("https://sepolia.base.org"),
    });
  }
  return regularClient;
};


const getFlashblockClient = () => {
  if (typeof window === "undefined") return null;

  if (!flashblockClient) {
    try {
      flashblockClient = createPublicClient({
        chain: baseSepoliaFlashblocks,
        transport: createResilientTransport("https://sepolia-preconf.base.org"),
      });
      console.log("Created flashblock client with HTTP transport in useBlockData");
    } catch (error) {
      console.error("Error creating flashblock client:", error);
      // If we can't create the client with the primary endpoint, try WebSocket as fallback
      // Note: This is just a placeholder as we'd need to implement WebSocket transport properly
      console.warn("Falling back to regular client for now");
      return getRegularClient(); // Fallback to regular client if flashblock client fails
    }
  }
  return flashblockClient;
};

// Log available endpoints
console.log("Block data endpoints:", {
  regular: "https://sepolia.base.org",
  flashblock: {
    http: "https://sepolia-preconf.base.org",
  },
});

export interface BlockData {
  number: bigint;
  timestamp: bigint;
  hash: `0x${string}`;
  parentHash: `0x${string}`;
  nonce: `0x${string}` | null;
  difficulty: bigint;
  gasLimit: bigint;
  gasUsed: bigint;
  miner: `0x${string}`;
  extraData: `0x${string}`;
  baseFeePerGas: bigint | null;
  transactions: any[]; // Using any for transaction objects
  formattedTimestamp: string;
  timeAgo: string;
}

export function useRegularBlockData(refreshInterval = 2000) {
  return useQuery({
    queryKey: ["regularBlock"],
    queryFn: async (): Promise<BlockData> => {
      const client = getRegularClient();
      if (!client) {
        throw new Error("Client not initialized");
      }

      const blockNumber = await client.getBlockNumber();
      const block = await client.getBlock({
        blockNumber,
        includeTransactions: true,
      });

      const date = new Date(Number(block.timestamp) * 1000);
      const formattedTimestamp = date.toLocaleTimeString();
      const timeAgo = getTimeAgo(date);

      return {
        ...block,
        formattedTimestamp,
        timeAgo,
      };
    },
    refetchInterval: refreshInterval,
    enabled: typeof window !== "undefined", // Only run on client side
  });
}

export function useFlashblockData(refreshInterval = 200) {
  // Use the WebSocket hook for flashblock data
  const { latestBlock, connectionStatus } = useFlashblockWebSocket();
  
  return useQuery({
    queryKey: ["flashBlock", latestBlock?.payload_id, latestBlock?.index],
    queryFn: async (): Promise<BlockData> => {
      // If we have a latestBlock from WebSocket, convert it to our BlockData format
      if (latestBlock) {
        // Convert timestamp from hex to number if available
        const timestamp = latestBlock.base?.timestamp 
          ? BigInt(parseInt(latestBlock.base.timestamp, 16))
          : BigInt(Math.floor(Date.now() / 1000)); // Fallback to current time
        
        // Convert gas values from hex to bigint
        const gasUsed = latestBlock.diff.gas_used 
          ? BigInt(parseInt(latestBlock.diff.gas_used, 16))
          : BigInt(0);
          
        const gasLimit = latestBlock.base?.gas_limit
          ? BigInt(parseInt(latestBlock.base.gas_limit, 16))
          : BigInt(30000000); // Default max
          
        const date = new Date(Number(timestamp) * 1000);
        const formattedTimestamp = date.toLocaleTimeString();
        const timeAgo = getTimeAgo(date);
        
        return {
          number: BigInt(latestBlock.metadata.block_number),
          timestamp,
          hash: latestBlock.diff.block_hash as `0x${string}`,
          parentHash: (latestBlock.base?.parent_hash || "0x") as `0x${string}`,
          nonce: "0x0" as `0x${string}`, // Placeholder
          difficulty: BigInt(0), // Not relevant for PoS chains
          gasLimit,
          gasUsed,
          miner: (latestBlock.base?.fee_recipient || "0x") as `0x${string}`,
          extraData: (latestBlock.base?.extra_data || "0x") as `0x${string}`,
          baseFeePerGas: latestBlock.base?.base_fee_per_gas 
            ? BigInt(parseInt(latestBlock.base.base_fee_per_gas, 16))
            : null,
          transactions: latestBlock.diff.transactions, // Array of transaction hashes
          formattedTimestamp,
          timeAgo,
        };
      }
      
      // Fallback to regular client if WebSocket is not connected or no data
      if (connectionStatus !== "connected" || !latestBlock) {
        console.log("Falling back to regular client for flashblock data");
        
        // Use the regular client as fallback
        const client = getRegularClient();
        if (!client) {
          throw new Error("Client not initialized");
        }

        try {
          const blockNumber = await client.getBlockNumber();
          const block = await client.getBlock({
            blockNumber,
            includeTransactions: true,
          });

          const date = new Date(Number(block.timestamp) * 1000);
          const formattedTimestamp = date.toLocaleTimeString();
          const timeAgo = getTimeAgo(date);

          return {
            ...block,
            formattedTimestamp,
            timeAgo,
          };
        } catch (error: any) {
          console.error("Error fetching flashblock data:", error);
          throw error;
        }
      }
      
      throw new Error("No flashblock data available");
    },
    refetchInterval: refreshInterval,
    enabled: typeof window !== "undefined", // Only run on client side
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: 1000, // Wait 1 second between retries
  });
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) {
    return `${diffSec} second${diffSec !== 1 ? "s" : ""} ago`;
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  }

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return `${diffHour} hour${diffHour !== 1 ? "s" : ""} ago`;
  }

  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
}
