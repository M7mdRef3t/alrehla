import React, { useEffect, useRef } from 'react';

const KIND_LABELS = {
    ar: {
        narration: 'السرد',
        visual: 'الصورة',
        reflection: 'الصدى',
    },
    en: {
        narration: 'Narration',
        visual: 'Visual',
        reflection: 'Reflection',
    },
};

export default function Transcript({ blocks, uiLanguage = 'ar', visible }) {
    const scrollRef = useRef(null);
    const labels = KIND_LABELS[uiLanguage] || KIND_LABELS.en;

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [blocks]);

    if (!visible) return null;

    return (
        <div className="transcript">
            <div className="transcript__content" ref={scrollRef}>
                {blocks.map((block, idx) => (
                    <div
                        key={idx}
                        className={`transcript__bubble transcript__bubble--${block.kind}`}
                    >
                        <span className="transcript__label">{labels[block.kind] || labels.narration}</span>
                        <span className="transcript__text">{block.text_ar}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
