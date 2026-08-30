"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
            fontFamily: "sans-serif",
            textAlign: "center",
          }}
        >
          <div>
            <h1>ReviewReply AI is temporarily unavailable.</h1>
            <p>
              Please retry the request. No account or provider details have been
              exposed.
            </p>
            <button onClick={reset}>Try again</button>
          </div>
        </main>
      </body>
    </html>
  );
}
