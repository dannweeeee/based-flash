"use client";

import { useState } from "react";
import {
  useTransactionSender,
  TransactionResult,
} from "../hooks/useTransactionSender";
import { useNFTMinter } from "../hooks/useNFTMinter";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import TimeImage from "./TimeImage";

export default function TransactionSender() {
  // Fixed recipient address
  const RECIPIENT_ADDRESS = "0xaB04C858BA34D5A6A69A613B8D14B99665F08B95";
  const AMOUNT = "0.0001"; // Fixed amount
  const [timeImageUrl, setTimeImageUrl] = useState<string | null>(null);
  const {
    regularTxResult,
    flashblockTxResult,
    sendFlashblockTransaction,
    sendRegularTransaction,
  } = useTransactionSender();
  const { result: nftResult, mintNFT } = useNFTMinter();

  // Wallet connection
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    connect({ connector: injected() });
  };

  const handleDisconnect = () => {
    disconnect();
  };

  // Handle sending a flashblock transaction
  const handleSendFlashblockTransaction = async () => {
    try {
      // Reset the time image URL when sending a new transaction
      setTimeImageUrl(null);
      await sendFlashblockTransaction(
        RECIPIENT_ADDRESS as `0x${string}`,
        AMOUNT
      );
    } catch (error) {
      console.error("Error sending flashblock transaction:", error);
    }
  };

  // Handle sending a regular block transaction
  const handleSendRegularTransaction = async () => {
    try {
      // Reset the time image URL when sending a new transaction
      setTimeImageUrl(null);
      await sendRegularTransaction(RECIPIENT_ADDRESS as `0x${string}`, AMOUNT);
    } catch (error) {
      console.error("Error sending regular transaction:", error);
    }
  };

  const handleImageGenerated = (imageUrl: string) => {
    setTimeImageUrl(imageUrl);
  };

  const handleMintNFT = async () => {
    if (flashblockTxResult.confirmationTime && timeImageUrl) {
      try {
        await mintNFT(flashblockTxResult.confirmationTime, timeImageUrl);
      } catch (error) {
        console.error("Error minting NFT:", error);
      }
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Send Test Transactions</h2>

        {isConnected ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 truncate max-w-[120px] md:max-w-[200px]">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <button
              onClick={handleDisconnect}
              className="text-sm bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
          >
            Connect Wallet
          </button>
        )}
      </div>

      {isConnected ? (
        <>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="recipient"
                className="block text-sm font-medium mb-1"
              >
                Recipient Address
              </label>
              <input
                id="recipient"
                type="text"
                value={RECIPIENT_ADDRESS}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              />
              <p className="mt-1 text-xs text-gray-500">
                Fixed recipient address for this demo
              </p>
            </div>

            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium mb-1"
              >
                Amount (ETH)
              </label>
              <input
                id="amount"
                type="text"
                value={AMOUNT}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              />
              <p className="mt-1 text-xs text-gray-500">
                Fixed amount for this demo
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <button
                    onClick={handleSendFlashblockTransaction}
                    disabled={flashblockTxResult.status === "pending"}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {flashblockTxResult.status === "pending"
                      ? "Sending Flashblock Tx..."
                      : "Send Flashblock Transaction"}
                  </button>
                  <p className="mt-1 text-xs text-center text-blue-600">
                    Expected: ~200ms
                  </p>
                </div>

                <div>
                  <button
                    onClick={handleSendRegularTransaction}
                    disabled={regularTxResult.status === "pending"}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {regularTxResult.status === "pending"
                      ? "Sending Regular Tx..."
                      : "Send Regular Transaction"}
                  </button>
                  <p className="mt-1 text-xs text-center text-purple-600">
                    Expected: ~2000ms
                  </p>
                </div>
              </div>

              <div className="text-xs text-gray-500 text-center">
                <p>
                  Note: Actual transaction speeds may vary based on network
                  conditions.
                </p>
                <p>
                  Flashblocks should be approximately 10x faster than regular
                  blocks.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <TransactionResultCard
              title="Flashblock (200ms)"
              result={flashblockTxResult}
            />

            <TransactionResultCard
              title="Regular Block (2s)"
              result={regularTxResult}
            />

            {regularTxResult.status === "success" &&
              flashblockTxResult.status === "success" &&
              regularTxResult.confirmationTime &&
              flashblockTxResult.confirmationTime && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-900/30">
                  <p className="font-bold text-green-700 dark:text-green-400 text-center">
                    Speed Improvement:{" "}
                    {(
                      regularTxResult.confirmationTime /
                      flashblockTxResult.confirmationTime
                    ).toFixed(1)}
                    x faster with Flashblocks
                  </p>
                </div>
              )}
          </div>

          {flashblockTxResult.confirmationTime && (
            <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">
                Mint Transaction Speed NFT
              </h3>
              <p className="mb-4">
                Create an NFT with your Flashblock transaction speed:{" "}
                {flashblockTxResult.confirmationTime}ms
              </p>

              {flashblockTxResult.confirmationTime && (
                <div className="mb-4">
                  <TimeImage
                    time={flashblockTxResult.confirmationTime}
                    width={300}
                    height={300}
                    onImageGenerated={handleImageGenerated}
                  />
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <button
                    onClick={handleMintNFT}
                    disabled={
                      nftResult.status === "generating" ||
                      nftResult.status === "minting"
                    }
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {nftResult.status === "generating"
                      ? "Generating Image..."
                      : nftResult.status === "minting"
                      ? "Minting NFT..."
                      : "Mint NFT with Transaction Speed"}
                  </button>

                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">What happens:</h4>
                    <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>
                        Creates a unique image with your transaction speed
                      </li>
                      <li>Mints an NFT on Base Sepolia with this image</li>
                      <li>Each mint creates a different visual design</li>
                    </ol>
                  </div>
                </div>

                {nftResult.status === "success" && nftResult.imageUrl ? (
                  <div className="flex-1 flex flex-col items-center">
                    <p className="text-green-600 dark:text-green-400 mb-2 font-semibold">
                      NFT Minted Successfully!
                    </p>
                    <div className="aspect-square max-w-[200px] mx-auto border-4 border-green-500 dark:border-green-700 rounded-md overflow-hidden shadow-lg">
                      <img
                        src={nftResult.imageUrl}
                        alt="NFT Image"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {nftResult.transactionHash && (
                      <a
                        href={`https://sepolia.basescan.org/tx/${nftResult.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 text-center text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <span>View on BaseScan</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </a>
                    )}
                  </div>
                ) : nftResult.status === "error" ? (
                  <div className="flex-1 p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
                    <p className="text-red-600 dark:text-red-400 font-semibold">
                      Error Minting NFT
                    </p>
                    <p className="text-sm mt-1">{nftResult.error?.message}</p>
                  </div>
                ) : nftResult.status === "generating" ||
                  nftResult.status === "minting" ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
                    <p className="text-center">
                      {nftResult.status === "generating"
                        ? "Creating your unique NFT image..."
                        : "Minting your NFT..."}
                    </p>
                  </div>
                ) : null}
              </div>

              {nftResult.status === "error" && (
                <div className="mt-4 text-red-500 p-4 rounded-md bg-red-50 dark:bg-red-900/20">
                  Error: {nftResult.error?.message}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center p-8 text-gray-500">
          Please connect your wallet to send transactions and mint NFTs
        </div>
      )}
    </div>
  );
}

interface TransactionResultCardProps {
  title: string;
  result: TransactionResult;
}

function TransactionResultCard({ title, result }: TransactionResultCardProps) {
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>

      {result.status === "idle" && (
        <p className="text-gray-500">No transaction sent yet</p>
      )}

      {result.status === "pending" && (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
          <span>Transaction pending...</span>
        </div>
      )}

      {result.status === "error" && (
        <div className="text-red-500">Error: {result.error?.message}</div>
      )}

      {result.status === "success" && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Transaction Hash</span>
            <a
              href={`https://sepolia.basescan.org/tx/${result.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline truncate max-w-[200px]"
            >
              {result.hash?.slice(0, 10)}...{result.hash?.slice(-8)}
            </a>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Block Number</span>
            <span>{result.blockNumber?.toString()}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Transaction Speed</span>
            <div className="flex flex-col items-end">
              <span className="font-bold">{result.confirmationTime}ms</span>
              <span className="text-xs text-gray-500">
                ({(result.confirmationTime! / 1000).toFixed(2)}s from sending)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
