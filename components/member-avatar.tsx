import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type AvatarMember = {
  name: string;
  initials: string;
  avatarColor: string;
  avatarUrl?: string;
};

export function MemberAvatar({
  member,
  className,
  fallbackClassName,
}: {
  member: AvatarMember | undefined;
  className?: string;
  fallbackClassName?: string;
}) {
  return (
    <Avatar className={className}>
      {member?.avatarUrl && (
        <AvatarImage src={member.avatarUrl} alt={member.name} />
      )}
      <AvatarFallback
        className={cn("font-semibold text-white", fallbackClassName)}
        style={{ backgroundColor: member?.avatarColor }}
      >
        {member?.initials}
      </AvatarFallback>
    </Avatar>
  );
}
