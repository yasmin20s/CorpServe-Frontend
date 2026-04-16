import { Link } from 'react-router';
import { User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { resolveMediaUrl } from '../lib/mediaUrl';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

const sizeClasses = {
  xs: 'h-7 w-7 min-h-7 min-w-7 text-[10px]',
  sm: 'h-9 w-9 min-h-9 min-w-9 text-xs',
  md: 'h-11 w-11 min-h-11 min-w-11 text-sm',
  lg: 'h-14 w-14 min-h-14 min-w-14 text-base',
};

function initialsFromName(name) {
  const s = String(name || '').trim();
  if (!s) return '?';
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

/**
 * Clickable avatar navigating to /{viewerRole}/user/{userId}.
 */
export default function UserAvatar({
  userId,
  name,
  profilePictureUrl,
  size = 'sm',
  className,
  linkClassName,
  stopPropagation = false,
}) {
  const { user } = useAuth();
  const viewerRole = String(user?.role || 'client').toLowerCase();
  const uid = userId != null ? String(userId).trim() : '';
  const pic = resolveMediaUrl(profilePictureUrl);
  const sz = sizeClasses[size] || sizeClasses.sm;

  const inner = (
    <span
      className={cx(
        'inline-flex items-center justify-center overflow-hidden rounded-full border border-indigo-200/80 bg-gradient-to-br from-indigo-100 to-sky-100 font-semibold text-indigo-800 shadow-sm ring-2 ring-white/80',
        sz,
        className,
      )}
    >
      {pic ? (
        <img src={pic} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span className="select-none">{initialsFromName(name)}</span>
      )}
    </span>
  );

  if (!uid) {
    return (
      <span className={cx('inline-flex items-center gap-2', linkClassName)}>
        {inner}
        {name ? <span className="truncate font-medium text-slate-800">{name}</span> : null}
      </span>
    );
  }

  const to = `/${viewerRole}/user/${encodeURIComponent(uid)}`;

  return (
    <Link
      to={to}
      className={cx('inline-flex max-w-full items-center gap-2 rounded-lg outline-none transition hover:bg-slate-50/80 focus-visible:ring-2 focus-visible:ring-indigo-400', linkClassName)}
      title={name ? `View ${name}` : 'View profile'}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
      }}
    >
      {inner}
      {name ? <span className="min-w-0 truncate font-medium text-slate-800">{name}</span> : null}
    </Link>
  );
}

export function UserAvatarIconOnly(props) {
  const { user } = useAuth();
  const viewerRole = String(user?.role || 'client').toLowerCase();
  const uid = props.userId != null ? String(props.userId).trim() : '';
  const pic = resolveMediaUrl(props.profilePictureUrl);
  const sz = sizeClasses[props.size] || sizeClasses.sm;

  if (!uid) {
    return (
      <span className={cx('inline-flex rounded-full border border-slate-200 bg-slate-100 p-1.5 text-slate-500', sz, props.className)}>
        <User className="h-4 w-4" />
      </span>
    );
  }

  const to = `/${viewerRole}/user/${encodeURIComponent(uid)}`;

  return (
    <Link
      to={to}
      title={props.name ? `View ${props.name}` : 'View profile'}
      className={cx(
        'inline-flex items-center justify-center overflow-hidden rounded-full border border-indigo-200/80 bg-gradient-to-br from-indigo-100 to-sky-100 font-semibold text-indigo-800 shadow-sm',
        sz,
        props.className,
      )}
      onClick={(e) => {
        if (props.stopPropagation) e.stopPropagation();
      }}
    >
      {pic ? (
        <img src={pic} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span className="select-none text-[10px]">{initialsFromName(props.name)}</span>
      )}
    </Link>
  );
}
