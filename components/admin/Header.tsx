import { logOut } from "@/app/login/actions";

export default function Header({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string;
}) {
  return (
    <header className="flex h-18 items-center justify-end gap-3 px-6">
      <form action={logOut}>
        <button className="text-sm underline">Log out</button>
      </form>
      <span>{name}</span>
      <div className="size-11 overflow-hidden rounded-full bg-gray-300">
        {avatarUrl && (
          <img src={avatarUrl} alt="" className="size-full object-cover" />
        )}
      </div>
    </header>
  );
}
