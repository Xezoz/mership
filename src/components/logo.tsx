import React from 'react'

export const Logo = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Four compass points - closer to center */}
        <path d="M 100 55 L 102 65 L 100 63 L 98 65 Z" fill="currentColor" />
        <path d="M 100 135 L 102 125 L 100 127 L 98 125 Z" fill="currentColor" />
        <path d="M 55 100 L 65 98 L 63 100 L 65 102 Z" fill="currentColor" />
        <path d="M 145 100 L 135 98 L 137 100 L 135 102 Z" fill="currentColor" />

        {/* Pure abstract geometric shape suggesting movement */}
        <path d="M 85 110 L 100 75 L 115 110"
            fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="miter" />

        <path d="M 90 115 L 100 95 L 110 115"
            fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="miter" />

        <line x1="75" y1="105" x2="125" y2="105" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
    </svg>
)
