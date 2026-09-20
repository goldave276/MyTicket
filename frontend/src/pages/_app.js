import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { sans, mono } from "@/lib/fonts";

export default function App({ Component, pageProps }) {
  // If page specifies custom layout (e.g. auth pages without header/footer)
  const getLayout = Component.getLayout || ((page) => (
    <div className={`${sans.variable} ${mono.variable} min-h-screen flex flex-col justify-between bg-zinc-950 text-zinc-50 font-sans`}>
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {page}
      </main>
      <Footer />
    </div>
  ));

  return (
    <AuthProvider>
      <ToastProvider>
        {getLayout(<Component {...pageProps} />)}
      </ToastProvider>
    </AuthProvider>
  );
}
