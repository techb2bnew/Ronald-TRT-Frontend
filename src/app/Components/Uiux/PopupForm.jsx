"use client";

import { useEffect, useState } from "react";

export default function PopupForm({ isOpen = false, onClose = () => {}, setSubject }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [subject, setsubject] = useState()
  const [status, setStatus] = useState(null);
  const [apiMessage, setApiMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
     setsubject(setSubject || 'Get a Demo')
  },[setSubject])
  
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const onEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    window.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      window.removeEventListener("keydown", onEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (status) setStatus(null);
    if (apiMessage) setApiMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, phone, email, message } = formData;

    if (!name || !phone || !email || !message) {
      setStatus("error");
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, message ,subject }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof data.error === "string" ? data.error : null;
        setApiMessage(msg);
        setStatus(msg ? "api" : "fail");
        return;
      }
      setStatus("success");
      setFormData({ name: "", phone: "", email: "", message: "" });
    } catch {
      setStatus("fail");
      setApiMessage(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="fixed inset-0 z-[999] flex items-center justify-center px-2 md:px-4 py-6">
      <button
        type="button"
        aria-label="Close contact form"
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        style={{ animation: "popupFadeIn 220ms ease-out both" }}
      />

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-red-700/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-red-900/10 rounded-full blur-3xl" />
      </div>

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[600px] max-h-[90vh] overflow-y-auto bg-[#141414] rounded-2xl border border-white/[0.07] shadow-2xl"
        style={{ animation: "popupCardIn 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both" }}
      >

        {/* Top gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#D70007] via-[#A00006] to-[#610105]" />

        <div className="px-4 md:px-10 pt-6 md:pt-10 pb-5 md:pb-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close form"
            className="absolute top-5 right-5 w-9 h-9 rounded-full border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-colors cursor-pointer"
          >
            ×
          </button>

          {/* Header */}
          <div className="mb-4 md:mb-8">
            <span className="inline-block text-[10px] font-bold tracking-[2px] text-white px-3 py-1 rounded bg-gradient-to-r from-[#D70007] to-[#610105] mb-2 md:mb-4">
              GET IN TOUCH
            </span>
            <h2 className="text-3xl font-extrabold text-white mb-2 leading-tight">
              Contact{" "}
              <span className="bg-gradient-to-b from-[#D60007] to-[#A90007] bg-clip-text text-transparent">
                Prorevv
              </span>
            </h2>
            <p className="text-sm text-white/40 leading-relaxed">
              Need a smart hail repair solution? Talk to us - we are available 24/7.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

            {/* Name + Phone Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" htmlFor="name">
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange}
                  className={inputClass}
                />
              </Field>

              <Field label="Phone Number" htmlFor="phone">
                <input
                  id="phone"
                  name="phone"
                  type="number" 
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  className={inputClass}
                />
              </Field>
            </div>

            {/* Email */}
            <Field label="Email Address" htmlFor="email">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>

            {/* Message */}
            <Field label="Message" htmlFor="message">
              <textarea
                id="message"
                name="message"
                rows={5}
                placeholder="Write your requirement or question here..."
                value={formData.message}
                onChange={handleChange}
                className={`${inputClass} resize-y min-h-[120px]`}
              />
            </Field>

            {/* Status Messages */}
            {status === "error" && (
              <div className="rounded-lg px-4 py-3 text-sm font-medium bg-red-900/20 border border-red-700/40 text-red-400">
                ⚠ Please fill in all fields.
              </div>
            )}
            {status === "api" && apiMessage && (
              <div className="rounded-lg px-4 py-3 text-sm font-medium bg-red-900/20 border border-red-700/40 text-red-400">
                ⚠ {apiMessage}
              </div>
            )}
            {status === "fail" && (
              <div className="rounded-lg px-4 py-3 text-sm font-medium bg-red-900/20 border border-red-700/40 text-red-400">
                ⚠ Something went wrong. Please try again after some time.
              </div>
            )}
            {status === "success" && (
              <div className="rounded-lg px-4 py-3 text-sm font-medium bg-green-900/20 border border-green-600/30 text-green-400">
                ✓ Your message has been sent. We will contact you soon.
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl text-white text-[15px] font-bold tracking-wide bg-gradient-to-r from-[#D70007] via-[#A00006] to-[#610105] transition-all duration-200 hover:opacity-90 active:scale-[0.985] disabled:opacity-60 disabled:cursor-not-allowed mt-1 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <SendIcon />
                  Submit Message
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-white/25 text-xs mt-6">
            🔒 Your information is safe with us. We never spam.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Reusable Field wrapper ───────────────────────────────────────────────────

function Field({ label, htmlFor, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-white/50">
        {label} <span className="text-[#D70007]">*</span>
      </label>
      {children}
    </div>
  );
}

// ─── Send Icon ────────────────────────────────────────────────────────────────

function SendIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
    </svg>
  );
}

// ─── Shared input Tailwind class ──────────────────────────────────────────────

const inputClass =
  "w-full bg-[#1e1e1e] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition-all duration-200 focus:border-[#D70007] focus:ring-2 focus:ring-[#D70007]/20";

if (typeof document !== "undefined" && !document.getElementById("popup-form-keyframes")) {
  const style = document.createElement("style");
  style.id = "popup-form-keyframes";
  style.innerHTML = `
    @keyframes popupFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes popupCardIn {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `;
  document.head.appendChild(style);
}
