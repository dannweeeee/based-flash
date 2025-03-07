"use client";

import { useState, useCallback } from "react";
import {
  createWalletClient,
  custom,
  encodeFunctionData,
  createPublicClient,
  http,
} from "viem";
import { baseSepolia } from "wagmi/chains";
import { NFT_CONTRACT_ADDRESS } from "@/constants";

// Simple NFT contract ABI for minting
const NFT_ABI = [
  {
    inputs: [{ internalType: "string", name: "tokenURI", type: "string" }],
    name: "mintNFT",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export interface NFTMintResult {
  status: "idle" | "generating" | "minting" | "success" | "error";
  error: Error | null;
  tokenId: bigint | null;
  transactionHash: `0x${string}` | null;
  imageUrl: string | null;
  mintTime: number | null;
}

export function useNFTMinter() {
  const initialState: NFTMintResult = {
    status: "idle",
    error: null,
    tokenId: null,
    transactionHash: null,
    imageUrl: null,
    mintTime: null,
  };

  const [result, setResult] = useState<NFTMintResult>(initialState);

  // Function to reset the NFT minter state
  const resetNFTState = useCallback(() => {
    setResult(initialState);
  }, []);

  const mintNFT = async (time: number, imageUrl: string) => {
    console.log("mintNFT called with time:", time, "ms");

    if (typeof window === "undefined" || !window.ethereum) {
      console.error("MetaMask not available");
      setResult({
        status: "error",
        error: new Error(
          "MetaMask is not installed or not in browser environment"
        ),
        tokenId: null,
        transactionHash: null,
        imageUrl: null,
        mintTime: null,
      });
      return;
    }

    try {
      console.log("Setting status to minting");
      setResult({
        status: "minting",
        error: null,
        tokenId: null,
        transactionHash: null,
        imageUrl,
        mintTime: null,
      });

      // Create a simplified metadata JSON
      // Instead of embedding the full image data, we'll use a placeholder
      // This significantly reduces the metadata size
      const metadata = {
        name: `Flashblocks Time NFT: ${time}ms`,
        description: `This NFT represents a transaction that took ${time}ms to confirm on Base Sepolia Flashblocks.`,
        image: "data:image/png;base64,TIME_IMAGE_PLACEHOLDER", // Placeholder that would be replaced by a real URL in production
        attributes: [
          {
            trait_type: "Confirmation Time",
            value: time.toString(),
          },
          {
            trait_type: "Network",
            value: "Base Sepolia Flashblocks",
          },
          {
            trait_type: "Created",
            value: new Date().toISOString(),
          },
        ],
      };

      // Create a much smaller metadata URL
      const metadataUrl = `data:application/json,${encodeURIComponent(
        JSON.stringify(metadata)
      )}`;

      console.log("Requesting account access");
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Got accounts:", accounts);
      const account = accounts[0] as `0x${string}`;

      console.log("Creating wallet client");
      // Create wallet client
      const walletClient = createWalletClient({
        account,
        chain: baseSepolia, // Use regular Base Sepolia instead of Flashblocks for NFT minting
        transport: custom(window.ethereum),
      });
      console.log("Wallet client created");

      console.log("Creating transaction data");
      // Create transaction data
      const data = encodeFunctionData({
        abi: NFT_ABI,
        functionName: "mintNFT",
        args: [metadataUrl],
      });
      console.log("Transaction data created");

      const startTime = Date.now();

      console.log("Sending transaction to contract:", NFT_CONTRACT_ADDRESS);
      // Send transaction
      const hash = await walletClient.sendTransaction({
        to: NFT_CONTRACT_ADDRESS as `0x${string}`,
        data,
        chain: baseSepolia, // Use regular Base Sepolia instead of Flashblocks for NFT minting
      });
      console.log("Transaction sent with hash:", hash);

      // Create public client
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http("https://sepolia.base.org"),
      });

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
      });

      const endTime = Date.now();
      // Use the actual time it took to mint the NFT
      const mintTime = endTime - startTime;

      // In a real app, you would parse the logs to get the token ID
      // For this demo, we'll just use a random number
      const tokenId = BigInt(Math.floor(Math.random() * 1000));

      setResult({
        status: "success",
        error: null,
        tokenId,
        transactionHash: hash,
        imageUrl,
        mintTime,
      });
    } catch (error) {
      console.error("NFT Minting Error:", error);
      setResult({
        status: "error",
        error: error as Error,
        tokenId: null,
        transactionHash: null,
        imageUrl: result.imageUrl, // Keep the image URL if we generated one
        mintTime: null,
      });
    }
  };

  return {
    result,
    mintNFT,
    resetNFTState,
  };
}
