import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function App({ Component, pageProps }) {
  // If page specifies custom layout (e.g. auth pages without header/footer)
  const getLayout = Component.getLayout || ((page) => (
    <div className="min-h-screen flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans selection:bg-indigo-500 selection:text-white transition-colors">
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
