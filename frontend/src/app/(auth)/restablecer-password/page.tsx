import type { Metadata } from "next";
import GoogleOnlyAuthNotice from "@/components/auth/GoogleOnlyAuthNotice";

export const metadata: Metadata = {
  title: "Restablecer contraseña | San Rafael 360",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <GoogleOnlyAuthNotice
      title="Acceso con Google"
      description="Ya no restablecemos contraseñas porque el ingreso es solo con Google. Usá el botón de abajo para continuar."
    />
  );
}
