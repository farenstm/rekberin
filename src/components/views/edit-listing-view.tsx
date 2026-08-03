"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Upload,
  Tag,
  DollarSign,
  MessageCircle,
  Send,
  Phone,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useAppStore, useListingsStore, useWalletStore } from "@/lib/store";
import { uploadFileToIPFS, uploadMetadataToIPFS } from "@/lib/ipfs";
import { updateListingOnChain } from "@/lib/web3";
import { cn } from "@/lib/utils";

export function EditListingView() {
  const setView = useAppStore((s) => s.setView);
  const openListing = useAppStore((s) => s.openListing);
  const editListingId = useAppStore((s) => s.editListingId);
  const getListingById = useListingsStore((s) => s.getById);
  const updateListingDetails = useListingsStore((s) => s.updateListingDetails);
  const wallet = useWalletStore((s) => s.wallet);

  const listing = editListingId ? getListingById(editListingId) : null;

  const [game, setGame] = useState("");
  const [title, setTitle] = useState("");
  const [tier, setTier] = useState("");
  const [priceIDR, setPriceIDR] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [discord, setDiscord] = useState("");
  const [telegram, setTelegram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [publishing, setPublishing] = useState(false);
  const [publishStep, setPublishStep] = useState<string>("");

  useEffect(() => {
    if (listing) {
      setGame(listing.game);
      setTitle(listing.title);
      setTier(listing.tier);
      setPriceIDR(listing.priceIDR.toString());
      setDescription(listing.description);
      setFeatures(listing.features.join(", "));
      setDiscord(listing.discord || "");
      setTelegram(listing.telegram || "");
      setWhatsapp(listing.whatsapp || "");
      setImagePreview(listing.imageUrl ? listing.imageUrl.replace("ipfs://", "https://ipfs.io/ipfs/") : "");
    }
  }, [listing]);

  if (!listing) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Listing not found.
      </div>
    );
  }

  const priceNum = parseInt(priceIDR.replace(/\D/g, ""), 10) || 0;
  const priceMatic = priceNum / 6200; // ~ Rp6.200 / MATIC (Market price)

  const canPublish =
    game.trim() &&
    title.trim() &&
    tier.trim() &&
    priceNum > 0 &&
    description.trim();

  const handlePublish = async () => {
    if (!canPublish || wallet.status !== "connected") return;
    setPublishing(true);

    try {
      let imageUrl = listing.imageUrl || "";
      if (imageFile) {
        setPublishStep("Uploading new cover image ke IPFS...");
        const imageCid = await uploadFileToIPFS(imageFile);
        imageUrl = imageCid.startsWith("blob:") ? imageCid : `ipfs://${imageCid}`;
      }

      setPublishStep("Uploading metadata baru ke IPFS...");
      const featuresArr = features
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const metadata = {
        game: game.trim(),
        title: title.trim(),
        tier: tier.trim(),
        description: description.trim(),
        features: featuresArr,
        discord: discord.trim() || undefined,
        telegram: telegram.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        image: imageUrl,
      };
      const metaCid = await uploadMetadataToIPFS(metadata);

      setPublishStep("Memperbarui data di smart contract...");
      // Ambil angka id dari "L-001" -> 1
      const onChainId = parseInt(listing.id.replace(/\D/g, ""), 10);
      await updateListingOnChain(onChainId, Number(priceMatic.toFixed(4)), metaCid);

      updateListingDetails(listing.id, {
        game: game.trim(),
        title: title.trim(),
        tier: tier.trim(),
        description: description.trim(),
        priceIDR: priceNum,
        priceMatic: Number(priceMatic.toFixed(4)),
        imageUrl,
        discord: discord.trim() || undefined,
        telegram: telegram.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        features: featuresArr,
        cid: metaCid,
      });

      setPublishing(false);
      setPublishStep("");
      openListing(listing.id);
    } catch (err: any) {
      console.error(err);
      alert("Gagal mem-publish update: " + err.message);
      setPublishing(false);
      setPublishStep("");
    }
  };

  return (
    <div className="animate-fade-slide-up">
      {/* Back */}
      <div className="px-4 md:px-6 py-3 border-b border-border/40">
        <button
          onClick={() => openListing(listing.id)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke detail listing
        </button>
      </div>

      <div className="px-4 md:px-6 py-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Edit Listing
          </span>
          <h1 className="text-2xl md:text-3xl font-bold mt-1 mb-2">
            Update Listing Details
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Perubahan metadata akan di-upload ulang ke IPFS sebagai entitas baru, dan data di smart contract akan diperbarui.
          </p>
        </div>

        {wallet.status !== "connected" && (
          <div className="mb-6 p-4 rounded-lg border border-warning/30 bg-warning/5 flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <div className="text-xs text-warning-foreground/90">
              Hubungkan wallet Anda terlebih dahulu untuk mengedit listing.
            </div>
          </div>
        )}

        <div className="space-y-5">
          {/* Game + Tier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Game" icon={Tag} required>
              <select
                value={game}
                onChange={(e) => setGame(e.target.value)}
                className="input appearance-none bg-background"
              >
                <option value="" disabled>Pilih Kategori Game</option>
                <option value="Mobile Legends">Mobile Legends</option>
                <option value="Valorant">Valorant</option>
                <option value="Genshin Impact">Genshin Impact</option>
                <option value="Free Fire">Free Fire</option>
                <option value="PUBG Mobile">PUBG Mobile</option>
              </select>
            </Field>
            <Field label="Tier / Rank" required>
              <input
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                placeholder=""
                className="input"
              />
            </Field>
          </div>

          {/* Title */}
          <Field label="Title" required>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder=""
              className="input"
            />
          </Field>

          {/* Description */}
          <Field label="Description" required>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail akun: jumlah hero, skin, level, binding email, dll."
              rows={4}
              className="input resize-none"
            />
          </Field>

          {/* Features */}
          <Field
            label="Highlights"
            hint="Pisahkan dengan koma. Mis: 100 Hero, 200 Skin, Gmail Bind"
          >
            <input
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="100 Hero, 200 Skin, Gmail Bind"
              className="input"
            />
          </Field>

          {/* Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Price (IDR)" icon={DollarSign} required>
              <input
                value={priceIDR}
                onChange={(e) =>
                  setPriceIDR(
                    e.target.value.replace(/\D/g, "").replace(/(\d)(?=(\d{3})+$)/g, "$1."),
                  )
                }
                placeholder="500.000"
                inputMode="numeric"
                className="input font-mono-num"
              />
            </Field>
            <Field label="Equivalent (MATIC)" hint="Otomatis dihitung">
              <div className="input bg-muted/20 flex items-center text-muted-foreground font-mono-num">
                {priceMatic > 0 ? `≈ ${priceMatic.toFixed(4)} MATIC` : "—"}
              </div>
            </Field>
          </div>

          {/* Image Upload */}
          <Field label="Preview Akun (Cover Image)" hint="Format: JPG/PNG. Biarkan kosong jika tidak ingin mengubah gambar." required={false}>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImageFile(e.target.files[0]);
                    setImagePreview(URL.createObjectURL(e.target.files[0]));
                  }
                }}
                className="input py-2"
              />
              {imagePreview && (
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  {game && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-mono uppercase tracking-wider text-white/90 border border-white/10">
                        {game}
                      </span>
                    </div>
                  )}
                  {tier && (
                    <div className="absolute bottom-2 left-2">
                      <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-mono uppercase tracking-wider text-white/90 border border-white/10">
                        {tier}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Field>

          {/* Contacts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Discord" icon={MessageCircle}>
              <input
                value={discord}
                onChange={(e) => setDiscord(e.target.value)}
                placeholder="username"
                className="input"
              />
            </Field>
            <Field label="Telegram" icon={Send}>
              <input
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="@username"
                className="input"
              />
            </Field>
            <Field label="WhatsApp" icon={Phone}>
              <input
                value={whatsapp}
                onChange={(e) =>
                  setWhatsapp(e.target.value.replace(/[^\d]/g, ""))
                }
                placeholder="62812..."
                inputMode="numeric"
                className="input font-mono-num"
              />
            </Field>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              <span>Update metadata → IPFS → Smart Contract.</span>
            </div>
            <button
              onClick={handlePublish}
              disabled={!canPublish || wallet.status !== "connected" || publishing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all glow-primary"
            >
              <Upload className="size-4" />
              {publishing ? "Updating..." : "Update Listing"}
            </button>
          </div>

          {/* Publishing progress */}
          {publishing && (
            <div className="mt-4 p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
              <div className="flex items-center gap-2 text-sm text-primary font-medium">
                <Sparkles className="size-4 animate-pulse" />
                {publishStep}
              </div>
              <div className="h-1 bg-primary/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse" style={{ width: "70%" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .input {
          @apply w-full h-10 px-3 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all;
        }
        textarea.input {
          @apply h-auto py-2.5;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  hint,
  required,
  children,
}: {
  label: string;
  icon?: typeof Tag;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-xs font-medium">
        {Icon && <Icon className="size-3.5 text-muted-foreground" />}
        <span>{label}</span>
        {required && <span className="text-destructive text-[10px]">*</span>}
        {hint && (
          <span className="text-[10px] text-muted-foreground/70 ml-auto">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
