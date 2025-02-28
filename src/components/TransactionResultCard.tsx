"use client";

import { motion } from "framer-motion";

interface TransactionResult {
  hash: `0x${string}` | null;
  status: "idle" | "pending" | "success" | "error";
  error: Error | null;
  confirmationTime: number | null;
  blockNumber: bigint | null;
  sentTime: number | null;
}

interface TransactionResultCardProps {
  title: string;
  result: TransactionResult;
  time: number | null;
  sentTime: number | null;
  color?: string;
  className?: string;
}

export default function TransactionResultCard({ 
  title, 
  result, 
  time, 
  sentTime, 
  color = "blue", 
  className = "" 
}: TransactionResultCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 shadow-sm ${className}`}
    >
      <motion.h3 
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="text-lg font-semibold mb-2"
      >
        {title}
      </motion.h3>

      {result.status === "idle" && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-gray-500 dark:text-gray-400"
        >
          No transaction sent yet
        </motion.p>
      )}

      {result.status === "pending" && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center space-x-2"
        >
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
          <span className="text-gray-600 dark:text-gray-300">Transaction pending...</span>
        </motion.div>
      )}

      {result.status === "error" && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-red-500"
        >
          Error: {result.error?.message}
        </motion.div>
      )}

      {result.status === "success" && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, staggerChildren: 0.1 }}
          className="space-y-2"
        >
          <motion.div 
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-between"
          >
            <span className="text-gray-500 dark:text-gray-400">Transaction Hash</span>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={`https://sepolia.basescan.org/tx/${result.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline truncate max-w-[200px]"
            >
              {result.hash?.slice(0, 10)}...{result.hash?.slice(-8)}
            </motion.a>
          </motion.div>

          <motion.div 
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-between"
          >
            <span className="text-gray-500 dark:text-gray-400">Block Number</span>
            <span className="font-mono">{result.blockNumber?.toString()}</span>
          </motion.div>

          
          {time && sentTime && (
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-2 border-t border-gray-100 dark:border-gray-600 mt-2 pt-2"
            >
              <span className="text-gray-600 dark:text-gray-300 font-medium flex items-center">
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className={`w-3 h-3 bg-${color}-500 rounded-full mr-2`}
                ></motion.span>
                Included at:
              </span>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="font-mono bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded mt-1 sm:mt-0 flex items-center"
              >
                {new Date(time).toLocaleTimeString()}
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className={`ml-2 text-${color}-500 font-bold`}
                >
                  ({((time - sentTime) / 1000).toFixed(2)}s)
                </motion.span>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
