import React from 'react';

interface AppLogoIconProps {
  className?: string;
  color?: string;
}

/**
 * Clean, lightweight inline SVG icon of UjianPintar logo (< 1 KB)
 */
export const AppLogoIcon: React.FC<AppLogoIconProps> = ({
  className = 'w-6 h-auto',
  color = 'currentColor',
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3015.7 1520.9"
      fill="none"
      className={className}
      style={{ shapeRendering: 'geometricPrecision' }}
      aria-label="Logo UjianPintar"
    >
      <g fill={color}>
        {/* Right emblem ("P") */}
        <path d="M1448.5 1486.7l496.9 1.7 107.2 -401.4c255.5,2.5 477.3,8.1 681.1,-113.7 372.1,-222.6 414.3,-827.9 -107.3,-942.7 -194,-42.7 -568.6,-29.9 -781.1,-24.7l-396.8 1480.8zm700 -753.8c155.9,-5.2 305.6,-5.7 352,-132.6 66.2,-181.1 -119.5,-203.3 -265.8,-197.5l-86.2 330.1z" />
        {/* Left emblem ("U") */}
        <path d="M1521.2 650.3l-458.4 -157.2c-69.6,262.8 -105.1,637.1 -405.6,581.2 -292.2,-54.5 -45,-520.8 -13.7,-733.1l-460 -158c-35.1,129.8 -67.6,252.1 -101.9,378.2 -36.4,133.5 -79.4,263.3 -81.5,409.8 -4.5,307.4 174.6,482.9 447.1,531.1 303.6,53.8 601.5,-11.5 774.7,-168.5 77,-69.9 140,-175.2 190,-298.2 34,-83.7 98,-291 109.3,-385.3z" />
        {/* Top Mortarboard accent */}
        <path d="M1566.5 468.7l23.8 -52.1c5.3,-18.3 9.7,-37.9 14.5,-56 22.9,-86.1 84,-289.7 88.6,-353.5l-1441.8 -2.2c24.4,24.9 118.6,51.9 154.8,65.1 156.9,56.8 1095.5,392.2 1160.1,398.7z" />
      </g>
    </svg>
  );
};

interface AppLogoBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'solid' | 'gradient';
  className?: string;
  iconClassName?: string;
}

/**
 * Standard UjianPintar Brand Badge: Blue background with white icon
 */
export const AppLogoBadge: React.FC<AppLogoBadgeProps> = ({
  size = 'md',
  variant = 'solid',
  className = '',
  iconClassName = '',
}) => {
  const sizeMap = {
    xs: 'w-7 h-7 rounded-lg',
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-11 h-11 rounded-xl',
    xl: 'w-14 h-14 rounded-2xl',
  };

  const iconSizeMap = {
    xs: 'w-4 h-auto',
    sm: 'w-5 h-auto',
    md: 'w-6 h-auto',
    lg: 'w-7 h-auto',
    xl: 'w-9 h-auto',
  };

  const bgVariant =
    variant === 'gradient'
      ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 shadow-lg shadow-blue-600/25 border border-blue-400/30'
      : 'bg-blue-600 shadow-md shadow-blue-500/20';

  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 text-white ${bgVariant} ${sizeMap[size]} ${className}`}
    >
      <AppLogoIcon
        className={`${iconSizeMap[size]} ${iconClassName}`}
        color="white"
      />
    </div>
  );
};
