import React from 'react'
import BannerCenter from '../../Components/Uiux/BannerCenter'

const sections = [
    {
        title: 'Information We Collect',
        content: [
            'When you use Prorevv, we may collect basic details such as your name, email address, phone number, and business information to create and manage your account.',
            'In addition, we collect the data you choose to store within the platform, including customer records, invoices, orders, and workflow-related information.',
            'We also gather certain technical details like your device type, browser, IP address, and how you interact with the platform. This helps us improve performance and provide a smoother user experience.',
        ],
    },
    {
        title: 'How We Use Your Information',
        content: [
            'The information we collect is used to deliver and improve our services. It allows us to manage your account, support your daily business operations, and ensure the platform functions efficiently.',
            'We may also use your information to communicate important updates, provide customer support, enhance security, and continuously improve Prorevv based on user needs and feedback.',
        ],
    },
    {
        title: 'Data Security',
        content: [
            'We take appropriate security measures to protect your data from unauthorized access, misuse, or loss. Prorevv operates on a secure, cloud-based infrastructure with controlled access and regular system monitoring.',
            'While we follow industry best practices to safeguard your information, no digital platform can guarantee complete security. However, we are committed to maintaining a high level of protection at all times.',
        ],
    },
    {
        title: 'Data Sharing',
        content: [
            'Prorevv does not sell or rent your personal or business data to third parties.',
            'Your information is only shared when necessary to operate our services, comply with legal obligations, or protect the safety and integrity of our platform.',
            'Any third-party services we work with are required to follow strict data protection standards.',
        ],
    },
    {
        title: 'Your Rights',
        content: [
            'You have full control over your data within Prorevv. You can access, update, or delete your information at any time through your account.',
            'If you need assistance with data-related requests, our support team is available to help.',
        ],
    },
    {
        title: 'Cookies and Tracking',
        content: [
            'Prorevv may use cookies or similar technologies to improve functionality and understand user behavior.',
            'These help us provide a more personalized and efficient experience. You can manage cookie preferences through your browser settings.',
        ],
    },
    {
        title: 'Data Retention',
        content: [
            'We retain your data only for as long as it is necessary to provide our services and meet legal requirements.',
            'Once the data is no longer needed, it is securely removed or anonymized.',
        ],
    },
    {
        title: 'Updates to This Policy',
        content: [
            'We may update this Privacy Policy from time to time to reflect changes in our services or legal requirements.',
            'Any updates will be posted on this page with a revised effective date.',
        ],
    },
]

const page = () => {
    return (
        <div className="bg-[#050505] text-white">
            <BannerCenter
                top_bar={'Privacy Policy'}
                title={'Your Privacy is Central to Prorevv'}
                description={'We are committed to protecting your personal and business information across our CRM platform, mobile application, and related services.'}
                btn_name={'Contact Support'}
                bg_poster={'/images/carbgposter.webp'}
            />

            <section className="inn_container py-20">
                <div className="max-w-6xl mx-auto space-y-10">
                    <div className="rounded-4xl border border-white/10 bg-white/5 p-8 md:p-12 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
                        <p className="text-sm uppercase tracking-[0.3em] text-[#ffa8a8] mb-4">Committed to your data privacy</p>
                        <h2 className="text-3xl md:text-4xl font-semibold text-white mb-5">
                            At Prorevv, your information is handled with the same care as your business.
                        </h2>
                        <p className="text-white/70 leading-8">
                            We collect only what is necessary to power your CRM workflows, support your operations, and keep your experience secure and reliable. Your data is never sold or rented, and we only share it when required to operate the service or meet legal obligations.
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
                        <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">Contact Us</h3>
                        <p className="text-white/70 leading-7">
                            If you have any questions about this Privacy Policy or how your data is handled, our support team is available to help. Reach out through the contact page or the support channel in your Prorevv account.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default page
