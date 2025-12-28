"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md mx-4",
          "bg-card border-2 border-border shadow-xl",
          "animate-in fade-in zoom-in-95 duration-200",
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b-2 border-border">
            <h2 className="font-head text-lg font-bold">{title}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// Transaction status modal
export interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  status?: "pending" | "success" | "error";
  state?: "pending" | "success" | "error"; // Alias for status
  title?: string;
  message?: string;
  txSignature?: string;
  signature?: string; // Alias for txSignature
}

export function TransactionModal({
  isOpen,
  onClose,
  status,
  state,
  title,
  message,
  txSignature,
  signature,
}: TransactionModalProps) {
  // Support both prop names
  const currentStatus = status ?? state ?? "pending";
  const currentSignature = txSignature ?? signature;
  
  const statusConfig = {
    pending: {
      icon: "⏳",
      title: title || "Processing...",
      message: message || "Please confirm the transaction in your wallet",
      color: "text-primary",
    },
    success: {
      icon: "✅",
      title: title || "Success!",
      message: message || "Transaction completed successfully",
      color: "text-green-500",
    },
    error: {
      icon: "❌",
      title: title || "Error",
      message: message || "Transaction failed. Please try again.",
      color: "text-destructive",
    },
  };

  const config = statusConfig[currentStatus];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="text-center">
      <div className="py-6 space-y-4">
        <div className="text-5xl">{config.icon}</div>
        <h3 className={cn("font-head text-xl font-bold", config.color)}>
          {config.title}
        </h3>
        <p className="text-muted-foreground">{config.message}</p>
        
        {currentSignature && currentStatus === "success" && (
          <a
            href={`https://explorer.solana.com/tx/${currentSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm text-primary hover:underline"
          >
            View on Solana Explorer →
          </a>
        )}
        
        {currentStatus !== "pending" && (
          <Button onClick={onClose} className="w-full mt-4">
            {currentStatus === "success" ? "Done" : "Close"}
          </Button>
        )}
      </div>
    </Modal>
  );
}
