import React from 'react';

const getInitials = (name) => {
  if (!name) return '?';
  const names = name.split(' ');
  const initials = names.map(n => n[0]).join('');
  return initials.slice(0, 2).toUpperCase();
};

const Avatar = ({ src, name, className = '' }) => {
  const initials = getInitials(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`w-12 h-12 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg ${className}`}
    >
      {initials}
    </div>
  );
};

export default Avatar;