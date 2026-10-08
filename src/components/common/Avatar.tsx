import React from 'react';

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  size?: number;
  className?: string;
}

const COLORS = ['#00288e', '#0f766e', '#b45309', '#7c3aed', '#be123c', '#047857'];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export const Avatar: React.FC<AvatarProps> = ({ firstName = '', lastName = '', photoUrl, size = 32, className = '' }) => {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`${firstName} ${lastName}`.trim()}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover ring-1 ring-gray-200 ${className}`}
      />
    );
  }

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  const bg = colorFor(`${firstName}${lastName}` || 'user');

  return (
    <div
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.4 }}
      className={`rounded-full flex items-center justify-center text-white font-bold ring-1 ring-black/5 shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
};
