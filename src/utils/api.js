export function getCheckoutEndpoint() {
  if (process.env.REACT_APP_CHECKOUT_ENDPOINT) {
    return process.env.REACT_APP_CHECKOUT_ENDPOINT;
  }
  return '/api/checkout';
}

export async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    const preview = text.replace(/\s+/g, ' ').slice(0, 120);
    if (text.trimStart().startsWith('<')) {
      throw new Error(
        'Checkout API is unavailable. Run npm run dev (starts API + app) or set REACT_APP_CHECKOUT_ENDPOINT.'
      );
    }
    throw new Error(preview || `Unexpected response (${response.status})`);
  }
  return response.json();
}
