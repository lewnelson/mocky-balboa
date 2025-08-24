type Data = unknown;

export default class CacheHandler {
  async get(_key: string) {
    return null;
  }

  async set(_key: string, _data: Data, _ctx: { tags?: string[] }) {}

  async revalidateTag(_tags: string | string[]) {}

  // If you want to have temporary in memory cache for a single request that is reset
  // before the next request you can leverage this method
  resetRequestCache() {}
}
