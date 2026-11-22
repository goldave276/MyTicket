import "@/styles/globals.css";
import Head from "next/head";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { sans, mono } from "@/lib/fonts";

export default function App({ Component, pageProps }) {
  // If page specifies custom layout (e.g. auth pages without header/footer)
  const getLayout = Component.getLayout || ((page) => (
    <div className={`${sans.variable} ${mono.variable} min-h-screen flex flex-col justify-between bg-[#08090e] text-slate-100 font-sans`}>
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        {page}
      </main>
      <Footer />
    </div>
  ));

  return (
    <ErrorBoundary>
      <Head>
        <meta
          key="viewport"
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"
        />
      </Head>
      <AuthProvider>
        <ToastProvider>
          {getLayout(<Component {...pageProps} />)}
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
