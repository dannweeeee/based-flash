"use client";

import { useState } from "react";
import { useNFTMinter } from "../hooks/useNFTMinter";
import TimeImage from "./TimeImage";
import { motion } from "framer-motion";

interface NFTMinterProps {
  flashTime: number | null;
  sentTime: number | null;
}

export default function NFTMinter({ flashTime, sentTime }: NFTMinterProps) {
  // Calculate the confirmation time (time difference)
  const confirmationTime = flashTime && sentTime ? flashTime - sentTime : null; // Actual time difference without capping
  const { result: nftResult, mintNFT } = useNFTMinter();
  const [timeImageUrl, setTimeImageUrl] = useState<string | null>(null);

  const handleImageGenerated = (imageUrl: string) => {
    setTimeImageUrl(imageUrl);
  };

  const handleMintNFT = async () => {
    if (confirmationTime && timeImageUrl) {
      try {
        await mintNFT(confirmationTime, timeImageUrl);
      } catch (error) {
        console.error("Error minting NFT:", error);
      }
    }
  };

  if (!flashTime || !sentTime || !confirmationTime) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-10 p-8 bg-gradient-to-br from-white/90 to-green-50/80 dark:from-gray-800/90 dark:to-green-900/10 border border-green-100 dark:border-green-900/50 rounded-xl shadow-xl backdrop-blur-sm"
    >
      <motion.h3
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-2xl font-bold mb-6 text-green-700 dark:text-green-300 text-center"
      >
        Mint Your Transaction Speed NFT
      </motion.h3>

      {nftResult.status !== "success" ? (
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="flex items-center justify-center mb-6"
          >
            <div className="bg-white/80 dark:bg-gray-800/80 px-6 py-3 rounded-full shadow-md backdrop-blur-sm">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-mono font-bold text-green-600 dark:text-green-400"
              >
                {confirmationTime}ms
              </motion.span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8 flex justify-center"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/90 dark:bg-gray-800/90 p-3 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-xl"
            >
              <TimeImage
                time={confirmationTime}
                width={300}
                height={300}
                onImageGenerated={handleImageGenerated}
              />
            </motion.div>
          </motion.div>

          <div className="flex flex-col items-center space-y-6 max-w-md mx-auto">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleMintNFT}
              disabled={
                nftResult.status === "generating" ||
                nftResult.status === "minting"
              }
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
              {nftResult.status === "generating" ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating Image...
                </span>
              ) : nftResult.status === "minting" ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Minting NFT...
                </span>
              ) : (
                "Mint Your Speed NFT"
              )}
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 dark:bg-gray-800/80 p-5 rounded-xl shadow backdrop-blur-sm border border-gray-100 dark:border-gray-700"
            >
              <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">
                What happens:
              </h4>
              <motion.ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-3">
                <motion.li
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-start"
                >
                  <span className="mr-2 text-green-600 dark:text-green-400 font-bold">
                    1.
                  </span>
                  <span>
                    Creates a unique image with your transaction speed
                  </span>
                </motion.li>
                <motion.li
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-start"
                >
                  <span className="mr-2 text-green-600 dark:text-green-400 font-bold">
                    2.
                  </span>
                  <span>Mints an NFT on Base Sepolia with this image</span>
                </motion.li>
                <motion.li
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-start"
                >
                  <span className="mr-2 text-green-600 dark:text-green-400 font-bold">
                    3.
                  </span>
                  <span>Each mint creates a different visual design</span>
                </motion.li>
              </motion.ol>
            </motion.div>
          </div>
        </div>
      ) : nftResult.imageUrl ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="flex flex-col items-center"
        >
          <motion.div
            initial={{ y: -10 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="bg-green-100 dark:bg-green-900/30 px-5 py-2 rounded-full mb-5"
          >
            <p className="text-green-700 dark:text-green-300 font-bold">
              NFT Minted Successfully!
            </p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05, rotate: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="aspect-square max-w-[300px] mx-auto border-4 border-green-500 dark:border-green-700 rounded-xl overflow-hidden shadow-xl"
          >
            <img
              src={nftResult.imageUrl}
              alt="NFT Image"
              className="w-full h-full object-contain"
            />
          </motion.div>
          {nftResult.transactionHash && (
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={`https://sepolia.basescan.org/tx/${nftResult.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 text-center text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-5 py-2 rounded-full transition-all hover:shadow-md"
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
            </motion.a>
          )}
        </motion.div>
      ) : null}

      {nftResult.status === "error" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="p-6 bg-red-50/90 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/50 shadow-md max-w-md mx-auto mt-4"
        >
          <motion.p
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: 1, duration: 0.5 }}
            className="text-red-600 dark:text-red-400 font-semibold text-center mb-2"
          >
            Error Minting NFT
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm mt-2 text-red-500/80 dark:text-red-300/80"
          >
            {nftResult.error?.message}
          </motion.p>
        </motion.div>
      )}
    </motion.div>
  );
}
