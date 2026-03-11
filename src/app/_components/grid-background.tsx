'use client';

import { useEffect } from "react";

interface CustomGridProperties extends React.CSSProperties {
    '--grid-start': string;
    '--grid-end': string;
}

const GridBackground = ({
    sizex = 0,
    sizey = 1,
    rippleRadius = "500px", // Size of the entire ripple effect
    rippleHoleSize = "20%", // Size of the dark hole in the center
}) => {
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const background = document.getElementById("interactive-background");
            if (background) {
                background.style.setProperty("--mouse-x", `${clientX}px`);
                background.style.setProperty("--mouse-y", `${clientY}px`);
            }
        };

        const handleScroll = () => {
            const background = document.getElementById("interactive-background");
            if (background) {
                // Move the background slowly relative to scroll position
                // Negative value makes it move "up" as we scroll down, but slower than the content
                background.style.setProperty("--scroll-offset", `-${window.scrollY * 0.3}px`);
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("scroll", handleScroll);
        
        // Initial setup
        handleScroll();

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    return (
        <>
            <style jsx={true} global={true}>{`
                html {
                    scroll-behavior: smooth;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                #interactive-root {
                    position: fixed;
                    inset: 0;
                    z-index: 0;
                    background-color: var(--color-base);
                    animation: fadeIn 2s ease-in-out;
                    overflow: hidden;
                    pointer-events: none;
                }

                .bg-scrolling-grid {
                    position: absolute;
                    inset: 0;
                    z-index: 1;
                    
                    /* The repeating grid patterns */
                    background-image: 
                        repeating-linear-gradient(45deg, rgba(165, 173, 206, 0.1) 0px, rgba(165, 173, 206, 0.1) 1px, transparent 1px, transparent 40px),
                        repeating-linear-gradient(135deg, rgba(165, 173, 206, 0.1) 0px, rgba(165, 173, 206, 0.1) 1px, transparent 1px, transparent 40px);
                    
                    /* Apply scroll movement seamlessly since repeating-gradients tile infinitely */
                    background-position: var(--scroll-offset, 0px) var(--scroll-offset, 0px);
                    will-change: background-position;
                }

                .bg-antigravity-ripple {
                    position: absolute;
                    inset: 0;
                    z-index: 2;
                    opacity: 0.4; /* Low opacity ripple */
                    pointer-events: none;
                    
                    /* User's antigravity background pattern, with a dark center to hide the lines but keep the background darkness */
                    background-image: 
                        radial-gradient(
                            var(--ripple-radius, 500px) circle at var(--mouse-x) var(--mouse-y),
                            rgb(0,0,0) 0%,
                            rgb(0,0,0) var(--ripple-hole, 20%),
                            transparent calc(var(--ripple-hole, 20%) + 2%)
                        ),
                        repeating-linear-gradient(112.5deg, rgb(0,0,0) 0px, rgb(0,0,0) 14px,transparent 14px, transparent 15px),
                        repeating-linear-gradient(22.5deg, rgb(0,0,0) 0px, rgb(0,0,0) 14px,transparent 14px, transparent 15px),
                        linear-gradient(90deg, hsl(146,54%,44%),hsl(218,54%,44%),hsl(290,54%,44%),hsl(2,54%,44%),hsl(74,54%,44%));
                    
                    /* Mask it so it only appears around the mouse */
                    -webkit-mask-image: radial-gradient(
                        var(--ripple-radius, 500px) circle at var(--mouse-x) var(--mouse-y),
                        rgba(0, 0, 0, 1) 0%,
                        rgba(0, 0, 0, 1) 35%,
                        transparent 80%
                    );
                    mask-image: radial-gradient(
                        var(--ripple-radius, 500px) circle at var(--mouse-x) var(--mouse-y),
                        rgba(0, 0, 0, 1) 0%,
                        rgba(0, 0, 0, 1) 35%,
                        transparent 80%
                    );
                    
                    transition: -webkit-mask-image 0.2s ease-out, mask-image 0.2s ease-out;
                }

                .bg-mask-and-glow {
                    position: absolute;
                    inset: 0;
                    z-index: 3;
                    /* 
                       Combine the static left transparency mask (Base -> Transparent) 
                       and the interactive mouse glow 
                    */
                    background-image: 
                        radial-gradient(
                            500px circle at var(--mouse-x) var(--mouse-y),
                            rgba(203, 166, 247, 0.1), /* Soft mauve glow */
                            transparent 80%
                        ),
                        linear-gradient(90deg, var(--color-base) 0%, transparent 59%);
                    transition: background 0.2s ease-out;
                }
            `}</style>
            <div 
                id="interactive-background"
                style={{
                    '--grid-start': `${sizex}px`,
                    '--grid-end': `${sizey}px`,
                    '--ripple-radius': rippleRadius,
                    '--ripple-hole': rippleHoleSize,
                } as CustomGridProperties & { '--ripple-radius': string; '--ripple-hole': string }}
            >
                <div id="interactive-root">
                    <div className="bg-scrolling-grid" />
                    <div className="bg-antigravity-ripple" />
                    <div className="bg-mask-and-glow" />
                </div>
            </div>
        </>
    );
};

export default GridBackground;