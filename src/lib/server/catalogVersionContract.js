export const getCatalogVersionHttpState = (snapshot, ifNoneMatch = '') => {
  const aggregateSha256 = String(snapshot?.aggregateSha256 || '');
  if (!/^[a-f0-9]{64}$/i.test(aggregateSha256)) throw new Error('CATALOG_VERSION_INVALID');
  const revision = Number(snapshot?.revision);
  if (!Number.isInteger(revision) || revision < 1) throw new Error('CATALOG_REVISION_INVALID');
  const etag = `"${aggregateSha256}"`;
  const headers = {
    'cache-control': 'public, max-age=0, s-maxage=0, must-revalidate',
    etag,
    'x-catalog-revision': String(revision),
    'x-catalog-version': aggregateSha256,
  };
  return {
    status: ifNoneMatch === etag ? 304 : 200,
    headers,
    payload: {
      revision,
      aggregateSha256,
      publishedAt: snapshot.generatedAt || null,
    },
  };
};
