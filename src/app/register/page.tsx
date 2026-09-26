"use client";

import Link from "next/link";
import { GoogleSignIn } from "@/components/GoogleSignIn";

export default function RegisterPage() {
  return (
    <main className="minimal-auth-page">
      <section className="minimal-auth-panel" aria-labelledby="create-account-title">
        <p className="minimal-kicker">BGV ACCOUNT</p>
        <h1 id="create-account-title">Create your account.</h1>
        <p className="minimal-auth-copy">
          BGV uses Google for new customer accounts. Your verified Google email becomes your BGV account email.
        </p>

        <GoogleSignIn mode="signup" returnTo="/account" />

        <p className="minimal-privacy">
          By continuing, you agree to BGV&apos;s account and privacy terms.
        </p>

        <div className="minimal-auth-footer">
          <span>Already have a BGV account?</span>
          <Link href="/login">Sign in</Link>
        </div>
      </section>

      <aside className="minimal-auth-editorial" aria-label="BGV membership">
        <p>BGV / MEMBERSHIP</p>
        <h2>One account.<br />Your whole wardrobe.</h2>
        <div>
          <span>01 — Faster checkout</span>
          <span>02 — Order tracking</span>
          <span>03 — Wishlist access</span>
          <span>04 — Private releases</span>
        </div>
      </aside>
    </main>
  );
}
