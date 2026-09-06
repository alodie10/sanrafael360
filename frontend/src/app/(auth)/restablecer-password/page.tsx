import GoogleOnlyAuthNotice from "@/components/auth/GoogleOnlyAuthNotice";
import { noIndexPage } from "@/lib/seo";

export const metadata = noIndexPage(
  "/restablecer-password",
  "Restablecer contraseña"
);

export default function ResetPasswordPage() {
  return (
    <GoogleOnlyAuthNotice
      title="Acceso con Google"
      description="Ya no restablecemos contraseñas porque el ingreso es solo con Google. Usá el botón de abajo para continuar."
    />
  );
}
