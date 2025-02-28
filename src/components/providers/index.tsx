"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, WagmiProvider } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { ReactNode, useState } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";

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

const config = getDefaultConfig({
  appName: "Based Flash",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
  chains: [baseSepolia, baseSepoliaFlashblocks],
  transports: {
    [baseSepolia.id]: http("https://sepolia.base.org"),
    [baseSepoliaFlashblocks.id]: http("https://sepolia-preconf.base.org"),
  },
  ssr: true,
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
