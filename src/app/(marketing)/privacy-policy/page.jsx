
import React from 'react'
import BannerCenter from '../../Components/Uiux/BannerCenter'

const sections = [
    {
        title: 'Information We Collect',
        content: [
            'When you use Prorevv, we may collect basic details such as your name, email address, phone number, and business information to create and manage your account.',
            'In addition, we collect the data you choose to store within the platform, including customer records, vehicle and VIN details, work orders, job records, technician assignments, invoices, and related workflow information.',
            'Photos and images. Our mobile app lets you capture or upload photos — such as vehicle condition images, damage documentation, your profile picture, and your business logo. These images are stored together with the records you attach them to.',
            'Location. If you allow it, we use your device location only to suggest nearby addresses when you are adding or editing customer details. We do not track your location in the background, and we do not store a history of your movements.',
            "Biometric login. You may optionally enable Face ID, Touch ID, or fingerprint sign-in. Your biometric data never leaves your device and is never sent to or stored on our servers — it is handled entirely by your device's operating system. We only store your sign-in credentials in your device's secure keychain.",
            'We also gather certain technical details such as your device type, browser, and IP address, along with how you interact with the platform. This helps us improve performance and provide a smoother user experience.',
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
        title: 'Mobile App Permissions',
        content: [
            'Our mobile app requests the following permissions. Each one is optional and is used only for the feature described:',
        ],
        list: [
            'Camera — to scan vehicle VIN barcodes and to capture photos of vehicles, damage, and documents.',
            'Photo Library — to let you upload existing images from your device instead of taking a new photo.',
            'Location — to suggest nearby addresses when adding customer details. Used only while the app is open.',
            'Face ID / Touch ID / Fingerprint — for optional quick and secure sign-in.',
            'Storage — to save exported reports and invoices to your device.',
        ],
        afterList: [
            'You can grant or revoke any of these permissions at any time through your device settings. Declining a permission only disables that specific feature — the rest of the app continues to work normally.',
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
            'We use a small number of trusted third-party services to operate specific features, including mapping and address-lookup services for address suggestions, and barcode-scanning technology for VIN capture. These providers receive only the minimum information needed to perform their function, and are required to follow strict data protection standards.',
        ],
    },
    {
        title: 'Your Rights',
        content: [
            'You have full control over your data within Prorevv. You can access, update, or delete your information at any time through your account.',
            'You may also delete your account entirely from within the app, which removes your personal information from our active systems.',
            'If you need assistance with any data-related request, our support team is available to help.',
        ],
    },
    {
        title: 'Cookies and Tracking',
        content: [
            'Prorevv may use cookies or similar technologies on our website to improve functionality and understand user behavior.',
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
                        <p className="text-sm uppercase tracking-[0.3em] text-[#ffa8a8] mb-4">
                            Committed to your data privacy
                        </p>
                        <h2 className="text-3xl md:text-4xl font-semibold text-white mb-5">
                            At Prorevv, your information is handled with the same care as your business.
                        </h2>
                        <p className="text-white/70 leading-8">
                            We collect only what is necessary to power your workflows, support your operations, and keep your experience secure and reliable. Your data is never sold or rented, and we only share it when required to operate the service or meet legal obligations.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-[#101010] p-7 md:p-8 xl:p-10">
                        <p className="text-white/70 leading-7">
                            Last Updated: September 16, 2026
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {sections.map((section, index) => (
                            <div
                                key={index}
                                className="rounded-3xl border border-white/10 bg-[#101010] p-6  shadow-[0_18px_50px_rgba(0,0,0,0.22)]"
                            >
                                <h3 className="text-xl md:text-2xl font-semibold text-white mb-4">
                                    {section.title}
                                </h3>
                                <div className="space-y-1 text-white/70 leading-7">
                                    {section.content.map((paragraph, idx) => (
                                        <p className="text-base" key={idx}>{paragraph}</p>
                                    ))}
                                    {section.list && (
                                        <ul className="list-disc pl-5 space-y-2">
                                            {section.list.map((item, idx) => (
                                                <li className="text-base" key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                    )}
                                    {section.afterList?.map((paragraph, idx) => (
                                        <p className="text-base" key={idx}>{paragraph}</p>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-4xl border border-white/10 bg-linear-to-r from-[#1a0305] via-[#0a0a0a] to-[#1a0305] p-8 md:p-10">
                        <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                            Contact Us
                        </h3>
                        <p className="text-white/70 leading-7 mb-4">
                            If you have any questions about this Privacy Policy or how your data is handled, our support team is available to help.
                        </p>
                        <div className="space-y-2 text-white/70 leading-7">
                            <p>
                                Email:{' '}
                                <a
                                    href="mailto:info@ifshail.com"
                                    className="text-[#ffa8a8] hover:underline"
                                >
                                    info@ifshail.com
                                </a>
                            </p>
                            <p>
                                Phone:{' '}
                                <a
                                    href="tel:+12399197963"
                                    className="text-[#ffa8a8] hover:underline"
                                >
                                    +1-239-919-7963
                                </a>
                            </p>
                            <p>
                                You can also reach out through our contact page or the support channel in your Prorevv account.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-[#101010] p-7 md:p-8 xl:p-10">
                        <h3 className="text-xl md:text-2xl font-semibold text-white mb-4">
                            Footer Description
                        </h3>
                        <p className="text-white/70 leading-7">
                            Prorevv is a smart business management platform built for vehicle service and repair operations. It helps teams scan and track vehicles by VIN, manage customers and work orders, assign technicians, and generate invoices.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default page