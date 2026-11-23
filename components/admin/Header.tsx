import NavLinks from "./NavLinks";
import ProfileMenu from "./ProfileMenu";

export default function Header({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string;
}) {
  return (
    <header className="flex h-18 shrink-0 items-center justify-between gap-6 border-b bg-white px-6">
      <NavLinks />
      <ProfileMenu name={name} avatarUrl={avatarUrl} />
    </header>
  );
}
