import React, { useMemo } from 'react';
import useReducedMotion from '../../hooks/useReducedMotion.js';

function splitText(text, uiLanguage) {
  const value = String(text || '');
  if (!value.trim()) return [];

  if (uiLanguage === 'ar') {
    return Array.from(value).map((glyph) => ({
      value: glyph,
      isSpace: /\s/.test(glyph),
    }));
  }

  return value.split(/(\s+)/).filter(Boolean).map((chunk) => ({
    value: chunk,
    isSpace: /^\s+$/.test(chunk),
  }));
}

export default function KineticText({
  text = '',
  uiLanguage = 'ar',
  className = '',
  as = 'span',
  surface = 'generic',
  emphasis = 'soft',
}) {
  const prefersReducedMotion = useReducedMotion();
  const units = useMemo(() => splitText(text, uiLanguage), [text, uiLanguage]);
  const content = String(text || '').trim();

  if (!content) return null;

  const Component = as;
  const baseClassName = [
    'kinetic-text',
    `kinetic-text--${surface}`,
    `kinetic-text--${uiLanguage === 'ar' ? 'arabic' : 'latin'}`,
    `kinetic-text--${emphasis}`,
    className,
  ].filter(Boolean).join(' ');

  if (prefersReducedMotion || units.length === 0) {
    return (
      <Component className={`${baseClassName} kinetic-text--reduced`}>
        {content}
      </Component>
    );
  }

  let glyphIndex = 0;

  return (
    <Component className={baseClassName}>
      {units.map((unit, index) => {
        if (unit.isSpace) {
          return <span key={`space_${index}`} className="kinetic-text__space">{unit.value}</span>;
        }

        const style = { '--glyph-index': glyphIndex };
        glyphIndex += 1;

        return (
          <span key={`glyph_${index}`} className="kinetic-text__glyph" style={style}>
            {unit.value}
          </span>
        );
      })}
    </Component>
  );
}
