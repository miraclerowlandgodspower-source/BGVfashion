import React from "react";

interface IconProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export function SearchIcon({ className = "icon" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

export function HeartIcon({ className = "icon", filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" style={filled ? { fill: "currentColor" } : {}}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

export function UserIcon({ className = "icon" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21v-2a8 8 0 0 1 16 0v2Z" />
    </svg>
  );
}

export function BagIcon({ className = "icon" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7h14l2 14H3L5 7Z" />
      <path d="M8 9V6a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function GlobeIcon({ className = "icon" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18" />
    </svg>
  );
}

export function MenuIcon({ className = "icon" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function CloseIcon({ className = "icon" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 5 14 14M19 5 5 19" />
    </svg>
  );
}

export function CheckIcon({ className = "icon", size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function ChatIcon({ className = "icon" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function TruckIcon({ className = "icon" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

export function ShieldIcon({ className = "icon" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

/* --- SOCIAL MEDIA SVG ICONS --- */
export function InstagramIcon({ className = "icon", size = 20 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function TikTokIcon({ className = "icon", size = 20 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.004-.007a2.894 2.894 0 0 1 2.31-4.629c.314 0 .619.05.904.143V9.43a6.332 6.332 0 0 0-.904-.065c-3.528 0-6.388 2.86-6.388 6.388 0 3.528 2.86 6.388 6.388 6.388 3.528 0 6.388-2.86 6.388-6.388V8.718a8.214 8.214 0 0 0 4.722 1.488V6.76c-.347-.023-.683-.048-1.004-.074z" />
    </svg>
  );
}

export function YouTubeIcon({ className = "icon", size = 20 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function FacebookIcon({ className = "icon", size = 20 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function PinterestIcon({ className = "icon", size = 20 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.334 1.357-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
    </svg>
  );
}

export function SnapchatIcon({ className = "icon", size = 20 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.002 0c-4.444 0-7.39 3.235-7.39 7.03 0 .762.164 1.944.402 2.653.111.332-.016.516-.279.712-.662.493-1.637.95-2.28 1.488-.344.288-.492.65-.492 1.045 0 .804.707 1.347 1.83 1.488 1.066.134 1.97.87 2.054 1.97.025.328-.13.623-.393.813-.984.705-2.23 1.574-2.23 2.952 0 .919.64 1.706 1.772 2.132 1.936.722 4.394.952 6.996.952s5.06-.23 6.996-.952c1.132-.426 1.772-1.213 1.772-2.132 0-1.378-1.246-2.247-2.23-2.952-.263-.19-.418-.485-.393-.813.084-1.1 1-1.836 2.054-1.97 1.123-.141 1.83-.684 1.83-1.488 0-.395-.148-.757-.492-1.045-.643-.538-1.618-.995-2.28-1.488-.263-.196-.39-.38-.279-.712.238-.709.402-1.891.402-2.653C19.392 3.235 16.446 0 12.002 0z" />
    </svg>
  );
}

/* --- PAYMENT PROVIDER TRUST BADGES --- */
export function PaymentBadges() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
      <span style={{ padding: "4px 8px", background: "#fff", border: "1px solid var(--line)", fontSize: "0.75rem", fontWeight: 800, color: "#1a1f71" }}>
        VISA
      </span>
      <span style={{ padding: "4px 8px", background: "#fff", border: "1px solid var(--line)", fontSize: "0.75rem", fontWeight: 800, color: "#eb001b" }}>
        Mastercard
      </span>
      <span style={{ padding: "4px 8px", background: "#fff", border: "1px solid var(--line)", fontSize: "0.75rem", fontWeight: 800, color: "#008752" }}>
        Verve
      </span>
      <span style={{ padding: "4px 8px", background: "#fff", border: "1px solid var(--line)", fontSize: "0.75rem", fontWeight: 800, color: "#000" }}>
         Apple Pay
      </span>
      <span style={{ padding: "4px 8px", background: "#fff", border: "1px solid var(--line)", fontSize: "0.75rem", fontWeight: 800, color: "#4285f4" }}>
        G Pay
      </span>
      <span style={{ padding: "4px 8px", background: "#fff", border: "1px solid var(--line)", fontSize: "0.75rem", fontWeight: 800, color: "#0ba4db" }}>
        Paystack
      </span>
    </div>
  );
}
