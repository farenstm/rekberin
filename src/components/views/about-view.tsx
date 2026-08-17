"use client";

import { useState } from "react";
import {
  Info,
  Code2,
  Boxes,
  Wallet,
  FileCode2,
  Network,
  Database,
  Shield,
  BookOpen,
  Cpu,
  Check,
  Copy,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { CONTRACT_INFO } from "@/lib/contract";
import { cn } from "@/lib/utils";

interface TechItem {
  name: string;
  category: string;
  description: string;
  icon: typeof Code2;
  color: string;
}

const TECH_STACK: TechItem[] = [
  {
    name: "React 19",
    category: "Frontend Library",
    description:
      "Library UI deklaratif untuk membangun interface komponen-based. Versi 19 dengan concurrent features.",
    icon: Code2,
    color: "text-cyan-400",
  },
  {
    name: "Next.js 16",
    category: "Meta-Framework",
    description:
      "Framework React dengan App Router, server components, dan optimasi otomatis. Menyediakan routing & API routes.",
    icon: Boxes,
    color: "text-foreground",
  },
  {
    name: "TypeScript 5",
    category: "Language",
    description:
      "Superset JavaScript dengan static typing. Mencegah bug saat development, meningkatkan maintainability kode.",
    icon: Code2,
    color: "text-blue-400",
  },
  {
    name: "Ethers.js",
    category: "Web3 Library",
    description:
      "Library JavaScript untuk berinteraksi dengan Ethereum blockchain. Digunakan untuk memanggil smart contract & menangani transaksi.",
    icon: Cpu,
    color: "text-purple-400",
  },
  {
    name: "MetaMask",
    category: "Wallet Provider",
    description:
      "Browser extension wallet yang menyimpan private key & memfasilitasi signing transaksi. User approve tx via MetaMask popup.",
    icon: Wallet,
    color: "text-orange-400",
  },
  {
    name: "Solidity ^0.8.28",
    category: "Smart Contract Language",
    description:
      "Bahasa pemrograman untuk menulis smart contract di EVM. EscrowChain.sol diimplementasikan dengan Solidity + FSM pattern.",
    icon: FileCode2,
    color: "text-foreground",
  },
  {
    name: "Polygon Amoy Testnet",
    category: "Blockchain Network",
    description:
      "Testnet Polygon (chainId 80002). Gas fee rendah, cepat, cocok untuk prototype akademik. POL sebagai native token.",
    icon: Network,
    color: "text-purple-400",
  },
  {
    name: "IPFS",
    category: "Decentralized Storage",
    description:
      "InterPlanetary File System untuk menyimpan metadata listing (judul, deskripsi, harga, kontak). CID sebagai identifier unik.",
    icon: Database,
    color: "text-cyan-400",
  },
];

export function AboutView() {
  const setView = useAppStore((s) => s.setView);

  return (
    <div className="animate-fade-slide-up">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, oklch(0.78 0.18 155 / 0.15), transparent)",
          }}
        />
        <div className="relative px-4 md:px-6 py-12 md:py-16 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 mb-5">
            <Info className="size-3 text-primary" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-primary">
              Tentang Sistem
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-4 max-w-3xl">
            Marketplace Web3 yang{" "}
            <span className="text-gradient-primary">Terdesentralisasi</span>
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
            EscrowChain adalah purwarupa (prototype) sistem <strong>Decentralized Escrow</strong> berbasis Blockchain Polygon yang dikembangkan untuk penelitian akademis (Skripsi/Tugas Akhir). Sistem ini dirancang khusus untuk mengeliminasi risiko penipuan dan kebutuhan pihak ketiga (Rekber) pada transaksi jual-beli akun game, dengan memanfaatkan Smart Contract yang otomatis, transparan, dan terdesentralisasi.
          </p>
        </div>
      </section>

      {/* Tech stack grid */}
      <section className="px-4 md:px-6 py-12 max-w-6xl mx-auto">
        <div className="mb-6">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Teknologi
          </span>
          <h2 className="text-xl md:text-2xl font-bold mt-1">
            Stack yang digunakan
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TECH_STACK.map((tech) => (
            <div
              key={tech.name}
              className="rounded-xl border border-border bg-card p-4 card-elevated hover:border-primary/30 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <tech.icon className={cn("size-6", tech.color)} />
              </div>
              <h3 className="font-semibold text-sm">{tech.name}</h3>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5 mb-2">
                {tech.category}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {tech.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Contract info */}
      <section className="px-4 md:px-6 py-12 max-w-4xl mx-auto">
        <div className="rounded-2xl border border-border bg-card p-6 card-elevated">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="size-5 text-primary" />
            <h3 className="text-lg font-semibold">Smart Contract Deployment</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoRow label="Contract Name" value={`${CONTRACT_INFO.name}.sol`} />
            <InfoRow label="Network" value={CONTRACT_INFO.network} />
            <InfoRow
              label="Address"
              value={CONTRACT_INFO.address}
              mono
              copyable
            />
            <InfoRow
              label="Chain ID"
              value={`${parseInt(CONTRACT_INFO.chainId, 16)} (0x${parseInt(CONTRACT_INFO.chainId, 16).toString(16)})`}
            />
            <InfoRow
              label="Deploy Block"
              value={`#${CONTRACT_INFO.deployBlock.toLocaleString()}`}
            />
            <InfoRow label="Solidity Version" value="^0.8.28" />
            <InfoRow label="License" value="MIT" />
            <InfoRow label="Functions" value="8 transactional" />
          </div>

          <div className="mt-5 pt-5 border-t border-border/60 flex flex-wrap gap-2">
            <button
              onClick={() => setView("how-it-works")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/30 text-xs font-medium transition-all"
            >
              <BookOpen className="size-3.5 text-primary" />
              How It Works
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
  copyable,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!copyable) return;
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-muted/20 border border-border/50">
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground shrink-0">
        {label}
      </span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={cn(
            "text-xs truncate",
            mono ? "font-mono text-foreground/80" : "text-foreground/80",
          )}
        >
          {value.length > 24 ? `${value.slice(0, 12)}...${value.slice(-8)}` : value}
        </span>
        {copyable && (
          <button
            onClick={handleCopy}
            className="size-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 shrink-0"
          >
            {copied ? (
              <Check className="size-3 text-success" />
            ) : (
              <Copy className="size-3" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
