"use client";

import { useEffect, useState, useMemo, useRef, memo } from "react";
import { BlockData } from "@/hooks/useBlockData";

interface BlockInfoProps {
  title: string;
  blockData: BlockData | undefined;
  isLoading: boolean;
  error: Error | null;
  refreshInterval: number;
  className?: string;
}

// Memoized component for block data display to prevent re-renders
const BlockContent = memo(({ blockData }: { blockData: BlockData }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Time</div>
          <div className="font-medium">{blockData.formattedTimestamp}</div>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Transactions</div>
          <div className="font-medium">{blockData.transactions.length}</div>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Gas Used</div>
          <div className="font-medium">
            {Number(blockData.gasUsed).toLocaleString()}
          </div>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Age</div>
          <div className="font-medium">{blockData.timeAgo}</div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Block Hash</span>
        <a
          href={`https://sepolia.basescan.org/block/${blockData.number}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline truncate max-w-[200px]"
          title={blockData.hash}
        >
          {blockData.hash.slice(0, 10)}...{blockData.hash.slice(-8)}
        </a>
      </div>
    </div>
  );
});

BlockContent.displayName = "BlockContent";

// Memoized progress bar component
const ProgressBar = memo(
  ({
    progressPercentage,
    isFlashblock,
    refreshInterval,
    timeSinceLastBlock,
  }: {
    progressPercentage: number;
    isFlashblock: boolean;
    refreshInterval: number;
    timeSinceLastBlock: number;
  }) => {
    return (
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-xs text-gray-500">Next block in</span>
          <span
            className={`text-sm font-medium ${
              isFlashblock ? "text-blue-600 dark:text-blue-400" : ""
            }`}
          >
            {Math.max(
              0,
              Math.floor((refreshInterval - timeSinceLastBlock) / 100) / 10
            ).toFixed(1)}
            s
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div
            className={`${
              isFlashblock ? "bg-blue-600" : "bg-gray-600"
            } h-2.5 rounded-full transition-all duration-100 ease-linear`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";

function BlockInfo({
  title,
  blockData,
  isLoading,
  error,
  refreshInterval,
  className = "",
}: BlockInfoProps) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [timeSinceLastBlock, setTimeSinceLastBlock] = useState<number>(0);
  const [blockCount, setBlockCount] = useState<number>(0);

  // Use ref instead of state for previous block number to avoid re-renders
  const prevBlockNumberRef = useRef<bigint | undefined>(undefined);

  // Memoize computed values
  const isFlashblock = useMemo(() => refreshInterval < 1000, [refreshInterval]);

  const progressPercentage = useMemo(
    () => Math.min((timeSinceLastBlock / refreshInterval) * 100, 100),
    [timeSinceLastBlock, refreshInterval]
  );

  // Update block data without causing full re-renders or scroll jumps
  useEffect(() => {
    if (blockData && blockData.number !== prevBlockNumberRef.current) {
      // Save scroll position before update
      const scrollPosition = window.scrollY;
      
      prevBlockNumberRef.current = blockData.number;
      setLastUpdated(new Date());
      setTimeSinceLastBlock(0);
      setBlockCount((prev) => prev + 1);
      
      // Restore scroll position after update
      window.scrollTo({
        top: scrollPosition,
        behavior: 'auto' // Use 'auto' instead of 'smooth' to avoid animation
      });
    }
  }, [blockData]);

  // Timer effect with scroll position preservation
  useEffect(() => {
    const interval = setInterval(() => {
      // Save scroll position before update
      const scrollPosition = window.scrollY;
      
      setTimeSinceLastBlock((prev) => prev + 100);
      
      // Restore scroll position after update
      window.scrollTo({
        top: scrollPosition,
        behavior: 'auto' // Use 'auto' instead of 'smooth' to avoid animation
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Memoize the header content
  const headerContent = useMemo(
    () => (
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2
            className={`text-xl font-bold ${
              isFlashblock ? "text-blue-600 dark:text-blue-400" : ""
            }`}
          >
            {title}
          </h2>
          <div className="text-xs text-gray-500 mt-1">
            {blockCount > 0 && `${blockCount} blocks observed`}
          </div>
        </div>
        <div
          className={`text-sm ${
            isFlashblock
              ? "text-blue-600 dark:text-blue-400 font-semibold"
              : "text-gray-500"
          }`}
        >
          {blockData ? `Block #${blockData.number.toString()}` : "Loading..."}
        </div>
      </div>
    ),
    [title, isFlashblock, blockCount, blockData]
  );

  return (
    <div
      className={`rounded-lg border ${
        isFlashblock
          ? "border-blue-500 dark:border-blue-700"
          : "border-gray-200 dark:border-gray-800"
      } p-6 ${className} relative overflow-hidden`}
      style={{ minHeight: blockData ? '350px' : 'auto' }} // Add fixed height to prevent layout shifts
    >
      {/* Background pattern for flashblocks */}
      {isFlashblock && (
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-blue-500 dark:bg-blue-700"></div>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E\")",
              backgroundSize: "20px 20px",
            }}
          ></div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {headerContent}

        {isLoading && !blockData ? (
          <div className="flex justify-center items-center h-40">
            <div
              className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
                isFlashblock ? "border-blue-500" : "border-gray-500"
              }`}
            ></div>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 rounded-md bg-red-50 dark:bg-red-900/20">
            Error: {error.message}
          </div>
        ) : blockData ? (
          <>
            <BlockContent blockData={blockData} />
            <ProgressBar
              progressPercentage={progressPercentage}
              isFlashblock={isFlashblock}
              refreshInterval={refreshInterval}
              timeSinceLastBlock={timeSinceLastBlock}
            />
          </>
        ) : (
          <div className="text-center p-4">No data available</div>
        )}
      </div>
    </div>
  );
}

// Wrap the entire component with memo to prevent unnecessary re-renders
export default memo(BlockInfo);
