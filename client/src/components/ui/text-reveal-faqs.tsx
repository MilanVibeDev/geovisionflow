'use client'

import React from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { motion } from "framer-motion";
import './faqs.css';

export default function FAQs() {
    const faqItems = [
        {
            id: 'item-1',
            question: 'What exactly do SEO, GEO, and AIO mean, and why should my business care?',
            answer: 'SEO (Search Engine Optimization) helps your website rank in traditional Google search. GEO (Generative Engine Optimization) focuses on appearing in AI-generated answers and brand recommendations. AIO (AI Input Optimization) ensures AI models like ChatGPT and Gemini can easily extract and understand your content. Our tool audits your performance across all three and provides an AI-generated roadmap to improve your visibility in the age of generative search.',
        },
        {
            id: 'item-2',
            question: 'How does your tool calculate my SEO/GEO/AIO scores?',
            answer: 'We perform a real-time crawl of your website to evaluate technical SEO factors like meta tags, content structure, and mobile readiness. We then integrate Google PageSpeed data for performance metrics. Finally, we use advanced AI models to analyze your content\'s "readability" for LLMs and its likelihood of being cited in generative answers, resulting in objective technical scores and AI-driven visibility insights.',
        },
        {
            id: 'item-3',
            question: 'What kind of businesses benefit most from this tool?',
            answer: 'Any business that relies on organic discovery—from local service providers to e-commerce stores and SaaS companies. If you want to know how AI assistants and search engines "see" your brand, our analysis provides the technical foundation needed to stay visible as the search landscape evolves.',
        },
        {
            id: 'item-4',
            question: 'How will this tool help me improve my rankings and AI visibility?',
            answer: 'You receive a prioritized AI Action Plan and a GEO Roadmap tailored specifically to your site\'s weaknesses. This includes technical fixes (like meta-tag optimizations), content improvements (like word count and clarity), and authority-building strategies. By following the roadmap, you ensure your site is technically sound for Google and highly "digestible" for AI crawlers.',
        },
        {
            id: 'item-5',
            question: 'Is it easy to use, and how much does it cost?',
            answer: 'Yes—simply enter your website URL and click "Analyze." Results are typically generated in under a minute. Our tool is currently free to use, providing instant technical audits and AI optimization insights without the need for complex setups or manual data entry. Start your first audit today to see your scores instantly!',
        },
    ];

    return (
        <section id="faq" className="faq-section">
            <div className="faq-container">
                <div className="faq-header">
                    <h2 className="faq-title">
                        Frequently Asked Questions
                    </h2>
                    <p className="faq-subtitle">
                        Everything you need to know about SEO, GEO, and AIO optimization.
                    </p>
                </div>

                <div className="faq-list">
                    <Accordion type="single" collapsible className="w-full">
                        {faqItems.map((item) => (
                            <AccordionItem
                                key={item.id}
                                value={item.id}
                                className="faq-accordion-item"
                            >
                                <AccordionTrigger className="faq-accordion-trigger">
                                    <span className="faq-question-text">
                                        {item.question}
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="faq-accordion-content">
                                    <BlurredStagger text={item.answer} />
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    )
}

export const BlurredStagger = ({
    text,
}: {
    text: string;
}) => {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.002,
            },
        },
    };

    const letterAnimation = {
        hidden: {
            opacity: 0,
            filter: "blur(4px)",
            y: 2
        },
        show: {
            opacity: 1,
            filter: "blur(0px)",
            y: 0
        },
    };

    return (
        <div className="faq-answer-container">
            <motion.p
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="faq-answer-text"
            >
                {text.split("").map((char, index) => (
                    <motion.span
                        key={index}
                        variants={letterAnimation}
                        transition={{ duration: 0.2 }}
                        className="faq-letter"
                    >
                        {char === " " ? "\u00A0" : char}
                    </motion.span>
                ))}
            </motion.p>
        </div>
    );
};
