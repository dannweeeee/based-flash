"use client";

import { useState, useEffect, useRef } from "react";

// Define the type for the flashblock data
export interface FlashBlockData {
  payload_id: string;
  index: number;
  base?: {
    parent_beacon_block_root: string;
    parent_hash: string;
    fee_recipient: string;
    prev_randao: string;
    block_number: string;
    gas_limit: string;
    timestamp: string;
    extra_data: string;
    base_fee_per_gas: string;
  };
  diff: {
    state_root: string;
    receipts_root: string;
    logs_bloom: string;
    gas_used: string;
    block_hash: string;
    transactions: string[];
    withdrawals: unknown[];
  };
  metadata: {
    block_number: number;
    new_account_balances: Record<string, string>;
    receipts: Record<
      string,
      {
        Eip1559?: {
          cumulativeGasUsed: string;
          logs: Array<{
            address: string;
            data: string;
            topics: string[];
          }>;
          status: string;
        };
        Deposit?: {
          cumulativeGasUsed: string;
          depositNonce: string;
          depositReceiptVersion: string;
          logs: unknown[];
          status: string;
        };
      }
    >;
  };
}

export function useFlashblockWebSocket() {
  const [blocks, setBlocks] = useState<FlashBlockData[]>([]);
  const [latestBlock, setLatestBlock] = useState<FlashBlockData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "error"
  >("connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pauseUpdates, setPauseUpdates] = useState(false);

  // Use a ref to access the latest pauseUpdates state in the WebSocket callbacks
  const pauseUpdatesRef = useRef(pauseUpdates);
  useEffect(() => {
    pauseUpdatesRef.current = pauseUpdates;
  }, [pauseUpdates]);

  useEffect(() => {
    let websocketClient: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    // Function to create and setup WebSocket
    const setupWebSocket = () => {
      setConnectionStatus("connecting");
      setErrorMessage(null);

      try {
        websocketClient = new WebSocket("wss://sepolia.flashblocks.base.org/ws");

        websocketClient.onopen = () => {
          setConnectionStatus("connected");
          console.log("WebSocket connection established");
        };

        websocketClient.onmessage = (event) => {
          // Get the current pause state immediately when message arrives
          const isPaused = pauseUpdatesRef.current;

          if (event.data instanceof Blob) {
            // Record the exact time we received this block
            const blockReceivedTime = Date.now();
            
            const reader = new FileReader();
            reader.onload = (event) => {
              // Store the raw data for processing
              const rawData = event.target?.result as string;

              // If updates are completely paused, don't process anything
              if (isPaused) {
                console.log("Skipping all block processing while paused");
                return;
              }

              try {
                const data = JSON.parse(rawData) as FlashBlockData;
                
                // Add the received time to the block data for accurate timing
                const enhancedData = {
                  ...data,
                  _receivedTime: blockReceivedTime
                };

                // Store genesis blocks for reference
                if (data.index === 0) {
                  console.log("Processing genesis block");
                  setLatestBlock(enhancedData);
                } else {
                  setLatestBlock(enhancedData);
                }

                // Add new block to the beginning of the array and limit to 20 blocks
                setBlocks((prevBlocks) => {
                  // Check if we already have this block by payload_id and index
                  const exists = prevBlocks.some(
                    (block) =>
                      block.payload_id === data.payload_id &&
                      block.index === data.index
                  );

                  if (exists) return prevBlocks;

                  const newBlocks = [enhancedData, ...prevBlocks];
                  // Limit array size to prevent memory issues
                  return newBlocks.slice(0, 20);
                });
                
                // Process transactions in this block immediately
                processBlockTransactions(enhancedData, blockReceivedTime);
                
              } catch (error) {
                console.error("Error parsing WebSocket data:", error);
              }
            };
            reader.readAsText(event.data);
          }
        };

        websocketClient.onclose = (event) => {
          console.warn("WebSocket closed, attempting to reconnect...", event);
          setConnectionStatus("error");
          setErrorMessage("Connection closed. Attempting to reconnect...");

          // Try to reconnect after a delay
          if (reconnectTimeout) clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(setupWebSocket, 5000);
        };

        websocketClient.onerror = (error) => {
          console.error("WebSocket error:", error);
          setConnectionStatus("error");
          setErrorMessage("Connection error. Attempting to reconnect...");

          // Force close and try to reconnect
          websocketClient?.close();
        };
      } catch (error) {
        console.error("Error setting up WebSocket:", error);
        setConnectionStatus("error");
        setErrorMessage("Failed to connect. Will retry in 5 seconds...");

        // Try to reconnect after a delay
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(setupWebSocket, 5000);
      }
    };

    // Initial WebSocket setup
    setupWebSocket();

    // Cleanup on component unmount
    return () => {
      if (websocketClient) {
        websocketClient.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  // Keep a map of transaction hashes to their inclusion times for faster lookups
  const [txInclusionMap, setTxInclusionMap] = useState<Record<string, {
    blockNumber: number;
    timestamp: number;
    inclusionTime: number;
  }>>({});
  
  // Process transactions in a block and update the inclusion map
  const processBlockTransactions = (block: FlashBlockData & { _receivedTime?: number }, receivedTime: number) => {
    if (!block.diff.transactions.length) return;
    
    // Use the block's received time or current time
    const blockReceivedTime = block._receivedTime || receivedTime;
    
    // Get the block timestamp
    const blockTimestamp = block.base?.timestamp 
      ? parseInt(block.base.timestamp, 16) * 1000 
      : blockReceivedTime;
    
    // Process each transaction
    const newTxs: Record<string, {
      blockNumber: number;
      timestamp: number;
      inclusionTime: number;
    }> = {};
    
    block.diff.transactions.forEach(txHash => {
      // Only add if we haven't seen this transaction before
      if (!txInclusionMap[txHash]) {
        newTxs[txHash] = {
          blockNumber: block.metadata.block_number,
          timestamp: blockTimestamp,
          inclusionTime: blockReceivedTime
        };
        
        console.log(`Transaction ${txHash.substring(0, 10)}... included in block ${block.metadata.block_number}`);
      }
    });
    
    // If we have new transactions, update the map
    if (Object.keys(newTxs).length > 0) {
      setTxInclusionMap(prev => ({
        ...prev,
        ...newTxs
      }));
    }
  };

  // Helper function to find a transaction in the blocks with improved performance
  const findTransaction = (txHash: string): { 
    found: boolean; 
    blockNumber?: number; 
    timestamp?: number;
    confirmationTime?: number;
  } => {
    // First check our transaction map for a fast lookup
    if (txInclusionMap[txHash]) {
      return {
        found: true,
        blockNumber: txInclusionMap[txHash].blockNumber,
        timestamp: txInclusionMap[txHash].timestamp,
        confirmationTime: txInclusionMap[txHash].inclusionTime
      };
    }
    
    // If not in our map, check the blocks directly
    // This is a fallback in case the transaction was included before we started tracking
    for (const block of blocks) {
      const found = block.diff.transactions.some(tx => tx === txHash);
      if (found) {
        // Add to our map for future lookups
        const now = Date.now();
        const blockTimestamp = block.base?.timestamp 
          ? parseInt(block.base.timestamp, 16) * 1000 
          : now;
          
        setTxInclusionMap(prev => ({
          ...prev,
          [txHash]: {
            blockNumber: block.metadata.block_number,
            timestamp: blockTimestamp,
            inclusionTime: now
          }
        }));
        
        return { 
          found: true, 
          blockNumber: block.metadata.block_number,
          timestamp: blockTimestamp
        };
      }
    }
    
    return { found: false };
  };

  return {
    blocks,
    latestBlock,
    connectionStatus,
    errorMessage,
    pauseUpdates,
    setPauseUpdates,
    findTransaction
  };
}
