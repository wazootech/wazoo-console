import type { SparqlResponse } from "./sparql-presets";

// Render bindings/select query output
export function SparqlResults({ result }: { result: SparqlResponse | null }) {
  if (!result) return null;

  // 1. Check if it's ask boolean
  if (typeof result === "boolean" || (result && "boolean" in result)) {
    const answer = typeof result === "boolean" ? result : result.boolean;
    return (
      <div className="p-4 border rounded bg-zinc-900 border-zinc-800 text-center">
        <p className="text-zinc-400 text-sm">ASK Response</p>
        <p className="text-2xl font-bold mt-1 text-white">
          {answer ? "TRUE" : "FALSE"}
        </p>
      </div>
    );
  }

  // 2. Check for mutation success response (INSERT/DELETE DATA)
  if (result.message || result.ok || result.success || result.status === "ok") {
    const msg = result.message || "Graph update executed successfully.";
    return (
      <div className="p-4 border rounded bg-zinc-900/80 border-emerald-500/30 text-center">
        <p className="text-emerald-400 font-semibold text-sm">
          Update Successful
        </p>
        <p className="text-zinc-300 text-xs mt-1">{msg}</p>
      </div>
    );
  }

  // 3. Check if it's select bindings query
  if (result.head?.vars && result.results?.bindings) {
    const vars = result.head.vars as string[];
    const bindings = result.results.bindings as Array<
      Record<string, { value: unknown; type: string }>
    >;

    if (bindings.length === 0) {
      return (
        <p className="text-zinc-400 text-sm py-4">Query returned 0 results.</p>
      );
    }

    return (
      <div className="overflow-x-auto border border-zinc-800 rounded bg-zinc-950">
        <table className="w-full text-left text-sm text-zinc-300 border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900 text-zinc-400 font-medium">
              {vars.map((v) => (
                <th
                  key={v}
                  className="p-3 border-r border-zinc-800 last:border-r-0"
                >
                  ?{v}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bindings.map((binding, idx) => (
              <tr
                key={idx}
                className="border-b border-zinc-800 last:border-b-0 hover:bg-zinc-900/50"
              >
                {vars.map((v) => {
                  const cell = binding[v];
                  return (
                    <td
                      key={v}
                      className="p-3 border-r border-zinc-800 last:border-r-0 font-mono text-xs break-all max-w-xs"
                    >
                      {cell ? String(cell.value) : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // 3. Fallback raw JSON view
  return (
    <pre className="p-4 border rounded bg-zinc-900 border-zinc-800 text-xs font-mono overflow-auto max-h-96 text-zinc-300">
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}
