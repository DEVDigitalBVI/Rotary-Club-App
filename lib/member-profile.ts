export const memberProfileRequirements = [
  { key: "phone", label: "Phone number", selfService: true },
  { key: "classification", label: "Classification", selfService: true },
  { key: "bio", label: "Short introduction", selfService: true },
] as const;

type MemberProfile = {
  phone?: string | null;
  classification?: string | null;
  bio?: string | null;
};

export function getMissingMemberProfileFields(profile: MemberProfile | null) {
  return memberProfileRequirements.filter(({ key }) => !profile?.[key]?.trim());
}
