interface Env {
  ASSETS: Fetcher;
}

const CANONICAL_HOST = 'ailegalguard.com';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    let redirect = false;

    if (url.hostname === `www.${CANONICAL_HOST}`) {
      url.hostname = CANONICAL_HOST;
      redirect = true;
    }

    if (url.protocol === 'http:') {
      url.protocol = 'https:';
      redirect = true;
    }

    if (redirect) {
      return Response.redirect(url.toString(), 301);
    }

    return env.ASSETS.fetch(request);
  },
};
