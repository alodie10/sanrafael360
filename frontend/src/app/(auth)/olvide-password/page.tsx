import GoogleOnlyAuthNotice from "@/components/auth/GoogleOnlyAuthNotice";
import { noIndexPage } from "@/lib/seo";

export const metadata = noIndexPage("/olvide-password", "Recuperar acceso");

export default function ForgotPasswordPage() {
  return (
    <GoogleOnlyAuthNotice
      title="Acceso con Google"
      description="San Rafael 360 no usa email y contraseña. Para entrar, iniciá sesión con la misma cuenta de Google vinculada a tu perfil."
    />
  );
}
