"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRegularBlockData, useFlashblockData } from "../hooks/useBlockData";
import BlockInfo from "../components/BlockInfo";
import TransactionSender from "../components/TransactionSender";
import { Github } from "lucide-react";

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const {
    data: regularBlockData,
    isLoading: isRegularLoading,
    error: regularError,
  } = useRegularBlockData();

  const {
    data: flashblockData,
    isLoading: isFlashblockLoading,
    error: flashblockError,
  } = useFlashblockData();

  return (
    <div className="min-h-screen p-4 md:p-8 font-[family-name:var(--font-geist-sans)]">
      <header className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/base.svg"
              alt="Base logo"
              width={40}
              height={40}
              priority
            />
            <h1 className="text-2xl md:text-3xl font-bold">Base Flashblocks</h1>
          </div>
          <div className="text-sm md:text-base text-gray-600 dark:text-gray-400 text-center md:text-right">
            <p>Only Possible On Base</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <section className="mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Mint Your Transaction Time as an NFT
            </h2>
            <p className="text-lg mb-4">
              Experience the speed of Base Flashblocks and mint your transaction
              time as a unique NFT!
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex-1 min-w-[200px]">
                <h3 className="font-semibold">1. Send a Transaction</h3>
                <p className="text-sm">
                  Send a test transaction to the Flashblocks network
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex-1 min-w-[200px]">
                <h3 className="font-semibold">2. See the Speed</h3>
                <p className="text-sm">
                  Experience hyper fast confirmation times
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex-1 min-w-[200px]">
                <h3 className="font-semibold">3. Mint Your NFT</h3>
                <p className="text-sm">
                  Create and mint a unique NFT with your transaction time
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isClient ? (
              <>
                <BlockInfo
                  title="Regular Blocks"
                  blockData={regularBlockData}
                  isLoading={isRegularLoading}
                  error={regularError as Error}
                  refreshInterval={2000}
                />

                <BlockInfo
                  title="Flashblocks"
                  blockData={flashblockData}
                  isLoading={isFlashblockLoading}
                  error={flashblockError as Error}
                  refreshInterval={200}
                  className="border-blue-500 dark:border-blue-700"
                />
              </>
            ) : (
              <>
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6 h-[300px] md:h-[400px] flex items-center justify-center">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>

                <div className="rounded-lg border border-blue-500 dark:border-blue-700 p-6 h-[300px] md:h-[400px] flex items-center justify-center">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Test Base FlashblocksTransaction Speed & Mint Your NFT
          </h2>
          <p className="mb-6 text-gray-700 dark:text-gray-300">
            Send a test transaction to both RPC networks simultaneously and
            compare how quickly they get confirmed. Then, mint an NFT with your
            Flashblocks transaction time as a unique visual representation!
          </p>

          {isClient ? (
            <TransactionSender />
          ) : (
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6 h-[300px] flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-4"></div>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="max-w-6xl mx-auto mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 text-center text-gray-600 dark:text-gray-400">
        <p className="mb-2">
          Built by{" "}
          <a
            href="https://x.com/dannweeeee"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
          >
            @dannweeeee
          </a>{" "}
          | Base Flashblocks Builder Side Quest
        </p>
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-4">
          <a
            href="https://github.com/dannweeeee/based-flash"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
          >
            <Github />
          </a>
        </div>
      </footer>
    </div>
  );
}
