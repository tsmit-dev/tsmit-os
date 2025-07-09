// src/lib/status-colors.ts

export function getStatusColorStyle(color: string | undefined | null): React.CSSProperties {
    const defaultColor = '#808080'; // Gray
    const backgroundColor = color || defaultColor;

    return {
        backgroundColor: backgroundColor,
        color: 'black', // Always black text
        border: `1px solid ${backgroundColor}`,
    };
}
