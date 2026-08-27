import React from 'react';

/**
 * Renders a PNG as a CSS-mask coloured icon.
 * Memoised — only re-renders when props actually change.
 */
const MaskIcon = React.memo(({ src, size = 18, color = '#CCCCCC' }) => (
    <div
        style={{
            width: size,
            height: size,
            backgroundColor: color,
            maskImage: `url(${src})`,
            WebkitMaskImage: `url(${src})`,
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
            flexShrink: 0,
        }}
    />
));

MaskIcon.displayName = 'MaskIcon';
export default MaskIcon;