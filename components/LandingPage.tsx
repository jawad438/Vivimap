
import React, { useRef } from 'react';

interface LandingPageProps {
  onEnter: () => void;
}

const FAQItem: React.FC<{ question: string; children: React.ReactNode }> = ({ question, children }) => (
    <div className="max-w-xl">
        <h4 className="text-xl font-semibold text-white mb-2">{question}</h4>
        <p className="text-gray-400 font-light">{children}</p>
    </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
    const faqRef = useRef<HTMLDivElement>(null);

    const scrollToFaq = () => {
        faqRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="w-screen min-h-screen flex flex-col items-center justify-between p-6 bg-gray-900 text-white relative overflow-y-auto">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900 to-emerald-900/20 z-0"></div>
            <div className="absolute inset-0 opacity-[0.03] animated-map-bg" style={{backgroundImage: 'url(https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png)'.replace('{s}', 'a').replace('{z}', '1').replace('{x}', '0').replace('{y}', '0'), backgroundSize: 'cover'}}></div>
            
            <header className="w-full relative z-10 flex flex-col items-center pt-16 sm:pt-20 text-center">
                <a href="https://ibb.co/YTbRkk2q" target="_blank" rel="noopener noreferrer">
                    <img src="https://i.ibb.co/7NbYWWv6/Vivimap.png" alt="Vivimap Logo" className="w-48 h-auto" />
                </a>
                <h2 className="text-2xl font-bold tracking-tight text-white mt-4">
                    Own the World. One Pin at a Time.
                </h2>
                <p className="max-w-lg text-gray-400 mt-4">
                    Vivimap is the first platform where you can digitally own pieces of the real world — one 20x20 meter pin at a time.
                </p>
                <button 
                    onClick={scrollToFaq}
                    className="mt-4 text-emerald-400 hover:text-emerald-300 transition-colors underline-offset-4 hover:underline">
                    How it works
                </button>
            </header>
            
            <main className="relative z-10 flex flex-col items-center text-center my-16 sm:my-24">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">
                    The World Map is Opening
                </h1>
                <p className="text-lg text-gray-400 mb-8">Be among the first to claim your place in history.</p>

                <button
                    onClick={onEnter}
                    className="px-10 py-4 bg-emerald-600 text-white font-bold text-lg rounded-full hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-400 focus:ring-opacity-50 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-emerald-800/40 pulse-animation"
                >
                    Enter the Map
                </button>
                <p className="text-sm text-gray-500 mt-4">
                    No sign-up required to explore.
                </p>
            </main>

            <footer ref={faqRef} className="w-full relative z-10 flex flex-col items-center pb-12 space-y-8 text-center">
                <div className="w-full border-t border-white/10 my-8"></div>
                <h3 className="text-3xl font-bold">Frequently Asked Questions</h3>
                <div className="flex flex-col md:flex-row gap-8 md:gap-12 pt-4">
                    <FAQItem question="What is Vivimap?">
                        It's a digital layer over the real world. Think of it as a massive multiplayer game where the board is planet Earth, and the pieces are unique, collectible pins tied to real locations.
                    </FAQItem>
                    <FAQItem question="How does it work?">
                        You find a spot on the map you care about, and if it's available, you can claim it by placing a pin. That pin is then digitally yours. You can add your story, a photo, or just keep it as a marker of your digital presence.
                    </FAQItem>
                    <FAQItem question="Why should I care?">
                        It's a new way to connect with places, build a personal legacy, and be part of a global project. It's for explorers, storytellers, and anyone who's ever looked at a map and felt a sense of wonder.
                    </FAQItem>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;