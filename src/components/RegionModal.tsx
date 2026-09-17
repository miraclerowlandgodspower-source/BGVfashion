"use client";

import React, { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { CloseIcon } from "./Icons";
import { SUPPORTED_COUNTRIES, SUPPORTED_CURRENCIES } from "@/lib/money";

export function RegionModal() {
  const { isRegionModalOpen, setIsRegionModalOpen, country, setCountry, currency, setCurrency, showToast } =
    useStore();

  const [selectedCountry, setSelectedCountry] = useState(country);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);

  if (!isRegionModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCountry(selectedCountry);
    setCurrency(selectedCurrency);
    setIsRegionModalOpen(false);
    showToast(`Preferences updated to ${selectedCountry} (${selectedCurrency}).`);
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsRegionModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button
          className="icon-button modal-close"
          onClick={() => setIsRegionModalOpen(false)}
          aria-label="Close preferences modal"
        >
          <CloseIcon />
        </button>

        <h2>Shopping preferences</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "8px" }}>
          Choose your delivery destination and preferred currency for pricing.
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
          <label className="field">
            <span>Country / Region</span>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              {SUPPORTED_COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Display Currency</span>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
            >
              <option value="NGN">NGN — Nigerian Naira (₦)</option>
              <option value="USD">USD — US Dollar ($)</option>
              <option value="GBP">GBP — British Pound (£)</option>
              <option value="EUR">EUR — Euro (€)</option>
            </select>
          </label>

          <button className="button full-width" type="submit" style={{ marginTop: "16px" }}>
            Save Preferences
          </button>
        </form>
      </div>
    </div>
  );
}
