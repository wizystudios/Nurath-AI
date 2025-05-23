
import NKTechLogo from "./NKTechLogo";

export function Footer() {
  return (
    <footer className="border-t py-4 px-6 mt-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div className="mb-4 sm:mb-0">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Nurath.AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NKTechLogo size="sm" />
        </div>
      </div>
    </footer>
  );
}
