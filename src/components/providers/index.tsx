"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { ReactNode, useState } from "react";

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

// Create wagmi config
const config = createConfig({
  chains: [baseSepolia, baseSepoliaFlashblocks],
  transports: {
    [baseSepolia.id]: http("https://sepolia.base.org"),
    [baseSepoliaFlashblocks.id]: http("https://sepolia-preconf.base.org"),
  },
});

// NFT Contract address
export const NFT_CONTRACT_ADDRESS =
  "0x413C323886e41B20Bb465105765E5F753fB79F92";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
