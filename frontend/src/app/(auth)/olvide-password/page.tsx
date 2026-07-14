import type { Metadata } from "next";
import GoogleOnlyAuthNotice from "@/components/auth/GoogleOnlyAuthNotice";

export const metadata: Metadata = {
  title: "Recuperar acceso | San Rafael 360",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <GoogleOnlyAuthNotice
      title="Acceso con Google"
      description="San Rafael 360 no usa email y contraseña. Para entrar, iniciá sesión con la misma cuenta de Google vinculada a tu perfil."
    />
  );
}
