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

                .bg-fog {
                    position: absolute;
                    inset: 0;
                    z-index: 2;
                    
                    background-image: 
                        linear-gradient(67.5deg, rgb(215, 215, 215) 0%, rgb(215, 215, 215) 46%,rgb(198, 198, 198) 46%, rgb(198, 198, 198) 49%,rgb(181, 181, 181) 49%, rgb(181, 181, 181) 56%,rgb(164, 164, 164) 56%, rgb(164, 164, 164) 61%,rgb(146, 146, 146) 61%, rgb(146, 146, 146) 75%,rgb(129, 129, 129) 75%, rgb(129, 129, 129) 84%,rgb(112, 112, 112) 84%, rgb(112, 112, 112) 100%),
                        linear-gradient(22.5deg, rgb(215, 215, 215) 0%, rgb(215, 215, 215) 46%,rgb(198, 198, 198) 46%, rgb(198, 198, 198) 49%,rgb(181, 181, 181) 49%, rgb(181, 181, 181) 56%,rgb(164, 164, 164) 56%, rgb(164, 164, 164) 61%,rgb(146, 146, 146) 61%, rgb(146, 146, 146) 75%,rgb(129, 129, 129) 75%, rgb(129, 129, 129) 84%,rgb(112, 112, 112) 84%, rgb(112, 112, 112) 100%),
                        linear-gradient(112.5deg, rgb(215, 215, 215) 0%, rgb(215, 215, 215) 46%,rgb(198, 198, 198) 46%, rgb(198, 198, 198) 49%,rgb(181, 181, 181) 49%, rgb(181, 181, 181) 56%,rgb(164, 164, 164) 56%, rgb(164, 164, 164) 61%,rgb(146, 146, 146) 61%, rgb(146, 146, 146) 75%,rgb(129, 129, 129) 75%, rgb(129, 129, 129) 84%,rgb(112, 112, 112) 84%, rgb(112, 112, 112) 100%),
                        linear-gradient(90deg, rgb(231, 231, 231),rgb(195, 195, 195));
                    
                    background-blend-mode: overlay, overlay, overlay, normal;
                    /* Use mix-blend-mode to nicely blend this grey layer into the dark Catppuccin theme */
                    mix-blend-mode: overlay;
                    opacity: 0.1; /* "make it lighter" */
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
                } as CustomGridProperties}
            >
                <div id="interactive-root">
                    <div className="bg-scrolling-grid" />
                    <div className="bg-fog" />
                    <div className="bg-mask-and-glow" />
                </div>
            </div>
        </>
    );
};

export default GridBackground;