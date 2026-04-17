import AiPlayground from "./_components/ai-playground";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <section className="hero-stage">
        <div className="hero-grid mx-auto flex min-h-[62vh] max-w-7xl items-center justify-center px-5 py-12 sm:px-8 lg:px-10">
          <div className="hero-title-wrap relative z-10">
            <h1 className="hero-title font-serif tracking-normal">
              AI Playground
            </h1>
            <p className="hero-subtitle">灵感试运行</p>
          </div>
        </div>
      </section>

      <AiPlayground />
    </main>
  );
}
