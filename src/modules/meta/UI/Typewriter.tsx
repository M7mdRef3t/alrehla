import React, { useState, useEffect } from 'react';

interface TypewriterProps {
    text: string;
    speed?: number;
    delay?: number;
    className?: string;
    onComplete?: () => void;
}

export const Typewriter: React.FC<TypewriterProps> = ({
    text,
    speed = 30,
    delay = 0,
    className = "",
    onComplete
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const [index, setIndex] = useState(0);
    const [isStarted, setIsStarted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsStarted(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    useEffect(() => {
        if (!isStarted) return;

        if (index < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText((prev) => prev + text[index]);
                setIndex((prev) => prev + 1);
            }, speed);
            return () => clearTimeout(timeout);
        } else if (onComplete) {
            onComplete();
        }
    }, [index, text, speed, isStarted, onComplete]);

    // Reset if text changes
    useEffect(() => {
        setDisplayedText('');
        setIndex(0);
    }, [text]);

    return (
        <span className={className}>
            {displayedText}
            {index < text.length && (
                <span className="inline-block w-1.5 h-4 bg-teal-500 ml-1 animate-pulse align-middle" />
            )}
        </span>
    );
};
