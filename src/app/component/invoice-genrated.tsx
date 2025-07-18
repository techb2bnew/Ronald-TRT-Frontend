// components/InvoiceGenerator.tsx
import React, { useEffect, useState } from 'react';
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import Logo from "../../../public/trt-logo.png";

const initializePdfMake = () => {
    try {
        if (pdfFonts && pdfFonts.pdfMake?.vfs) {
            pdfMake.vfs = pdfFonts.pdfMake.vfs;
        }
        console.log("PDFMake initialized successfully ✅");
        return true;
    } catch (error) {
        console.error("Failed to initialize PDFMake ❌:", error);
        return false;
    }
};

interface InvoiceGeneratorProps {
    selectedJobs: any[];
}

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({ selectedJobs }) => {
    const [logoDataUrl, setLogoDataUrl] = useState<string>('');

    useEffect(() => {
        initializePdfMake();
        const getLogoDataUrl = async () => {
            try {
                const response = await fetch(Logo.src);
                const blob = await response.blob();
                return new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.error('Error loading logo:', error);
                return '';
            }
        };

        getLogoDataUrl().then(setLogoDataUrl);
    }, []);

    const generateInvoice = () => {
        if (!logoDataUrl) {
            alert('Logo is still loading, please try again');
            return;
        }

        try {
            const invoiceData = selectedJobs.map((job: any) => ({
                number: selectedJobs.indexOf(job) + 1,
                year: job.modelYear || 'N/A',
                make: job.make,
                model: job.model,
                color: job.color || 'N/A',
                service: 'PDR',
                price: job.totalCombined || 'N/A',
                pdr: job.pdr || '0',
                technicians: job.assignedTechnicians?.map((tech: any) => `${tech.firstName} ${tech.lastName}`).join(', ') || 'N/A',
                vin: job.vin,
            }));

            const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
            const invoiceDate = new Date().toLocaleDateString();
            const grandTotal = invoiceData.reduce((sum, job) => {
                const price = parseFloat(job.price) || 0;
                return sum + price;
            }, 0).toFixed(2);

            const docDefinition = {
                pageSize: 'A4',
                pageMargins: [20, 20, 20, 20],
                content: [
                    // Header
                    {
                        columns: [
                            {
                                width: '33%',
                                stack: [
                                    {
                                        image: logoDataUrl,
                                        width: 60,
                                        height: 60,
                                        margin: [0, 0, 0, 0]
                                    },
                                ]
                            },
                            {
                                width: '33%',
                                stack: [
                                    { text: selectedJobs[0]?.customer?.fullName || 'N/A', bold: true, fontSize: 14 },
                                    { text: selectedJobs[0]?.customer?.address || 'N/A' },
                                    { text: selectedJobs[0]?.customer?.email || 'N/A' },
                                    { text: selectedJobs[0]?.customer?.phoneNumber || 'N/A' }
                                ],
                                alignment: 'center'
                            },
                            {
                                width: '33%',
                                stack: [
                                    { text: `Invoice #: ${invoiceNumber}`, margin: [0, 5, 0, 0] },
                                    { text: `Date: ${invoiceDate}` }
                                ],
                                alignment: 'right'
                            },
                        ],
                        margin: [0, 0, 0, 10]
                    },
                    {
                        canvas: [{
                            type: 'line',
                            x1: 0, y1: 5,
                            x2: 550, y2: 5,
                            lineWidth: 1
                        }],
                        margin: [0, 0, 0, 0]
                    },
                    // Vehicle/Service blocks
                    ...invoiceData.flatMap((job, index) => [
                        {
                            text: `${job.number}`,
                            bold: true,
                            fontSize: 16,
                            margin: [0, 5, 0, 0]
                        },
                        {
                            columns: [
                                {
                                    width: '33%',
                                    text: `Year: ${job.year}`
                                },
                                {
                                    width: '33%',
                                    text: `Vin: ${job.vin}`
                                },
                                {
                                    width: '33%',
                                    text: `Total: $${job.price}`,
                                    bold: true,
                                    alignment: 'right'
                                },
                            ]
                        },
                        {
                            columns: [
                                {
                                    width: '33%',
                                    text: `Make: ${job.make}`
                                },
                                {
                                    width: '33%',
                                    text: `Model: ${job.model}`
                                }
                            ]
                        },
                        {
                            text: `Color: ${job.color}`,
                            margin: [0, 0, 0, 5]
                        },
                        {
                            text: 'Service Summary:',
                            fontSize: 12,
                            bold: true,
                            margin: [0, 0, 0, 5]
                        },
                        {
                            text: `${job.service}: $${job.pdr}`,
                            bold: true,
                            margin: [0, 0, 0, 5]
                        },
                        {
                            text: `Repaired By: - ${job.technicians}`,
                            bold: true,
                            margin: [0, 0, 0, 5]
                        },
                        index < invoiceData.length - 1 ? {
                            canvas: [{
                                type: 'line',
                                x1: 0, y1: 5,
                                x2: 550, y2: 5,
                                lineWidth: 0.5
                            }]
                        } : null
                    ].filter(Boolean)),
                    {
                        canvas: [{
                            type: 'line',
                            x1: 0, y1: 5,
                            x2: 550, y2: 5,
                            lineWidth: 0.5
                        }],
                    },
                    {
                        
                        columns: [
                            { width: '50%', text: 'I have inspected my vehicle(s) and am satisfied that Prorevv COMPANY, INC. has completed repairs to my satisfaction.\n\n', fontSize: 10 },
                            { width: '50%', text: `GRAND TOTAL: $${grandTotal}\n`, fontSize: 12, bold: true, alignment: 'right' },
                        ],
                        margin: [0, 20, 0, 20],
                        alignment: 'left'
                    },
                    // Footer
                    {
                        text: 'Thank you for your business!',
                        alignment: 'center',
                        italics: true,
                        margin: [0, 20, 0, 0]
                    }
                ],
                defaultStyle: {
                    fontSize: 10
                }
            };

            pdfMake.createPdf(docDefinition).open();
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('Failed to generate PDF. Please check console for details.');
        }
    };

    return (
        <button
            onClick={generateInvoice}
            disabled={!selectedJobs.length || !logoDataUrl}
            className="primary-bg text-sm border border-black-500 p-2 pl-5 pr-5 bg-black text-white rounded shadow-sm transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
            {selectedJobs.length ? `Print (${selectedJobs.length})` : 'Select Work Order to Print'}
        </button>
    );
};

export default InvoiceGenerator;