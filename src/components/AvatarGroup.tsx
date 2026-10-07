const avatars = [
  'https://i.pravatar.cc/80?img=12',
  'https://i.pravatar.cc/80?img=32',
  'https://i.pravatar.cc/80?img=47',
  'https://i.pravatar.cc/80?img=56',
  'https://i.pravatar.cc/80?img=68',
];

export default function AvatarGroup({ count = '200+', label = 'happy builders' }: { count?: string; label?: string }) {
  return (
    <div className="inline-flex items-center gap-3">
      <div className="flex -space-x-3">
        {avatars.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            loading="lazy"
            className="w-10 h-10 rounded-full ring-2 ring-white object-cover shadow-md hover:scale-110 hover:z-10 transition"
            style={{ zIndex: avatars.length - i }}
          />
        ))}
        <div className="w-10 h-10 rounded-full ring-2 ring-white bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs font-bold flex items-center justify-center shadow-md">
          +50
        </div>
      </div>
      <div className="text-left">
        <div className="font-bold text-ink text-sm">{count}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
