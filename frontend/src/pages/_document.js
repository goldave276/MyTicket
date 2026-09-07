import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="fr" className="scroll-smooth">
      <Head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="MyTicket - Réservation et billetterie en ligne pour vos événements" />
      </Head>
      <body className="antialiased bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
