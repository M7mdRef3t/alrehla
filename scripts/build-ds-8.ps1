
    </div>
    <div class="ds-card">
      <div style="font-weight:800;margin-bottom:var(--sp-2);color:var(--c-violet-400)">3. هيكل مكوّن React / Next.js</div>
      <div class="ds-code"><span class="k">function</span> AlrehlaCard({ icon, title, description, cta }) {
  <span class="k">return</span> (
    &lt;div className=<span class="s">"ds-card"</span>&gt;
      &lt;div style={{ display:<span class="s">'flex'</span>, gap:<span class="s">'1rem'</span> }}&gt;
        &lt;div style={{ background:<span class="s">'rgba(45,212,191,.12)'</span>,
          borderRadius:<span class="s">'var(--radius)'</span>, padding:<span class="s">'12px'</span> }}&gt;
          {icon}
        &lt;/div&gt;
        &lt;div&gt;
          &lt;h3 style={{ fontWeight:800 }}&gt;{title}&lt;/h3&gt;
          &lt;p style={{ color:<span class="s">'var(--text-secondary)'</span> }}&gt;{description}&lt;/p&gt;
        &lt;/div&gt;
      &lt;/div&gt;
      &lt;button className=<span class="s">"btn btn-sm btn-primary"</span>&gt;{cta}&lt;/button&gt;
    &lt;/div&gt;
  );
}
