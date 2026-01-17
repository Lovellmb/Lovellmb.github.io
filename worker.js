const ALLOWED_ORIGIN = "https://lovellmb.github.io";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

async function handleRequest(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  const url = new URL(request.url);

  if (url.pathname === "/gemini" && request.method === "POST") {
    return handleGemini(request);
  }

  if (url.pathname === "/addLog" && request.method === "POST") {
    return handleAddLog(request);
  }

  if (url.pathname === "/getLog" && request.method === "GET") {
    return handleGetLog(request);
  }

  return new Response("Not found", {
    status: 404,
    headers: corsHeaders(),
  });
}

async function handleGemini(request) {
  const body = await request.json();

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gpt-4o-mini:generateContent?key=" +
      GEMINI_API_KEY,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
  });
}

async function handleAddLog(request) {
  const data = await request.json();
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const record = { id, timestamp, ...data };

  await LOGS.put(id, JSON.stringify(record));

  return new Response(JSON.stringify({ status: "ok", id }), {
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
  });
}

async function handleGetLog(request) {
  const list = await LOGS.list({ limit: 50 });
  const results = [];

  for (const item of list.keys) {
    const value = await LOGS.get(item.name);
    results.push(JSON.parse(value));
  }

  return new Response(JSON.stringify({ status: "ok", result: results }), {
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request) {
    return handleRequest(request);
  },
};
