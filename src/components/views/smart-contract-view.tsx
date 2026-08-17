"use client";

import { useState } from "react";
import {
  FileCode2,
  Copy,
  Check,
  ExternalLink,
  Box,
  Cpu,
  Database,
  Network,
} from "lucide-react";
import { CONTRACT_INFO } from "@/lib/contract";
import { cn } from "@/lib/utils";

type Tab = "source" | "abi" | "info";

export function SmartContractView() {
  const [tab, setTab] = useState<Tab>("source");
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="animate-fade-slide-up">
      {/* Sub-header */}
      <div className="border-b border-border/60 bg-muted/10">
        <div className="px-4 md:px-6 py-5 max-w-5xl mx-auto">
          <p className="text-xs text-muted-foreground max-w-2xl">
            Smart contract inti yang mengimplementasikan Finite State Machine
            escrow. Dideploy di {CONTRACT_INFO.network}.
          </p>

          {/* Contract meta strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <MetaCard
              icon={Network}
              label="Network"
              value={CONTRACT_INFO.network}
            />
            <MetaCard
              icon={Box}
              label="Address"
              value={`${CONTRACT_INFO.address.slice(0, 8)}...${CONTRACT_INFO.address.slice(-6)}`}
              copyable
              onCopy={() => copy("addr", CONTRACT_INFO.address)}
              copied={copied === "addr"}
            />
            <MetaCard
              icon={Database}
              label="Deploy Block"
              value={`#${CONTRACT_INFO.deployBlock.toLocaleString()}`}
            />
            <MetaCard
              icon={Cpu}
              label="Chain ID"
              value={`${parseInt(CONTRACT_INFO.chainId, 16)} (0x${parseInt(CONTRACT_INFO.chainId, 16).toString(16)})`}
            />
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-border/60 bg-background/80">
        <div className="px-4 md:px-6 max-w-5xl mx-auto">
          <div className="flex items-center gap-1">
            <TabButton
              active={tab === "source"}
              onClick={() => setTab("source")}
              icon={FileCode2}
              label="Source Code"
            />
            <TabButton
              active={tab === "abi"}
              onClick={() => setTab("abi")}
              icon={Cpu}
              label="ABI"
            />
            <TabButton
              active={tab === "info"}
              onClick={() => setTab("info")}
              icon={Database}
              label="Info"
            />
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6 max-w-5xl mx-auto">
        {tab === "source" && (
          <SourceCodeTab
            source={CONTRACT_INFO.sourceCode}
            copied={copied === "source"}
            onCopy={() => copy("source", CONTRACT_INFO.sourceCode)}
          />
        )}

        {tab === "abi" && (
          <AbiTab abi={CONTRACT_INFO.abi} />
        )}

        {tab === "info" && <InfoTab />}
      </div>
    </div>
  );
}

function MetaCard({
  icon: Icon,
  label,
  value,
  copyable,
  onCopy,
  copied,
}: {
  icon: typeof Box;
  label: string;
  value: string;
  copyable?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="size-3 text-muted-foreground" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {copyable && (
          <button
            onClick={onCopy}
            className="ml-auto size-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40"
          >
            {copied ? (
              <Check className="size-3 text-success" />
            ) : (
              <Copy className="size-3" />
            )}
          </button>
        )}
      </div>
      <div className="font-mono text-xs text-foreground/80 truncate">{value}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Box;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-all",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-3.5" />
      {label}
      {active && (
        <span className="absolute -bottom-[1px] left-3 right-3 h-0.5 bg-primary rounded-full" />
      )}
    </button>
  );
}

function SourceCodeTab({
  source,
  copied,
  onCopy,
}: {
  source: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-[#0d1117] overflow-hidden">
      {/* File header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-destructive/60" />
            <div className="size-2.5 rounded-full bg-warning/60" />
            <div className="size-2.5 rounded-full bg-success/60" />
          </div>
          <span className="font-mono text-xs text-muted-foreground ml-2">
            EscrowChain.sol
          </span>
        </div>
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted/50 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-all"
        >
          {copied ? (
            <>
              <Check className="size-3 text-success" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <pre className="text-xs leading-relaxed p-4 font-mono">
          <code>{source}</code>
        </pre>
      </div>
    </div>
  );
}

function AbiTab({
  abi,
}: {
  abi: typeof CONTRACT_INFO.abi;
}) {
  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground mb-2">
        Application Binary Interface — untuk interaksi dari frontend via ethers.js / web3.js
      </div>
      {abi.map((item, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className={cn(
                "text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border",
                item.type === "function"
                  ? "border-info/30 bg-info/5 text-info"
                  : "border-warning/30 bg-warning/5 text-warning",
              )}
            >
              {item.type}
            </span>
            <span className="font-mono text-sm font-semibold text-foreground">
              {item.name}
            </span>
            {("stateMutability" in item && item.stateMutability) && (
              <span className="font-mono text-[10px] text-muted-foreground">
                {item.stateMutability}
              </span>
            )}
          </div>

          {("inputs" in item && item.inputs.length > 0) && (
            <div className="mt-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                Inputs
              </div>
              <div className="space-y-0.5">
                {item.inputs.map((inp, j) => (
                  <div
                    key={j}
                    className="flex items-center gap-2 font-mono text-xs"
                  >
                    <span className="text-primary">{inp.type}</span>
                    <span className="text-foreground/70">{inp.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {("outputs" in item && item.outputs && item.outputs.length > 0) && (
            <div className="mt-2 pt-2 border-t border-border/40">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                Returns
              </div>
              <div className="space-y-0.5">
                {item.outputs.map((out, j) => (
                  <div
                    key={j}
                    className="flex items-center gap-2 font-mono text-xs"
                  >
                    <span className="text-success">{out.type}</span>
                    <span className="text-foreground/70">{out.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function InfoTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <FileCode2 className="size-4 text-primary" />
          Contract Architecture
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          EscrowChain adalah smart contract yang mengimplementasikan pola
          Finite State Machine (FSM) untuk escrow transaksi jual-beli akun game
          digital. Kontrak ini tidak memiliki admin atau arbitrator — semua
          transisi state dikodekan langsung dan dijalankan otomatis oleh EVM.
        </p>

        <div className="space-y-2 mt-4 pt-4 border-t border-border/60">
          <InfoRow label="Solidity Version" value="^0.8.28" />
          <InfoRow label="License" value="MIT" />
          <InfoRow label="Storage Slots" value="6 (estimated)" />
          <InfoRow
            label="Modifiers"
            value="onlyBuyer, onlySeller, inState, nonReentrant"
          />
          <InfoRow
            label="External Functions"
            value="8 transactional (createListing, updateListing, cancelListing, createEscrow, confirmReceipt, requestRefund, approveRefund, rejectRefund)"
          />
          <InfoRow
            label="Read / View Functions"
            value="2 (getListing, getEscrow)"
          />
          <InfoRow
            label="Events"
            value="5 (ListingCreated, ListingUpdated, ListingCancelled, EscrowCreated, EscrowStateChanged)"
          />
        </div>
      </div>

      {/* FSM diagram */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Cpu className="size-4 text-primary" />
          State Machine
        </h3>
        <div className="font-mono text-xs space-y-2 p-4 rounded-lg bg-[#0d1117] border border-border/40">
          <div className="text-muted-foreground">
            <span className="text-warning">HELD</span>{" "}
            <span className="text-foreground/40">──confirmReceipt()──▶</span>{" "}
            <span className="text-success">RELEASED</span>
          </div>
          <div className="pl-4">
            <span className="text-warning">HELD</span>{" "}
            <span className="text-foreground/40">──requestRefund()──▶</span>{" "}
            <span className="text-orange-400">REFUND_REQUESTED</span>
          </div>
          <div className="pl-8">
            <span className="text-orange-400">REFUND_REQUESTED</span>{" "}
            <span className="text-foreground/40">──approveRefund()──▶</span>{" "}
            <span className="text-destructive">REFUNDED</span>
          </div>
          <div className="pl-8">
            <span className="text-orange-400">REFUND_REQUESTED</span>{" "}
            <span className="text-foreground/40">──rejectRefund()──▶</span>{" "}
            <span className="text-warning">HELD (kembali)</span>
          </div>
        </div>
      </div>

      {/* External links */}
      <div className="rounded-xl border border-border bg-muted/20 p-5">
        <h3 className="text-sm font-semibold mb-3">Resources</h3>
        <div className="space-y-2">
          <a
            href={CONTRACT_INFO.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-border bg-card hover:border-primary/30 text-sm transition-all"
          >
            <span>Block Explorer (Amoy)</span>
            <ExternalLink className="size-3.5 text-muted-foreground" />
          </a>
          <a
            href={CONTRACT_INFO.rpcUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-border bg-card hover:border-primary/30 text-sm transition-all"
          >
            <span>RPC Endpoint</span>
            <ExternalLink className="size-3.5 text-muted-foreground" />
          </a>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground/80">{value}</span>
    </div>
  );
}
