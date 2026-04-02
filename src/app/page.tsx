"use client";

import dynamic from "next/dynamic";

const InfiniteCanvas = dynamic(() => import("@/components/InfiniteCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-screen h-screen bg-gray-950 text-gray-400">
      Loading canvas...
    </div>
  ),
});

export default function Home() {
  return <InfiniteCanvas />;
}
