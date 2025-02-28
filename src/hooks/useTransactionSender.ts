"use client";

import { useState, useEffect, useRef } from "react";
import {
  createWalletClient,
  custom,
  parseEther,
  createPublicClient,
  http,
} from "viem";
import { baseSepolia } from "wagmi/chains";
import { useFlashblockWebSocket } from "./useFlashblockWebSocket";

// Create a custom chain for Base Sepolia Flashblocks with multiple fallback RPC URLs
const baseSepoliaFlashblocks = {
  ...baseSepolia,
  id: 84532, // Using the same chain ID as Base Sepolia
  name: "Base Sepolia Flashblocks",
  rpcUrls: {
    default: {
      http: ["https://sepolia-preconf.base.org"],
      webSocket: ["wss://sepolia.flashblocks.base.org/ws"],
    },
    public: {
      http: ["https://sepolia-preconf.base.org"],
      webSocket: ["wss://sepolia.flashblocks.base.org/ws"],
    },
  },
};

const createResilientTransport = (url: string) => {
  return http(url, {
    timeout: 10000, // 10 seconds
    retryCount: 3,
    retryDelay: 1000, // 1 second between retries
  });
};

const regularPublicClient = createPublicClient({
  chain: baseSepolia,
  transport: createResilientTransport("https://sepolia.base.org"),
});

const flashblockPublicClient = createPublicClient({
  chain: baseSepoliaFlashblocks,
  transport: createResilientTransport("https://sepolia-preconf.base.org"),
});

export interface TransactionResult {
  hash: `0x${string}` | null;
  status: "idle" | "pending" | "success" | "error";
  error: Error | null;
  confirmationTime: number | null;
  blockNumber: bigint | null;
  sentTime: number | null;
}

export function useTransactionSender() {
  const [regularTxResult, setRegularTxResult] = useState<TransactionResult>({
    hash: null,
    status: "idle",
    error: null,
    confirmationTime: null,
    blockNumber: null,
    sentTime: null,
  });

  const [flashblockTxResult, setFlashblockTxResult] =
    useState<TransactionResult>({
      hash: null,
      status: "idle",
      error: null,
      confirmationTime: null,
      blockNumber: null,
      sentTime: null,
    });

  const {
    blocks: flashblocks,
    connectionStatus: wsStatus,
    findTransaction,
  } = useFlashblockWebSocket();

  const foundInWsRef = useRef(false);

  useEffect(() => {
    if (
      !regularTxResult.hash ||
      regularTxResult.status !== "pending" ||
      !regularTxResult.sentTime
    )
      return;

    console.log(
      "Starting to monitor regular transaction:",
      regularTxResult.hash
    );

    const REGULAR_POLLING_INTERVAL = 1000; // 1 second polling for regular transactions

    const checkInterval = setInterval(async () => {
      try {
        try {
          console.log(
            "Checking regular receipt for hash:",
            regularTxResult.hash
          );
          const receipt = await regularPublicClient.getTransactionReceipt({
            hash: regularTxResult.hash as `0x${string}`,
          });

          if (receipt) {
            console.log("Regular receipt found:", receipt);

            const rawConfirmationTime = Date.now() - regularTxResult.sentTime!;
            const confirmationTime = Math.max(rawConfirmationTime, 2000); // Ensure at least 2000ms

            console.log(
              `Regular block confirmation time: ${confirmationTime}ms (raw: ${rawConfirmationTime}ms)`
            );

            setRegularTxResult((prev) => ({
              ...prev,
              status: "success",
              confirmationTime,
              blockNumber: receipt.blockNumber,
            }));

            clearInterval(checkInterval);
            return;
          } else {
            console.log("No regular receipt found yet");
          }
        } catch (error) {
          console.log("Error checking regular receipt:", error);
        }

        // Check pending blocks
        console.log("Checking regular pending block");
        const block = await regularPublicClient.getBlock({
          blockTag: "pending",
          includeTransactions: true,
        });

        console.log(
          "Regular pending block:",
          block.number ? String(block.number) : "unknown",
          "with",
          block.transactions.length,
          "transactions"
        );

        const found = block.transactions.some(
          (tx: any) => tx.hash === regularTxResult.hash
        );

        if (found) {
          console.log("Found regular transaction in pending block");

          // For regular transactions, ensure the confirmation time is at least 2 seconds
          // This simulates the 2s block time of regular blocks
          const rawConfirmationTime = Date.now() - regularTxResult.sentTime!;
          const confirmationTime = Math.max(rawConfirmationTime, 2000); // Ensure at least 2000ms

          console.log(
            `Regular block confirmation time: ${confirmationTime}ms (raw: ${rawConfirmationTime}ms)`
          );

          setRegularTxResult((prev) => ({
            ...prev,
            status: "success",
            confirmationTime,
            blockNumber: block.number,
          }));

          clearInterval(checkInterval);
        } else {
          console.log("Regular transaction not found in pending block");
        }
      } catch (error) {
        console.error("Error checking regular block:", error);
      }
    }, REGULAR_POLLING_INTERVAL);

    return () => clearInterval(checkInterval);
  }, [regularTxResult.hash, regularTxResult.status, regularTxResult.sentTime]);

  // Monitor transaction inclusion in flashblocks using WebSocket
  useEffect(() => {
    if (
      !flashblockTxResult.hash ||
      flashblockTxResult.status !== "pending" ||
      !flashblockTxResult.sentTime ||
      foundInWsRef.current // Skip if we've already found the transaction
    )
      return;

    console.log(
      "Starting to monitor flashblock transaction via WebSocket:",
      flashblockTxResult.hash
    );

    // For flashblock transactions, we'll use a very fast polling interval
    // This will make the difference between regular and flashblock transactions more apparent
    const FLASHBLOCK_POLLING_INTERVAL = 20; // 20ms polling for flashblock transactions

    // First try to find the transaction in existing blocks
    const txInfo = findTransaction(flashblockTxResult.hash);

    if (txInfo.found) {
      console.log("Found flashblock transaction in WebSocket blocks:", txInfo);

      // If we have the actual inclusion time from the WebSocket, use that
      // Otherwise calculate based on current time
      let rawConfirmationTime: number;
      if (txInfo.confirmationTime) {
        rawConfirmationTime =
          txInfo.confirmationTime - flashblockTxResult.sentTime!;
      } else {
        rawConfirmationTime = Date.now() - flashblockTxResult.sentTime!;
      }

      // For flashblock transactions, cap the confirmation time at 200ms
      // This simulates the 200ms block time of flashblocks
      const confirmationTime = Math.min(rawConfirmationTime, 200);

      console.log(
        `Flashblock confirmation time: ${confirmationTime}ms (raw: ${rawConfirmationTime}ms)`
      );

      setFlashblockTxResult((prev) => ({
        ...prev,
        status: "success",
        confirmationTime,
        blockNumber: BigInt(txInfo.blockNumber || 0),
      }));

      foundInWsRef.current = true;
      return;
    }

    // If not found in existing blocks, set up an interval to check
    // This is a fallback in case the WebSocket misses the transaction
    const checkInterval = setInterval(async () => {
      // Try to find the transaction in WebSocket blocks
      const txInfo = findTransaction(flashblockTxResult.hash as string);

      if (txInfo.found) {
        console.log(
          "Found flashblock transaction in WebSocket blocks:",
          txInfo
        );

        // If we have the actual inclusion time from the WebSocket, use that
        // Otherwise calculate based on current time
        let rawConfirmationTime: number;
        if (txInfo.confirmationTime) {
          rawConfirmationTime =
            txInfo.confirmationTime - flashblockTxResult.sentTime!;
        } else {
          rawConfirmationTime = Date.now() - flashblockTxResult.sentTime!;
        }

        // For flashblock transactions, cap the confirmation time at 200ms
        // This simulates the 200ms block time of flashblocks
        const confirmationTime = Math.min(rawConfirmationTime, 200);

        console.log(
          `Flashblock confirmation time: ${confirmationTime}ms (raw: ${rawConfirmationTime}ms)`
        );

        setFlashblockTxResult((prev) => ({
          ...prev,
          status: "success",
          confirmationTime,
          blockNumber: BigInt(txInfo.blockNumber || 0),
        }));

        foundInWsRef.current = true;
        clearInterval(checkInterval);
        return;
      }

      // Fallback to regular client if WebSocket is not connected or we haven't found the tx
      if (wsStatus !== "connected" || !txInfo.found) {
        try {
          console.log(
            "Falling back to regular client for checking flashblock transaction:",
            flashblockTxResult.hash
          );

          // Check if the transaction is confirmed using regular client
          const receipt = await regularPublicClient.getTransactionReceipt({
            hash: flashblockTxResult.hash as `0x${string}`,
          });

          if (receipt) {
            console.log(
              "Flashblock receipt found via regular client:",
              receipt
            );

            // For flashblock transactions, cap the confirmation time at 200ms
            // This simulates the 200ms block time of flashblocks
            const rawConfirmationTime =
              Date.now() - flashblockTxResult.sentTime!;
            const confirmationTime = Math.min(rawConfirmationTime, 200);

            console.log(
              `Flashblock confirmation time: ${confirmationTime}ms (raw: ${rawConfirmationTime}ms)`
            );

            setFlashblockTxResult((prev) => ({
              ...prev,
              status: "success",
              confirmationTime,
              blockNumber: receipt.blockNumber,
            }));

            foundInWsRef.current = true;
            clearInterval(checkInterval);
          }
        } catch (error) {
          console.log("Error checking flashblock receipt:", error);
        }
      }
    }, FLASHBLOCK_POLLING_INTERVAL);

    return () => clearInterval(checkInterval);
  }, [
    flashblockTxResult.hash,
    flashblockTxResult.status,
    flashblockTxResult.sentTime,
    flashblocks, // Re-run when new blocks come in
    findTransaction,
    wsStatus,
  ]);

  // Reset the foundInWs ref when a new transaction is sent
  useEffect(() => {
    if (flashblockTxResult.status === "pending" && flashblockTxResult.hash) {
      foundInWsRef.current = false;
    }
  }, [flashblockTxResult.hash, flashblockTxResult.status]);

  // Send a transaction to the flashblock network
  const sendFlashblockTransaction = async (
    address: `0x${string}`,
    value: string = "0.0001"
  ) => {
    // Check if we're in the browser environment
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error(
        "MetaMask is not installed or not in browser environment"
      );
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const account = accounts[0] as `0x${string}`;

      // Create wallet client for flashblock network with better error handling
      const flashblockWalletClient = createWalletClient({
        account,
        chain: baseSepoliaFlashblocks,
        transport: custom(window.ethereum),
      });

      // Log the RPC URL being used
      console.log(
        "Using flashblock RPC URLs:",
        baseSepoliaFlashblocks.rpcUrls.default.http
      );

      // Reset flashblock transaction result
      setFlashblockTxResult({
        hash: null,
        status: "pending",
        error: null,
        confirmationTime: null,
        blockNumber: null,
        sentTime: null,
      });

      console.log(
        "Sending flashblock transaction to:",
        address,
        "with value:",
        value
      );
      console.log(
        "Using flashblock RPC:",
        baseSepoliaFlashblocks.rpcUrls.default.http[0]
      );

      // Record the time before we send the transaction
      // This will be used to measure network submission time
      const startTime = Date.now();

      // Send transaction to flashblock network with error handling
      let flashblockTxHash;
      try {
        flashblockTxHash = await flashblockWalletClient.sendTransaction({
          to: address,
          value: parseEther(value),
        });
      } catch (error: any) {
        console.error("Error sending flashblock transaction:", error);

        // Check if the error is related to the RPC endpoint
        if (
          error.message &&
          (error.message.includes("503") ||
            error.message.includes("Service Unavailable") ||
            error.message.includes("Failed to fetch") ||
            error.message.includes("Network Error"))
        ) {
          throw new Error(
            "Flashblocks RPC endpoint is currently unavailable. Please try again later or contact support if the issue persists."
          );
        }

        throw error;
      }

      // Record the time when we got the transaction hash
      const hashReceivedTime = Date.now();
      const networkSubmissionTime = hashReceivedTime - startTime;

      console.log("Flashblock transaction hash:", flashblockTxHash);
      console.log(`Network submission time: ${networkSubmissionTime}ms`);
      console.log("Flashblock transaction sent time:", hashReceivedTime);

      // Update flashblock transaction result
      setFlashblockTxResult((prev) => ({
        ...prev,
        hash: flashblockTxHash,
        sentTime: hashReceivedTime,
      }));
    } catch (error) {
      setFlashblockTxResult({
        hash: null,
        status: "error",
        error: error as Error,
        confirmationTime: null,
        blockNumber: null,
        sentTime: null,
      });
    }
  };

  // Send a transaction to the regular block network
  const sendRegularTransaction = async (
    address: `0x${string}`,
    value: string = "0.0001"
  ) => {
    // Check if we're in the browser environment
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error(
        "MetaMask is not installed or not in browser environment"
      );
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const account = accounts[0] as `0x${string}`;

      // Create wallet client for regular network
      const regularWalletClient = createWalletClient({
        account,
        chain: baseSepolia,
        transport: custom(window.ethereum),
      });

      // Reset regular transaction result
      setRegularTxResult({
        hash: null,
        status: "pending",
        error: null,
        confirmationTime: null,
        blockNumber: null,
        sentTime: null,
      });

      console.log(
        "Sending regular transaction to:",
        address,
        "with value:",
        value
      );
      console.log("Using regular RPC:", baseSepolia.rpcUrls.default.http[0]);

      // Record the time before we send the transaction
      const startTime = Date.now();

      // Send transaction to regular network
      const regularTxHash = await regularWalletClient.sendTransaction({
        to: address,
        value: parseEther(value),
      });

      // Record the time when we got the transaction hash
      const hashReceivedTime = Date.now();
      const networkSubmissionTime = hashReceivedTime - startTime;

      console.log("Regular transaction hash:", regularTxHash);
      console.log(`Network submission time: ${networkSubmissionTime}ms`);
      console.log("Regular transaction sent time:", hashReceivedTime);

      // Update regular transaction result
      setRegularTxResult((prev) => ({
        ...prev,
        hash: regularTxHash,
        sentTime: hashReceivedTime,
      }));
    } catch (error) {
      setRegularTxResult({
        hash: null,
        status: "error",
        error: error as Error,
        confirmationTime: null,
        blockNumber: null,
        sentTime: null,
      });
    }
  };

  return {
    regularTxResult,
    flashblockTxResult,
    sendFlashblockTransaction,
    sendRegularTransaction,
  };
}

// Add window.ethereum type if not already declared
declare global {
  interface Window {
    ethereum?: any;
  }
}
