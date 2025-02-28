"use client";

import { useState, useEffect } from "react";
import {
  createWalletClient,
  custom,
  parseEther,
  createPublicClient,
  http,
} from "viem";
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

// Create clients for both networks
const regularPublicClient = createPublicClient({
  chain: baseSepolia,
  transport: http("https://sepolia.base.org"),
});

const flashblockPublicClient = createPublicClient({
  chain: baseSepoliaFlashblocks,
  transport: http("https://sepolia-preconf.base.org"),
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

  // Monitor transaction inclusion in blocks
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

    const checkInterval = setInterval(async () => {
      try {
        // First check if the transaction is already confirmed
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
            const confirmationTime = Date.now() - regularTxResult.sentTime!;
            console.log(
              `Regular block confirmation time: ${confirmationTime}ms`
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
          // Transaction not confirmed yet, continue checking pending blocks
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
          const confirmationTime = Date.now() - regularTxResult.sentTime!;
          console.log(`Regular block confirmation time: ${confirmationTime}ms`);

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
    }, 200);

    return () => clearInterval(checkInterval);
  }, [regularTxResult.hash, regularTxResult.status, regularTxResult.sentTime]);

  // Monitor transaction inclusion in flashblocks
  useEffect(() => {
    if (
      !flashblockTxResult.hash ||
      flashblockTxResult.status !== "pending" ||
      !flashblockTxResult.sentTime
    )
      return;

    console.log(
      "Starting to monitor flashblock transaction:",
      flashblockTxResult.hash
    );

    const checkInterval = setInterval(async () => {
      try {
        // First check if the transaction is already confirmed
        try {
          console.log(
            "Checking flashblock receipt for hash:",
            flashblockTxResult.hash
          );
          const receipt = await flashblockPublicClient.getTransactionReceipt({
            hash: flashblockTxResult.hash as `0x${string}`,
          });

          if (receipt) {
            console.log("Flashblock receipt found:", receipt);
            const confirmationTime = Date.now() - flashblockTxResult.sentTime!;
            console.log(`Flashblock confirmation time: ${confirmationTime}ms`);

            setFlashblockTxResult((prev) => ({
              ...prev,
              status: "success",
              confirmationTime,
              blockNumber: receipt.blockNumber,
            }));

            clearInterval(checkInterval);
            return;
          } else {
            console.log("No flashblock receipt found yet");
          }
        } catch (error) {
          console.log("Error checking flashblock receipt:", error);
          // Transaction not confirmed yet, continue checking pending blocks
        }

        // Check pending blocks
        console.log("Checking flashblock pending block");
        const block = await flashblockPublicClient.getBlock({
          blockTag: "pending",
          includeTransactions: true,
        });

        console.log(
          "Flashblock pending block:",
          block.number ? String(block.number) : "unknown",
          "with",
          block.transactions.length,
          "transactions"
        );

        const found = block.transactions.some(
          (tx: any) => tx.hash === flashblockTxResult.hash
        );

        if (found) {
          console.log("Found flashblock transaction in pending block");
          const confirmationTime = Date.now() - flashblockTxResult.sentTime!;
          console.log(`Flashblock confirmation time: ${confirmationTime}ms`);

          setFlashblockTxResult((prev) => ({
            ...prev,
            status: "success",
            confirmationTime,
            blockNumber: block.number,
          }));

          clearInterval(checkInterval);
        } else {
          console.log("Flashblock transaction not found in pending block");
        }
      } catch (error) {
        console.error("Error checking flashblock:", error);
      }
    }, 100); // Check more frequently for flashblocks

    return () => clearInterval(checkInterval);
  }, [
    flashblockTxResult.hash,
    flashblockTxResult.status,
    flashblockTxResult.sentTime,
  ]);

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

      // Create wallet client for flashblock network
      const flashblockWalletClient = createWalletClient({
        account,
        chain: baseSepoliaFlashblocks,
        transport: custom(window.ethereum),
      });

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

      // Send transaction to flashblock network
      const flashblockTxHash = await flashblockWalletClient.sendTransaction({
        to: address,
        value: parseEther(value),
      });

      console.log("Flashblock transaction hash:", flashblockTxHash);

      // Record the time when we got the transaction hash
      const sentTime = Date.now();
      console.log("Flashblock transaction sent time:", sentTime);

      // Update flashblock transaction result
      setFlashblockTxResult((prev) => ({
        ...prev,
        hash: flashblockTxHash,
        sentTime,
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

      // Send transaction to regular network
      const regularTxHash = await regularWalletClient.sendTransaction({
        to: address,
        value: parseEther(value),
      });

      console.log("Regular transaction hash:", regularTxHash);

      // Record the time when we got the transaction hash
      const sentTime = Date.now();
      console.log("Regular transaction sent time:", sentTime);

      // Update regular transaction result
      setRegularTxResult((prev) => ({
        ...prev,
        hash: regularTxHash,
        sentTime,
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
