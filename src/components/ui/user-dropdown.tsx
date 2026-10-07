import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";

interface UserDropdownProps {
  user?: {
    name: string;
    username?: string;
    email?: string;
    avatar?: string;
    initials: string;
    status?: string;
  };
  onAction?: (action: string) => void;
  onStatusChange?: (status: string) => void;
  selectedStatus?: string;
  isAdmin?: boolean;
  align?: "start" | "center" | "end";
}

const STATUS_ITEMS = [
  { value: "online", icon: "solar:check-circle-line-duotone", label: "Online" },
  { value: "focus", icon: "solar:emoji-funny-circle-line-duotone", label: "Focus" },
  { value: "offline", icon: "solar:moon-sleep-line-duotone", label: "Appear Offline" },
];

const statusBadgeClass = (status?: string) => {
  switch ((status || "online").toLowerCase()) {
    case "offline":
      return "border-zinc-300 bg-zinc-100 text-zinc-600";
    case "focus":
      return "border-amber-300 bg-amber-100 text-amber-700";
    default:
      return "border-emerald-300 bg-emerald-100 text-emerald-700";
  }
};

export const UserDropdown = ({
  user = { name: "Guest", initials: "G", status: "online" },
  onAction = () => {},
  onStatusChange = () => {},
  selectedStatus = "online",
  isAdmin = false,
  align = "end",
}: UserDropdownProps) => {
  const item = (icon: string, label: string, action: string, opts: { danger?: boolean; iconClass?: string } = {}) => (
    <DropdownMenuItem key={action} onClick={() => onAction(action)} className="cursor-pointer gap-2">
      <Icon icon={icon} className={cn("h-4 w-4", opts.iconClass, opts.danger && "text-destructive")} />
      <span className={cn(opts.danger && "text-destructive")}>{label}</span>
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account menu"
          className="rounded-full p-0.5 ring-1 ring-border hover:ring-fire/40 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="gradient-fire-strong text-white text-xs font-bold">
              {user.initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} sideOffset={8} className="w-72 p-2">
        <div className="flex items-start gap-3 p-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="gradient-fire-strong text-white text-xs font-bold">
              {user.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
              {isAdmin && (
                <Badge className="h-4 bg-fire/15 text-fire border-0 px-1.5 text-[10px]">ADMIN</Badge>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">{user.email || user.username}</p>
            <Badge variant="outline" className={cn("mt-1 h-5 capitalize text-[10px] font-medium", statusBadgeClass(selectedStatus))}>
              {selectedStatus}
            </Badge>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <Icon icon="solar:pulse-line-duotone" className="h-4 w-4" />
              Update status
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={selectedStatus} onValueChange={onStatusChange}>
                  {STATUS_ITEMS.map((s) => (
                    <DropdownMenuRadioItem key={s.value} value={s.value} className="gap-2">
                      <Icon icon={s.icon} className="h-4 w-4" /> {s.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {item("solar:user-circle-line-duotone", "Dashboard", "dashboard")}
          {isAdmin && item("solar:settings-line-duotone", "Admin panel", "admin")}
          {item("solar:bag-heart-line-duotone", "My purchases", "purchases")}
          {item("solar:heart-line-duotone", "Wishlist", "wishlist")}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {item("solar:star-bold", "Upgrade to Pro", "upgrade", { iconClass: "text-amber-500" })}
          {item("solar:gift-line-duotone", "Referrals", "referrals")}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {item("solar:question-circle-line-duotone", "Help & support", "help")}
          {item("solar:letter-unread-line-duotone", "What's new?", "whats-new")}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {item("solar:logout-2-bold-duotone", "Log out", "logout", { danger: true })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
