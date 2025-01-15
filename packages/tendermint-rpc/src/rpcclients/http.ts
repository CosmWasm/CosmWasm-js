import axios from "axios";

// Global symbols in some environments
// https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
declare const fetch: any | undefined;

function filterBadStatus(res: any): any {
  if (res.status >= 400) {
    throw new Error(`Bad status on response: ${res.status}`);
  }
  return res;
}

/**
 * Node.js 18 comes with exprimental fetch support (https://nodejs.org/de/blog/announcements/v18-release-announce/).
 * This is nice, but the implementation does not yet work wekk for us. We
 * can just stick with axios on those systems for now.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function isExperimental(nodeJsFunc: Function): boolean {
  // This works because we get this info in node 18:
  //
  // > fetch.toString()
  // 'async function fetch(input, init = undefined) {\n' +
  // "    emitExperimentalWarning('The Fetch API');\n" +
  // '    return lazyUndici().fetch(input, init);\n' +
  // '  }'
  return nodeJsFunc.toString().includes("emitExperimentalWarning");
}

/**
 * Helper to work around missing CORS support in Tendermint (https://github.com/tendermint/tendermint/pull/2800)
 *
 * For some reason, fetch does not complain about missing server-side CORS support.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function http(
  method: "POST",
  url: string,
  headers: Record<string, string> | undefined,
  request?: any,
): Promise<any> {
  const timeout = Number(
    process.env.HTTP_TIMEOUT || 30000,
  );
  if (typeof fetch === "function" && !isExperimental(fetch)) {
    const settings = {
      method: method,
      signal: timeout,
      body: request ? JSON.stringify(request) : undefined,
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "Content-Type": "application/json",
        ...headers,
      },
    };
    return fetch(url, settings)
      .then(filterBadStatus)
      .then((res: any) => res.json());
  } else {
    return axios
      .request({ url: url, method: method, data: request, headers: headers, timeout })
      .then((res) => res.data);
  }
}
