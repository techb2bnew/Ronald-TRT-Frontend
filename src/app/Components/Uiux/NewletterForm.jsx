'use client'
import React, { useState } from 'react'

const NewletterForm = () => {
    const [formData, setFormData] = useState({
        email: "",
    });

    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [apiMessage, setApiMessage] = useState(null);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (status) setStatus(null);
        if (apiMessage) setApiMessage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { email } = formData;

        if (!email) {
            setStatus("error");
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "Newsletter User",
                    phone: "0000000000",
                    email,
                    message: "Newsletter subscription",
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const msg = typeof data.error === "string" ? data.error : null;
                setApiMessage(msg);
                setStatus(msg ? "api" : "fail");
                return;
            }

            setStatus("success");
            setFormData({ email: "" });

        } catch {
            setStatus("fail");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative ps-4 md:ps-0 flex justify-center md:justify-start">
            <input
                type="email"
                name="email"
                value={formData.email}
                placeholder="Enter Your Mail"
                onChange={handleChange}
                className="border-[3px] text-white border-white w-[65%] md:w-[60%] 2xl:w-[70%] text-base md:text-lg py-1.5 lg:py-2 rounded-full ps-5 relative z-20 bg-black"
            />
            <button
                type="submit"
                disabled={loading}
                className="bg-white text-black text-lg py-2 lg:py-2.5 outline-none ps-8 2xl:ps-10 pe-4 2xl:pe-6 font-semibold relative right-4.5 cursor-pointer z-10 rounded-r-full"
            >
                {loading ? "Sending..." : "Submit"}
            </button>
        </form>
    )
}

export default NewletterForm