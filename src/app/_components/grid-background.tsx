'use client';

import { useEffect } from "react";

interface CustomGridProperties extends React.CSSProperties {
    '--grid-start': string;
    '--grid-end': string;
}

const GridBackground = ({
    sizex = 0,
    sizey = 1,
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

                #interactive-background {
                    position: fixed;
                    inset: 0;
                    z-index: 0;
                    /* 
                       Base background color and gradient mask 
                       This layer stays completely fixed to the viewport
                    */
                    background-color: var(--color-base);
                    background-image: 
                        linear-gradient(90deg, var(--color-base) 0%, transparent 59%),
                        linear-gradient(90deg, var(--color-base), var(--color-base));
                    background-position: 0px 0px, 0px 0px;
                    background-size: 100% 100%, 100% 100%;
                    animation: fadeIn 2s ease-in-out;
                }

                /* The scrolling grid layer */
                #interactive-background::after {
                    content: "";
                    position: absolute;
                    /* Make it much larger than the viewport so we can translate it without revealing edges */
                    top: -100vh;
                    left: -100vw;
                    width: 300vw;
                    height: 300vh;
                    z-index: -1;
                    
                    /* The repeating grid patterns */
                    background-image: 
                        repeating-linear-gradient(45deg, rgba(165, 173, 206, 0.1) 0px, rgba(165, 173, 206, 0.1) 1px, transparent 1px, transparent 40px),
                        repeating-linear-gradient(135deg, rgba(165, 173, 206, 0.1) 0px, rgba(165, 173, 206, 0.1) 1px, transparent 1px, transparent 40px);
                    
                    /* Apply scroll movement using transform for better performance and guaranteed infinite coverage */
                    transform: translate3d(var(--scroll-offset, 0px), var(--scroll-offset, 0px), 0);
                    will-change: transform;
                }

                /* The pseudo-element for the glowing effect */
                #interactive-background::before {
                    content: "";
                    position: absolute;
                    inset: 0;

                    /* The glowing effect that follows the mouse */
                    background: radial-gradient(
                        500px circle at var(--mouse-x) var(--mouse-y),
                        rgba(203, 166, 247, 0.1), /* Soft mauve glow */
                        transparent 80%
                    );
                    transition: background 0.2s ease-out;
                }
            `}</style>
            <div 
                id="interactive-background"
                style={{
                    '--grid-start': `${sizex}px`,
                    '--grid-end': `${sizey}px`,
                } as CustomGridProperties}
            ></div>
        </>
    );
};

export default GridBackground;