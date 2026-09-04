import React from 'react'
import BannerCenter from '../../Components/Uiux/BannerCenter'

const sections = [
    {
        title: 'Acceptance of Terms',
        content: [
            'By creating an account or using Prorevv, you confirm that you accept these terms and agree to follow them.',
            'If you do not agree with any part of these terms, you should not use the platform.',
        ],
    },
    {
        title: 'Use of Services',
        content: [
            'Prorevv provides tools to manage customers, invoices, workflows, and business operations. You agree to use the platform only for lawful business purposes and in a way that does not harm the system, other users, or the company.',
            'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.',
        ],
    },
    {
        title: 'User Responsibilities',
        content: [
            'As a user of Prorevv, you are responsible for ensuring that all information entered into the platform is accurate and lawful.',
            'You agree not to misuse the system, attempt unauthorized access, or interfere with the platform’s functionality.',
            'Any misuse, including uploading harmful data or violating applicable laws, may result in suspension or termination of your account.',
        ],
    },
    {
        title: 'Data & Content',
        content: [
            'All data entered into Prorevv remains your property. However, by using the platform, you grant us permission to process and store this data to provide our services effectively.',
            'We do not claim ownership of your business data, but we are not responsible for any loss caused by incorrect data entry, user actions, or external factors beyond our control.',
        ],
    },
    {
        title: 'Service Availability',
        content: [
            'We strive to ensure that Prorevv is available at all times, but we do not guarantee uninterrupted access.',
            'There may be occasional downtime due to maintenance, updates, or unforeseen technical issues.',
            'We reserve the right to modify, suspend, or discontinue any part of the service at any time without prior notice.',
        ],
    },
    {
        title: 'Payments & Subscriptions',
        content: [
            'If Prorevv offers paid plans, users agree to pay all applicable fees as per the selected subscription. Payments must be made on time to continue access to paid features.',
            'Failure to make payments may result in restricted access or account suspension. All fees are non-refundable unless stated otherwise.',
        ],
    },
    {
        title: 'Limitation of Liability',
        content: [
            'Prorevv is provided on an “as-is” basis. While we aim to deliver reliable and efficient services, we do not guarantee that the platform will be error-free or meet every specific requirement.',
            'We are not liable for any direct or indirect losses, including business interruption, data loss, or financial damages arising from the use or inability to use our services.',
        ],
    },
    {
        title: 'Termination',
        content: [
            'We reserve the right to suspend or terminate your account if you violate these terms or misuse the platform. You may also stop using Prorevv at any time.',
            'Upon termination, your access to the platform will be removed, and your data may be deleted in accordance with our data policies.',
        ],
    },
    {
        title: 'Changes to Terms',
        content: [
            'Prorevv may update these Terms & Conditions from time to time. Any changes will be posted on this page with an updated effective date.',
            'Continued use of the platform means you accept the revised terms.',
        ],
    },
    {
        title: 'Governing Law',
        content: [
            'These Terms & Conditions are governed by applicable laws, and any disputes will be subject to the jurisdiction of the relevant legal authorities.',
        ],
    },
]

const page = () => {
    return (
        <div className="bg-[#050505] text-white">
            <BannerCenter
                top_bar={'Terms & Conditions'}
                title={'The Rules that Keep Prorevv Secure and Reliable'}
                description={'Read the terms that apply when you use Prorevv’s CRM platform, mobile app, and related services.'}
                btn_name={'Get Support'}
                bg_poster={'/images/carbgposter.webp'}
            />

            <section className="inn_container py-20">
                <div className="max-w-6xl mx-auto space-y-10">
                    <div className="rounded-4xl border border-white/10 bg-white/5 p-8 md:p-12 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
                        <p className="text-sm uppercase tracking-[0.3em] text-[#ffa8a8] mb-4">Use Prorevv with confidence</p>
                        <h2 className="text-3xl md:text-4xl font-semibold text-white mb-5">
                            These terms define your responsibilities and how we support your business.
                        </h2>
                        <p className="text-white/70 leading-8">
                            Prorevv is built to simplify business operations while protecting your account and data. This agreement helps ensure the platform stays safe, available, and reliable for every user.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {sections.map((section, index) => (
                            <div
                                key={index}
                                className="rounded-3xl border border-white/10 bg-[#101010] p-7 md:p-8 xl:p-10 shadow-[0_18px_50px_rgba(0,0,0,0.22)]"
                            >
                                <h3 className="text-xl md:text-2xl font-semibold text-white mb-4">
                                    {section.title}
                                </h3>
                                <div className="space-y-3 text-white/70 leading-7">
                                    {section.content.map((paragraph, idx) => (
                                        <p key={idx}>{paragraph}</p>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-4xl border border-white/10 bg-linear-to-r from-[#1a0305] via-[#0a0a0a] to-[#1a0305] p-8 md:p-10">
                        <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">Need Assistance?</h3>
                        <p className="text-white/70 leading-7">
                            If you have questions about these Terms & Conditions or need help with your Prorevv account, our support team is ready to assist you.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default page
