"use client";

import { useState } from "react";
import { useSendTransaction } from "wagmi";
import { motion } from "framer-motion";

interface TransactionFormProps {
  address: `0x${string}` | undefined;
  onTransactionSent: (hash: `0x${string}`, sentTime: number) => void;
}

export default function TransactionForm({
  address,
  onTransactionSent,
}: TransactionFormProps) {
  // Fixed recipient address and amount
  const RECIPIENT_ADDRESS = address;
  const AMOUNT = "0.0001";

  // Use wagmi's useSendTransaction hook
  const { sendTransaction, isPending } = useSendTransaction({
    mutation: {
      onSuccess: (data) => {
        const now = Date.now();
        onTransactionSent(data, now);
      },
      onError: (error) => {
        console.error("Transaction failed:", error);
      },
    },
  });

  // Handle sending a transaction to both networks
  const handleSendTransaction = () => {
    // Send a transaction to the user's own address or the fixed recipient
    const recipient = RECIPIENT_ADDRESS
      ? (RECIPIENT_ADDRESS as `0x${string}`)
      : address;

    // Send transaction
    sendTransaction({
      to: recipient,
      value: BigInt(Math.floor(parseFloat(AMOUNT) * 10 ** 18)), // Convert to wei
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm"
        >
          <label
            htmlFor="recipient"
            className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
          >
            Recipient Address
          </label>
          <input
            id="recipient"
            type="text"
            value={RECIPIENT_ADDRESS}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-inner"
          />
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm"
        >
          <label
            htmlFor="amount"
            className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
          >
            Amount (ETH)
          </label>
          <input
            id="amount"
            type="text"
            value={AMOUNT}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-inner"
          />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <div className="flex justify-center">
          <motion.button
            onClick={handleSendTransaction}
            disabled={isPending}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="w-full max-w-md bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
          >
            {isPending ? (
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="flex items-center justify-center"
              >
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
                Sending Transaction...
              </motion.span>
            ) : (
              "Send Test Transaction"
            )}
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-sm text-center text-blue-800 dark:text-blue-200"
          >
            This will send one transaction and monitor how quickly it's included
            in both networks
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center"
          >
            <p>
              Note: Actual transaction speeds may vary based on network
              conditions.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
