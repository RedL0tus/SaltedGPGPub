'use strict';

// Constants
const GIST_URL = 'https://api.github.com/gists/3ae55eb09f311c346b1540db94344c17';
const REQUEST_ID_PATTERN = new RegExp('^/(?<id>((?:[a-fA-F0-9]{8})(?:[a-fA-F0-9]{8})?(?:[a-fA-F0-9]{24})?))$');
const FILENAME_PATTERN = new RegExp('^(?<id>[a-fA-F0-9]{40})(?:(.asc)|(.pub)|(.gpg))?$');

/**
 * Download Gist data from GitHub API
 * @param  {string}   gist_url URL to GitHub Gist API endpoint
 * @return {Response}          API response
 */
async function getGist(gist_url) {
  let response = await fetch(gist_url, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'SaltedGPGPub',
    },
  });
  response = new Response(response.body, response);
  response.headers.append('Cache-Control', 's-maxage=600');
  return response;
}

/**
 * Parse GPG key ID from request URL
 * @param  {string}  request_url URL from request
 * @return {?string}             Key ID extracted from request URL
 */
async function getRequestID(request_url) {
  const url = new URL(request_url);
  let match = REQUEST_ID_PATTERN.exec(url.pathname);
  if (match === null) {
    return null;
  }
  return match.groups.id;
}

/**
 * Match public key data from Gist content and requested key ID
 * @param  {Object}  gist_content Parsed JSON data from Gist API
 * @param  {string}  request_id   Requested key ID
 * @return {?string}              Matched public key content
 */
async function matchKey(gist_content, request_id) {
  for (const filename in gist_content['files']) {
    let match = FILENAME_PATTERN.exec(filename);
    if (match === null) {
      continue;
    }
    let key_id = match.groups.id;
    if (key_id.endsWith(request_id)) {
      return gist_content['files'][filename]['content'];
    }
  }
  return null;
}

/**
 * Construct a response with necessary headers, etc.
 * @param  {number}   status_code   Status code to be returned
 * @param  {string}   response_body Body of the response
 * @return {Response}               Constructed Response object
 */
async function constructResponse(status_code, response_body) {
  return new Response(response_body, {
    status: status_code,
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8',
      Server: 'SaltedGPGPub',
      'Cache-Control': 's-maxage=86400',
    },
  });
}

addEventListener('fetch', event => {
  return event.respondWith(handleEvent(event, event.request));
});

/**
 * Respond to the request
 * @param  {Event}    event   Event to be handled
 * @param  {Request}  request Request object to be handled
 * @return {Response}         Response to the request
 */
async function handleEvent(event, request) {
  // Get request key ID
  const request_id = await getRequestID(request.url);
  if (request_id === null) {
    return await constructResponse(400, 'Err: Invalid ID\n');
  }

  // Get Gist content
  // For some unknown reason, event.waitUntil only works in this function.
  const cache = caches.default;
  const cacheUrl = new URL(GIST_URL);
  const cacheKey = new Request(cacheUrl.toString(), request);
  let gist = await cache.match(cacheKey);
  if (!gist) {
    gist = await getGist(GIST_URL);
    event.waitUntil(cache.put(cacheKey, gist.clone()));
  }
  const gist_content = await gist.json();

  // Match key content
  const matched_key = await matchKey(gist_content, request_id);
  if (matched_key === null) {
    return await constructResponse(400, 'Err: Key Not Recognized or Database is Empty\n');
  }

  // Return public key
  return await constructResponse(200, matched_key);
}
