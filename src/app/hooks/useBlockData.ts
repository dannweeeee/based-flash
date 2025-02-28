"use client";

import { useQuery } from "@tanstack/react-query";
import { createPublicClient, http, formatEther } from "viem";
import { baseSepolia } from "wagmi/chains";

// Create a custom chain for Base Sepolia Flashblocks
const baseSepoliaFlashblocks = {
  ...baseSepolia,
  id: 84532, // Using the same chain ID as Base Sepolia
  name: "Base Sepolia Flashblocks",
  rpcUrls: {
    default: {
      http: ["https://sepolia-preconf.base.org"],
    },
    public: {
      http: ["https://sepolia-preconf.base.org"],
    },
  },
};

// Create a more resilient transport with retries and timeout
const createResilientTransport = (url: string) => {
  return http(url, {
    timeout: 10000, // 10 seconds
    retryCount: 3,
    retryDelay: 1000, // 1 second between retries
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
    flashblockClient = createPublicClient({
      chain: baseSepoliaFlashblocks,
      transport: createResilientTransport("https://sepolia-preconf.base.org"),
    });
    console.log("Created flashblock client with HTTP transport in useBlockData");
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
  return useQuery({
    queryKey: ["flashBlock"],
    queryFn: async (): Promise<BlockData> => {
      const client = getFlashblockClient();
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
