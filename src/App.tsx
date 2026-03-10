import { HorseSvgScene } from "./components/HorseSvgScene";

function App() {
  return (
    <main className="app-shell">
      <header className="header">
        <h1>2026 Year of the Horse</h1>
        <p>kangchainx 真实 GitHub 贡献热力带</p>
      </header>

      <HorseSvgScene />

      <section className="notes-panel">
        <article>
          <h2>这次改动</h2>
          <p>页面现在默认读取 kangchainx 的真实 GitHub contribution calendar，不再使用随机 mock 数据充当热力带。</p>
        </article>
        <article>
          <h2>接入方式</h2>
          <p>构建前通过 GitHub GraphQL 抓取贡献日历并写入本地 JSON，前端静态页再读取这份数据，因此适合 GitHub Pages。</p>
        </article>
        <article>
          <h2>后续方向</h2>
          <p>下一步可以把用户名做成可配置项，或者在 GitHub Actions 里定时刷新 JSON，这样页面会自动跟随真实贡献变化。</p>
        </article>
      </section>
    </main>
  );
}

export default App;
