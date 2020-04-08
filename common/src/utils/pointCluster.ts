type Elements = [number, number][];

export class Cluster {
  static _centroid(set: Elements) {
    return set.reduce((s, e) => [s[0] + e[0], s[1] + e[1]], [0, 0]).map((e) => e / set.length) as [number, number];
  }
  static _dist(lat1: number, lon1: number, lat2: number, lon2: number) {
    const dlat = lat2 - lat1;
    const dlon = lon2 - lon1;

    return Math.sqrt(dlat * 2 + dlon * 2);
  }

  static cluster(elements: Elements, bias: number = 1) {
    const self = this;

    let totDiff = 0;
    const diffs = [];
    let diff;

    // calculate sum of differences
    for (let i = 1; i < elements.length; i++) {
      diff = self._dist(elements[i][0], elements[i][1], elements[i - 1][0], elements[i - 1][1]);
      totDiff += diff;
      diffs.push(diff);
    }

    // calculate mean diff
    const meanDiff = totDiff / diffs.length;
    let diffVariance = 0;

    // calculate variance total
    diffs.forEach((d) => {
      diffVariance += (d - meanDiff) ** 2;
    });

    // derive threshold from stdev and bias
    const diffStdev = Math.sqrt(diffVariance / diffs.length);
    const threshold = diffStdev * bias;

    let clusterMap: {centroid: [number, number]; elements: Elements}[] = [];

    // generate random initial cluster map
    clusterMap.push({
      centroid: elements[Math.floor(Math.random() * elements.length)],
      elements: [],
    });

    // loop elements and distribute them to clusters
    let changing = true;
    while (changing) {
      let newCluster = false;
      let clusterChanged = false;

      // iterate over elements
      elements.forEach((e, ei) => {
        let closestDist = Infinity;
        let closestCluster: number | null = null;

        // find closest cluster
        clusterMap.forEach((cluster, ci) => {
          // distance to cluster
          const dist = self._dist(e[0], e[1], clusterMap[ci].centroid[0], clusterMap[ci].centroid[1]);

          if (dist < closestDist) {
            closestDist = dist;
            closestCluster = ci;
          }
        });

        // is the closest distance smaller than the stddev of elements?
        if (closestDist < threshold || closestDist === 0) {
          // put element into existing cluster
          clusterMap[closestCluster!].elements.push(e);
        } else {
          // create a new cluster with this element
          clusterMap.push({
            centroid: e,
            elements: [e],
          });

          newCluster = true;
        }
      });

      // delete empty clusters from cluster_map
      clusterMap = clusterMap.filter((cluster) => cluster.elements.length > 0);

      // calculate the clusters centroids and check for change
      clusterMap.forEach((cluster, ci) => {
        const centroid = self._centroid(cluster.elements);
        if (centroid[0] !== cluster.centroid[0] || centroid[1] !== cluster.centroid[1]) {
          clusterMap[ci].centroid = centroid;
          clusterChanged = true;
        }
      });

      // loop cycle if clusters have changed
      if (!clusterChanged && !newCluster) {
        changing = false;
      } else {
        // remove all elements from clusters and run again
        if (changing)
          clusterMap = clusterMap.map((cluster) => {
            cluster.elements = [];
            return cluster;
          });
      }
    }

    // compress result
    return clusterMap;
  }
}
